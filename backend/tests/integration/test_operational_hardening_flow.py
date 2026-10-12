from __future__ import annotations

import asyncio
import os
from uuid import uuid4

import psycopg
import pytest

from app.core.database import dispose_database, session_factory
from app.modules.operational.maintenance import run as retention_run
from app.modules.operational.retention import RetentionRepository

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires migrated PostgreSQL"
)


def _database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


async def _enforce_retention() -> tuple[int, int]:
    try:
        async with session_factory() as session:
            repository = RetentionRepository(session)
            anonymized = await repository.anonymize_expired_leads(years=3, limit=10)
            expired_keys = await repository.remove_expired_idempotency_keys()
            await session.commit()
            return anonymized, expired_keys
    finally:
        await dispose_database()


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

        cursor.execute(
            "UPDATE leads SET age = 38, occupation = 'Private occupation', "
            "archive_reason = 'Private reason' WHERE id = %s",
            (lead_id,),
        )
        # Preserve old timestamps after deliberately adding sensitive fixture values.
        cursor.execute(
            "UPDATE leads SET updated_at = now() - interval '4 years' WHERE id = %s", (lead_id,)
        )
        cursor.execute(
            "INSERT INTO lead_notes (lead_id, body, created_at) "
            "VALUES (%s, 'Private note', now() - interval '4 years')",
            (lead_id,),
        )
        cursor.execute(
            "INSERT INTO lead_submission_events "
            "(lead_id, event_type, source_url, metadata_safe, created_at) "
            "VALUES (%s, 'accepted', 'private-source', '{\"private\":true}', "
            "now() - interval '4 years')",
            (lead_id,),
        )

    try:
        anonymized, expired_keys = asyncio.run(_enforce_retention())
        assert anonymized >= 1
        assert expired_keys >= 1
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute(
                "SELECT first_name, email, message, anonymized_at, age, occupation, archive_reason "
                "FROM leads WHERE id = %s",
                (lead_id,),
            )
            row = cursor.fetchone()
            assert row is not None
            assert row[:3] == ("Anonymized", None, None)
            assert row[3] is not None
            assert row[4:] == (None, None, None)
            cursor.execute("SELECT body FROM lead_notes WHERE lead_id = %s", (lead_id,))
            assert cursor.fetchone() == ("[Anonymized]",)
            cursor.execute(
                "SELECT source_url, metadata_safe FROM lead_submission_events WHERE lead_id = %s",
                (lead_id,),
            )
            assert cursor.fetchone() == (None, {})
            cursor.execute(
                """SELECT count(*) FROM audit_logs
                   WHERE entity_id = %s AND action = 'lead.retention_anonymized'""",
                (lead_id,),
            )
            audit_count = cursor.fetchone()
            assert audit_count is not None
            assert audit_count[0] == 1
        # Re-running is idempotent and does not add a second retention event.
        assert asyncio.run(_enforce_retention())[0] == 0
    finally:
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = %s", (lead_id,))
            cursor.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
            cursor.execute("DELETE FROM idempotency_keys WHERE scope = 'retention.test'")


@pytest.mark.parametrize(
    "activity", ["note", "edited_note", "submission", "status", "assignment", "booking", "session"]
)
def test_retention_preserves_old_leads_with_recent_related_activity(activity: str) -> None:
    lead_id, user_id, booking_id = uuid4(), uuid4(), uuid4()
    with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO leads (id, public_reference, first_name, last_name, mobile_raw, "
            "mobile_normalized, locale, created_at, updated_at) "
            "VALUES (%s, %s, 'Active', 'Applicant', '+989121234567', '+989121234567', "
            "'fa', now() - interval '4 years', now() - interval '4 years')",
            (lead_id, "RET-" + lead_id.hex[:16]),
        )
        if activity in {"note", "edited_note"}:
            cursor.execute(
                "INSERT INTO lead_notes (lead_id, body, created_at, edited_at) "
                "VALUES (%s, 'Recent private note', now() - interval '4 years', now())",
                (lead_id,),
            )
            if activity == "note":
                cursor.execute(
                    "UPDATE lead_notes SET created_at = now(), edited_at = NULL WHERE lead_id = %s",
                    (lead_id,),
                )
        elif activity == "submission":
            cursor.execute(
                "INSERT INTO lead_submission_events (lead_id, event_type) VALUES (%s, 'duplicate')",
                (lead_id,),
            )
        elif activity == "status":
            cursor.execute(
                "INSERT INTO lead_status_history (lead_id, new_status) VALUES (%s, 'new')",
                (lead_id,),
            )
        elif activity == "assignment":
            cursor.execute("INSERT INTO users (id, status) VALUES (%s, 'active')", (user_id,))
            cursor.execute(
                "INSERT INTO lead_assignments (lead_id, assignee_user_id) VALUES (%s, %s)",
                (lead_id, user_id),
            )
        else:
            cursor.execute(
                "INSERT INTO consultation_bookings (id, public_reference, lead_id, "
                "starts_at, ends_at, timezone, created_at, updated_at) "
                "VALUES (%s, %s, %s, now() - interval '4 years', "
                "now() - interval '4 years' + interval '1 hour', 'Asia/Tehran', "
                "now() - interval '4 years', now() - interval '4 years')",
                (booking_id, "BOOK-" + booking_id.hex[:16], lead_id),
            )
            if activity == "booking":
                cursor.execute(
                    "UPDATE consultation_bookings SET starts_at = now() + interval '1 day', "
                    "ends_at = now() + interval '1 day 1 hour' WHERE id = %s",
                    (booking_id,),
                )
            else:
                cursor.execute(
                    "INSERT INTO consultation_sessions (booking_id, report) "
                    "VALUES (%s, 'Recent private report')",
                    (booking_id,),
                )
    try:
        # Dry-run and mutation must agree, including activities that don't touch leads.updated_at.
        assert asyncio.run(retention_run(apply=False))["eligible_leads"] == 0
        assert asyncio.run(_enforce_retention())[0] == 0
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute("SELECT first_name, anonymized_at FROM leads WHERE id = %s", (lead_id,))
            assert cursor.fetchone() == ("Active", None)
    finally:
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM consultation_bookings WHERE lead_id = %s", (lead_id,))
            cursor.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
