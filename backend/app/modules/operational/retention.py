from __future__ import annotations

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class RetentionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def anonymize_expired_leads(self, *, years: int, limit: int) -> int:
        rows = await self._session.execute(
            text(
                """
                WITH candidates AS (
                    SELECT id FROM leads
                    WHERE anonymized_at IS NULL
                      AND greatest(created_at, updated_at) < now() - make_interval(years => :years)
                    ORDER BY updated_at ASC LIMIT :limit FOR UPDATE SKIP LOCKED
                ), anonymized AS (
                    UPDATE leads SET first_name = 'Anonymized', last_name = 'Lead',
                      mobile_raw = 'anonymized', mobile_normalized = '+10000000000', email = NULL,
                      desired_country_id = NULL, desired_country_text = NULL, message = NULL,
                      source_url = NULL, source_university_id = NULL, source_program_id = NULL,
                      campaign_id = NULL, assigned_consultant_id = NULL, anonymized_at = now(),
                      age = NULL, gender_code = NULL, gender_self_description = NULL,
                      occupation = NULL, marital_status_code = NULL,
                      investment_range_code = NULL, investment_currency = NULL,
                      user_id = NULL, intake_code = NULL, start_year = NULL,
                      deduplication_key = NULL, archive_reason = NULL,
                      updated_at = now()
                    WHERE id IN (SELECT id FROM candidates) RETURNING id
                )
                INSERT INTO audit_logs (action, entity_type, entity_id, after_safe)
                SELECT 'lead.retention_anonymized', 'lead', id,
                       jsonb_build_object('retention', true)
                FROM anonymized RETURNING entity_id
                """
            ),
            {"years": years, "limit": limit},
        )
        ids = [row[0] for row in rows.all()]
        if not ids:
            return 0
        # All copies belonging to the same retained lead are scrubbed atomically.
        # Keep operational IDs and timestamps; remove applicant data and free text.
        for statement in (
            "UPDATE lead_notes SET body = '[Anonymized]', edited_at = now() "
            "WHERE lead_id = ANY(:ids)",
            "UPDATE lead_status_history SET reason = NULL WHERE lead_id = ANY(:ids)",
            "UPDATE lead_submission_events SET source_url = NULL, request_fingerprint_hash = NULL, "
            "metadata_safe = '{}' WHERE lead_id = ANY(:ids)",
            "UPDATE consent_records SET user_id = NULL, source = 'retention', evidence = '{}' "
            "WHERE lead_id = ANY(:ids)",
            "UPDATE audit_logs SET before_safe = NULL, "
            "after_safe = jsonb_build_object('retention', true), ip_hash = NULL, user_agent = NULL "
            "WHERE entity_type = 'lead' AND entity_id = ANY(:ids)",
            "UPDATE integration_outbox SET payload = jsonb_build_object('retention', true), "
            "status = 'dead', "
            "last_error_safe = NULL, updated_at = now() "
            "WHERE aggregate_type = 'lead' AND aggregate_id = ANY(:ids)",
            "UPDATE integration_sync_records SET external_id = NULL, last_error_safe = NULL "
            "WHERE entity_type = 'lead' AND entity_id = ANY(:ids)",
            "UPDATE consultation_sessions SET report = NULL WHERE booking_id IN "
            "(SELECT id FROM consultation_bookings WHERE lead_id = ANY(:ids))",
            "UPDATE consultation_bookings SET user_id = NULL, meeting_external_id = NULL, "
            "meeting_url_encrypted = NULL WHERE lead_id = ANY(:ids)",
        ):
            await self._session.execute(text(statement), {"ids": ids})
        return len(ids)

    async def remove_expired_idempotency_keys(self) -> int:
        result = await self._session.execute(
            text("DELETE FROM idempotency_keys WHERE expires_at <= now() RETURNING id")
        )
        return len(result.all())
