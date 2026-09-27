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
                      updated_at = now()
                    WHERE id IN (SELECT id FROM candidates) RETURNING id
                )
                INSERT INTO audit_logs (action, entity_type, entity_id, after_safe)
                SELECT 'lead.retention_anonymized', 'lead', id, '{"retention":true}'::jsonb
                FROM anonymized RETURNING entity_id
                """
            ),
            {"years": years, "limit": limit},
        )
        return len(rows.all())

    async def remove_expired_idempotency_keys(self) -> int:
        result = await self._session.execute(
            text("DELETE FROM idempotency_keys WHERE expires_at <= now() RETURNING id")
        )
        return len(result.all())
