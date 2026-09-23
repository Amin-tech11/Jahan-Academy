from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.integrations.contracts import NouraLeadInput


@dataclass(frozen=True, slots=True)
class NouraOutboxJob:
    id: UUID
    lead_id: UUID
    idempotency_key: str
    attempt: int


class NouraRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def claim_due(
        self,
        *,
        worker_id: str,
        limit: int,
        lock_timeout_seconds: int,
    ) -> list[NouraOutboxJob]:
        rows = await self.session.execute(
            text(
                "WITH candidates AS ("
                "SELECT id FROM integration_outbox "
                "WHERE provider = 'noura' AND aggregate_type = 'lead' "
                "AND ((status IN ('pending', 'failed') AND next_attempt_at <= now()) "
                "OR (status = 'processing' AND locked_at < "
                "now() - (:lock_timeout * interval '1 second'))) "
                "ORDER BY next_attempt_at, created_at FOR UPDATE SKIP LOCKED LIMIT :limit"
                ") UPDATE integration_outbox outbox "
                "SET status = 'processing', attempts = outbox.attempts + 1, "
                "locked_at = now(), locked_by = :worker_id, updated_at = now() "
                "FROM candidates WHERE outbox.id = candidates.id "
                "RETURNING outbox.id, outbox.aggregate_id AS lead_id, "
                "outbox.idempotency_key, outbox.attempts AS attempt"
            ),
            {
                "worker_id": worker_id,
                "limit": limit,
                "lock_timeout": lock_timeout_seconds,
            },
        )
        return [NouraOutboxJob(**dict(row._mapping)) for row in rows]

    async def lead_input(self, lead_id: UUID) -> NouraLeadInput | None:
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT l.id AS lead_id, l.public_reference AS reference, "
                        "l.first_name, l.last_name, l.mobile_normalized AS mobile, l.email, "
                        "COALESCE(l.desired_country_text, country.name) AS desired_country, "
                        "l.intake_code AS intake, l.start_year, l.locale, l.source_url "
                        "FROM leads l LEFT JOIN LATERAL ("
                        "SELECT name FROM country_translations "
                        "WHERE country_id = l.desired_country_id "
                        "ORDER BY CASE locale WHEN 'en' THEN 0 ELSE 1 END LIMIT 1"
                        ") country ON true WHERE l.id = :id"
                    ),
                    {"id": lead_id},
                )
            )
            .mappings()
            .one_or_none()
        )
        return NouraLeadInput.model_validate(dict(row)) if row else None

    async def mark_success(
        self,
        job: NouraOutboxJob,
        *,
        external_id: str,
    ) -> None:
        await self.session.execute(
            text(
                "UPDATE integration_outbox SET status = 'succeeded', completed_at = now(), "
                "locked_at = NULL, locked_by = NULL, last_error_safe = NULL, updated_at = now() "
                "WHERE id = :id AND status = 'processing'"
            ),
            {"id": job.id},
        )
        await self.session.execute(
            text(
                "UPDATE integration_sync_records SET status = 'synced', "
                "external_id = :external_id, idempotency_key = :idempotency_key, "
                "attempt_count = attempt_count + 1, last_attempt_at = now(), "
                "synced_at = now(), last_error_safe = NULL, updated_at = now() "
                "WHERE provider = 'noura' AND entity_type = 'lead' AND entity_id = :lead_id"
            ),
            {
                "lead_id": job.lead_id,
                "external_id": external_id,
                "idempotency_key": job.idempotency_key,
            },
        )

    async def mark_failure(
        self,
        job: NouraOutboxJob,
        *,
        safe_error: str,
        final: bool,
        next_attempt_at: datetime,
    ) -> None:
        outbox_status = "dead" if final else "failed"
        sync_status = "failed" if final else "pending"
        await self.session.execute(
            text(
                "UPDATE integration_outbox SET status = :outbox_status, "
                "next_attempt_at = :next_attempt_at, locked_at = NULL, locked_by = NULL, "
                "completed_at = CASE WHEN :final THEN now() ELSE NULL END, "
                "last_error_safe = :safe_error, updated_at = now() "
                "WHERE id = :id AND status = 'processing'"
            ),
            {
                "id": job.id,
                "outbox_status": outbox_status,
                "next_attempt_at": next_attempt_at,
                "final": final,
                "safe_error": safe_error,
            },
        )
        await self.session.execute(
            text(
                "UPDATE integration_sync_records SET status = :sync_status, "
                "idempotency_key = :idempotency_key, attempt_count = attempt_count + 1, "
                "last_attempt_at = now(), last_error_safe = :safe_error, updated_at = now() "
                "WHERE provider = 'noura' AND entity_type = 'lead' AND entity_id = :lead_id"
            ),
            {
                "lead_id": job.lead_id,
                "sync_status": sync_status,
                "idempotency_key": job.idempotency_key,
                "safe_error": safe_error,
            },
        )

    async def request_manual_retry(self, lead_id: UUID) -> dict[str, Any] | None:
        row = (
            (
                await self.session.execute(
                    text(
                        "WITH retryable AS ("
                        "SELECT outbox.id FROM integration_outbox outbox "
                        "JOIN integration_sync_records sync "
                        "ON sync.provider = outbox.provider "
                        "AND sync.entity_type = outbox.aggregate_type "
                        "AND sync.entity_id = outbox.aggregate_id "
                        "WHERE outbox.provider = 'noura' AND outbox.aggregate_type = 'lead' "
                        "AND outbox.aggregate_id = :lead_id AND outbox.status = 'dead' "
                        "AND sync.status = 'failed' FOR UPDATE OF outbox, sync"
                        ") UPDATE integration_outbox outbox "
                        "SET status = 'pending', attempts = 0, next_attempt_at = now(), "
                        "locked_at = NULL, locked_by = NULL, completed_at = NULL, "
                        "last_error_safe = NULL, manual_retry_count = manual_retry_count + 1, "
                        "updated_at = now() FROM retryable WHERE outbox.id = retryable.id "
                        "RETURNING outbox.attempts, outbox.manual_retry_count, "
                        "outbox.next_attempt_at"
                    ),
                    {"lead_id": lead_id},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            return None
        await self.session.execute(
            text(
                "UPDATE integration_sync_records SET status = 'pending', "
                "last_error_safe = NULL, updated_at = now() "
                "WHERE provider = 'noura' AND entity_type = 'lead' AND entity_id = :lead_id"
            ),
            {"lead_id": lead_id},
        )
        return dict(row)

    async def lead_sync_exists(self, lead_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                text(
                    "SELECT EXISTS(SELECT 1 FROM integration_sync_records "
                    "WHERE provider = 'noura' AND entity_type = 'lead' AND entity_id = :lead_id)"
                ),
                {"lead_id": lead_id},
            )
        )

    async def audit_manual_retry(
        self,
        *,
        actor_user_id: UUID,
        lead_id: UUID,
        note: str | None,
        manual_retry_count: int,
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO audit_logs "
                "(actor_user_id, action, entity_type, entity_id, after_safe) "
                "VALUES (:actor, 'lead.noura_retry_requested', 'lead', :lead_id, "
                "CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_user_id,
                "lead_id": lead_id,
                "after": json.dumps(
                    {
                        "syncStatus": "pending",
                        "manualRetryCount": manual_retry_count,
                        "operatorNotePresent": bool(note),
                    }
                ),
            },
        )
