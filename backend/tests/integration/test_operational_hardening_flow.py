from __future__ import annotations

import asyncio
import os
from uuid import uuid4

import psycopg
import pytest

from app.core.database import session_factory
from app.modules.operational.retention import RetentionRepository

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires migrated PostgreSQL"
)


def _database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


async def _enforce_retention() -> tuple[int, int]:
    async with session_factory() as session:
        repository = RetentionRepository(session)
        anonymized = await repository.anonymize_expired_leads(years=3, limit=10)
        expired_keys = await repository.remove_expired_idempotency_keys()
        await session.commit()
        return anonymized, expired_keys


def test_retention_anonymizes_expired_leads_and_removes_expired_idempotency() -> None:
    lead_id = uuid4()
    with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            """INSERT INTO leads (
                 id, public_reference, first_name, last_name, mobile_raw, mobile_normalized,
                 locale, created_at, updated_at
               ) VALUES (
                 %s, 'RETENTION-TEST-001', 'Old', 'Lead', '+989121234567', '+989121234567',
                 'fa', now() - INTERVAL '4 years', now() - INTERVAL '4 years'
               )""",
            (lead_id,),
        )
        cursor.execute(
            """INSERT INTO idempotency_keys (scope, idempotency_key, request_hash, expires_at)
               VALUES (
                 'retention.test', 'retention-expired-key', repeat('a', 64),
                 now() - INTERVAL '1 day'
               )"""
        )

    try:
        anonymized, expired_keys = asyncio.run(_enforce_retention())
        assert anonymized >= 1
        assert expired_keys >= 1
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute(
                "SELECT first_name, email, message, anonymized_at FROM leads WHERE id = %s",
                (lead_id,),
            )
            row = cursor.fetchone()
            assert row is not None
            assert row[:3] == ("Anonymized", None, None)
            assert row[3] is not None
            cursor.execute(
                """SELECT count(*) FROM audit_logs
                   WHERE entity_id = %s AND action = 'lead.retention_anonymized'""",
                (lead_id,),
            )
            audit_count = cursor.fetchone()
            assert audit_count is not None
            assert audit_count[0] == 1
    finally:
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = %s", (lead_id,))
            cursor.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
            cursor.execute("DELETE FROM idempotency_keys WHERE scope = 'retention.test'")
