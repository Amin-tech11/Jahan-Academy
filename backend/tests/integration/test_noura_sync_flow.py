from __future__ import annotations

import asyncio
import os
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import authorization_context
from app.modules.integrations.contracts import (
    NouraCreateResult,
    NouraLeadInput,
    RetryableNouraError,
)
from app.modules.integrations.repository import NouraRepository
from app.modules.integrations.service import NouraSyncService

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL and Redis",
)


class SuccessAdapter:
    async def create_lead(
        self,
        lead: NouraLeadInput,
        *,
        idempotency_key: str,
    ) -> NouraCreateResult:
        del idempotency_key
        return NouraCreateResult(external_id=f"NOURA-{lead.reference}")


class RetryableAdapter:
    async def create_lead(
        self,
        lead: NouraLeadInput,
        *,
        idempotency_key: str,
    ) -> NouraCreateResult:
        del lead, idempotency_key
        raise RetryableNouraError("NOURA_RETRYABLE_HTTP_503")


def _sync_database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _create_actor() -> UUID:
    actor_id = uuid4()
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
    return actor_id


def _lead_id(reference: str) -> UUID:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id FROM leads WHERE public_reference = %s", (reference,))
        row = cursor.fetchone()
        assert row is not None
        return UUID(str(row[0]))


def _state(lead_id: UUID) -> dict[str, Any]:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "SELECT sync.status, sync.external_id, sync.attempt_count, sync.last_error_safe, "
            "outbox.status, outbox.attempts, outbox.manual_retry_count "
            "FROM integration_sync_records sync JOIN integration_outbox outbox "
            "ON outbox.provider = sync.provider AND outbox.aggregate_type = sync.entity_type "
            "AND outbox.aggregate_id = sync.entity_id "
            "WHERE sync.provider = 'noura' AND sync.entity_type = 'lead' "
            "AND sync.entity_id = %s",
            (lead_id,),
        )
        row = cursor.fetchone()
        assert row is not None
        return {
            "sync_status": row[0],
            "external_id": row[1],
            "sync_attempts": row[2],
            "error": row[3],
            "outbox_status": row[4],
            "outbox_attempts": row[5],
            "manual_retries": row[6],
        }


def _force_due(lead_id: UUID) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "UPDATE integration_outbox SET next_attempt_at = now() "
            "WHERE provider = 'noura' AND aggregate_type = 'lead' AND aggregate_id = %s",
            (lead_id,),
        )


def _cleanup(actor_id: UUID, references: list[str]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute("SELECT id FROM leads WHERE public_reference = ANY(%s)", (references,))
        lead_ids = [row[0] for row in cursor.fetchall()]
        if lead_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (lead_ids,))
            cursor.execute(
                "DELETE FROM integration_outbox WHERE aggregate_id = ANY(%s)", (lead_ids,)
            )
            cursor.execute(
                "DELETE FROM integration_sync_records WHERE entity_id = ANY(%s)", (lead_ids,)
            )
            cursor.execute("DELETE FROM consent_records WHERE lead_id = ANY(%s)", (lead_ids,))
            cursor.execute("DELETE FROM leads WHERE id = ANY(%s)", (lead_ids,))
        cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))


def _payload(mobile: str, country: str) -> dict[str, Any]:
    return {
        "firstName": "Noura",
        "lastName": "Integration",
        "mobile": mobile,
        "desiredCountryText": country,
        "intakeTerm": "fall",
        "startYear": datetime.now(UTC).year + 1,
        "locale": "fa",
        "source": {"pageUrl": "/fa/consultation"},
        "privacyConsent": True,
        "contactConsent": True,
    }


async def _dispatch(adapter: SuccessAdapter | RetryableAdapter) -> dict[str, int]:
    engine = create_async_engine(os.environ["JAHAN_DATABASE_URL"], pool_pre_ping=True)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    try:
        async with factory() as session:
            return await NouraSyncService(NouraRepository(session), adapter).process_due(
                limit=20,
                lock_timeout_seconds=60,
                worker_id="integration-test",
            )
    finally:
        await engine.dispose()


def test_noura_success_retry_exhaustion_and_manual_recovery() -> None:
    actor_id = _create_actor()
    context = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="support",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"lead.read.all", "lead.sync.retry"}),
            ),
        ),
    )

    async def context_override() -> AuthorizationContext:
        return context

    app.dependency_overrides[authorization_context] = context_override
    references: list[str] = []
    suffix_a = uuid4().int % 1_000_000_000
    suffix_b = uuid4().int % 1_000_000_000

    try:
        with TestClient(app) as client:
            successful = client.post(
                "/api/v1/consultation-requests",
                json=_payload(f"09{suffix_a:09d}", f"Germany {uuid4().hex[:6]}"),
            )
            failing = client.post(
                "/api/v1/consultation-requests",
                json=_payload(f"09{suffix_b:09d}", f"Canada {uuid4().hex[:6]}"),
            )
            assert successful.status_code == 201, successful.text
            assert failing.status_code == 201, failing.text
            references.extend(
                [successful.json()["data"]["reference"], failing.json()["data"]["reference"]]
            )
            success_id = _lead_id(references[0])
            failing_id = _lead_id(references[1])

            result = asyncio.run(_dispatch(SuccessAdapter()))
            assert result["synced"] == 2
            assert _state(success_id)["sync_status"] == "synced"
            assert _state(success_id)["external_id"] == f"NOURA-{references[0]}"

            with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE integration_outbox SET status = 'pending', attempts = 0, "
                    "completed_at = NULL, next_attempt_at = now() WHERE aggregate_id = %s",
                    (failing_id,),
                )
                cursor.execute(
                    "UPDATE integration_sync_records SET status = 'pending', external_id = NULL, "
                    "attempt_count = 0, synced_at = NULL WHERE entity_id = %s",
                    (failing_id,),
                )

            for attempt in range(1, 7):
                result = asyncio.run(_dispatch(RetryableAdapter()))
                assert result["claimed"] == 1
                state = _state(failing_id)
                assert state["outbox_attempts"] == attempt
                if attempt < 6:
                    assert state["sync_status"] == "pending"
                    assert state["outbox_status"] == "failed"
                    _force_due(failing_id)

            failed = _state(failing_id)
            assert failed["sync_status"] == "failed"
            assert failed["outbox_status"] == "dead"
            assert failed["sync_attempts"] == 6
            assert failed["error"] == "NOURA_RETRYABLE_HTTP_503"

            retried = client.post(
                f"/api/v1/admin/leads/{failing_id}/noura-retry",
                json={"note": "Provider recovered; retry requested"},
            )
            assert retried.status_code == 202, retried.text
            assert retried.json()["data"]["status"] == "pending"
            assert retried.json()["data"]["manualRetryCount"] == 1
            assert _state(failing_id)["outbox_status"] == "pending"

            duplicate_retry = client.post(f"/api/v1/admin/leads/{failing_id}/noura-retry")
            assert duplicate_retry.status_code == 409
            assert duplicate_retry.json()["error"]["code"] == "SYNC_NOT_RETRYABLE"

            recovered = asyncio.run(_dispatch(SuccessAdapter()))
            assert recovered["synced"] == 1
            final = _state(failing_id)
            assert final["sync_status"] == "synced"
            assert final["external_id"] == f"NOURA-{references[1]}"
            assert final["manual_retries"] == 1
    finally:
        app.dependency_overrides.clear()
        _cleanup(actor_id, references)
