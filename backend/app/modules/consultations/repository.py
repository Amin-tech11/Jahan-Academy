from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.consultations.domain import SourceEntityType


@dataclass(frozen=True, slots=True)
class LeadRecord:
    id: UUID
    public_reference: str
    created_at: datetime


@dataclass(frozen=True, slots=True)
class IdempotencyRecord:
    request_hash: str
    response_status: int
    response_body: dict[str, Any]


class ConsultationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def advisory_lock(self, key: int) -> None:
        await self.session.execute(text("SELECT pg_advisory_xact_lock(:key)"), {"key": key})

    async def country_is_public(self, country_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                text(
                    "SELECT EXISTS(SELECT 1 FROM countries WHERE id = :id "
                    "AND status = 'published' AND deleted_at IS NULL)"
                ),
                {"id": country_id},
            )
        )

    async def currency_is_active(self, currency: str) -> bool:
        return bool(
            await self.session.scalar(
                text("SELECT EXISTS(SELECT 1 FROM currencies WHERE code = :code AND active)"),
                {"code": currency},
            )
        )

    async def source_is_public(self, entity_type: SourceEntityType | str, entity_id: UUID) -> bool:
        if entity_type == SourceEntityType.UNIVERSITY:
            statement = text(
                "SELECT EXISTS(SELECT 1 FROM universities WHERE id = :id "
                "AND status = 'published' AND deleted_at IS NULL)"
            )
        else:
            statement = text(
                "SELECT EXISTS(SELECT 1 FROM programs WHERE id = :id "
                "AND status = 'published' AND deleted_at IS NULL)"
            )
        return bool(await self.session.scalar(statement, {"id": entity_id}))

    async def find_duplicate(self, deduplication_key: str, window_hours: int) -> LeadRecord | None:
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT id, public_reference, created_at FROM leads "
                        "WHERE deduplication_key = :key AND anonymized_at IS NULL "
                        "AND created_at >= now() - make_interval(hours => :window_hours) "
                        "ORDER BY created_at DESC LIMIT 1 FOR UPDATE"
                    ),
                    {"key": deduplication_key, "window_hours": window_hours},
                )
            )
            .mappings()
            .one_or_none()
        )
        return LeadRecord(**row) if row else None

    async def create_lead(self, values: dict[str, Any]) -> LeadRecord:
        row = (
            (
                await self.session.execute(
                    text(
                        "INSERT INTO leads ("
                        "public_reference, first_name, last_name, mobile_raw, mobile_normalized, "
                        "email, desired_country_id, desired_country_text, intake_code, start_year, "
                        "age, gender_code, gender_self_description, occupation, "
                        "marital_status_code, "
                        "investment_range_code, investment_currency, message, locale, source_url, "
                        "source_university_id, source_program_id, deduplication_key"
                        ") VALUES ("
                        ":public_reference, :first_name, :last_name, :mobile_raw, "
                        ":mobile_normalized, :email, :desired_country_id, :desired_country_text, "
                        ":intake_code, :start_year, :age, :gender_code, :gender_self_description, "
                        ":occupation, :marital_status_code, :investment_range_code, "
                        ":investment_currency, :message, :locale, :source_url, "
                        ":source_university_id, :source_program_id, :deduplication_key"
                        ") RETURNING id, public_reference, created_at"
                    ),
                    values,
                )
            )
            .mappings()
            .one()
        )
        return LeadRecord(**row)

    async def record_consent(
        self,
        *,
        lead_id: UUID,
        consent_type: str,
        policy_version: str,
        locale: str,
        evidence: dict[str, Any],
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO consent_records "
                "(lead_id, consent_type, policy_version, granted, locale, source, evidence) "
                "VALUES (:lead_id, :consent_type, :policy_version, true, :locale, "
                "'public_consultation_form', CAST(:evidence AS jsonb))"
            ),
            {
                "lead_id": lead_id,
                "consent_type": consent_type,
                "policy_version": policy_version,
                "locale": locale,
                "evidence": json.dumps(evidence),
            },
        )

    async def record_submission_event(
        self,
        *,
        lead_id: UUID,
        event_type: str,
        source_url: str,
        request_fingerprint_hash: str,
        metadata_safe: dict[str, Any],
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO lead_submission_events "
                "(lead_id, event_type, source_url, request_fingerprint_hash, metadata_safe) "
                "VALUES (:lead_id, :event_type, :source_url, :fingerprint, "
                "CAST(:metadata AS jsonb))"
            ),
            {
                "lead_id": lead_id,
                "event_type": event_type,
                "source_url": source_url,
                "fingerprint": request_fingerprint_hash,
                "metadata": json.dumps(metadata_safe),
            },
        )

    async def increment_duplicate(self, lead_id: UUID) -> None:
        await self.session.execute(
            text(
                "UPDATE leads SET duplicate_count = duplicate_count + 1, "
                "last_duplicate_at = now(), updated_at = now() WHERE id = :id"
            ),
            {"id": lead_id},
        )

    async def initialize_lead_workflow(self, lead_id: UUID) -> None:
        await self.session.execute(
            text(
                "INSERT INTO lead_status_history (lead_id, new_status, reason) "
                "VALUES (:lead_id, 'new', 'Public consultation request submitted')"
            ),
            {"lead_id": lead_id},
        )
        await self.session.execute(
            text(
                "INSERT INTO integration_outbox "
                "(aggregate_type, aggregate_id, provider, event_type, idempotency_key, payload) "
                "VALUES ('lead', :lead_id, 'noura', 'lead.created', :idempotency_key, "
                "CAST(:payload AS jsonb))"
            ),
            {
                "lead_id": lead_id,
                "idempotency_key": f"noura:lead:{lead_id}",
                "payload": json.dumps({"schemaVersion": 1, "leadId": str(lead_id)}),
            },
        )
        await self.session.execute(
            text(
                "INSERT INTO integration_sync_records "
                "(provider, entity_type, entity_id, status) "
                "VALUES ('noura', 'lead', :lead_id, 'pending')"
            ),
            {"lead_id": lead_id},
        )

    async def get_idempotency(self, key: str) -> IdempotencyRecord | None:
        await self.session.execute(
            text(
                "DELETE FROM idempotency_keys WHERE scope = 'consultation.submit' "
                "AND idempotency_key = :key AND expires_at <= now()"
            ),
            {"key": key},
        )
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT request_hash, response_status, response_body "
                        "FROM idempotency_keys WHERE scope = 'consultation.submit' "
                        "AND idempotency_key = :key AND expires_at > now()"
                    ),
                    {"key": key},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None or row["response_status"] is None or row["response_body"] is None:
            return None
        return IdempotencyRecord(**row)

    async def save_idempotency(
        self,
        *,
        key: str,
        request_hash: str,
        response_status: int,
        response_body: dict[str, Any],
        lead_id: UUID,
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO idempotency_keys "
                "(scope, idempotency_key, request_hash, response_status, response_body, "
                "resource_type, resource_id, expires_at) "
                "VALUES ('consultation.submit', :key, :request_hash, :response_status, "
                "CAST(:response_body AS jsonb), 'lead', :lead_id, now() + interval '24 hours')"
            ),
            {
                "key": key,
                "request_hash": request_hash,
                "response_status": response_status,
                "response_body": json.dumps(response_body),
                "lead_id": lead_id,
            },
        )
