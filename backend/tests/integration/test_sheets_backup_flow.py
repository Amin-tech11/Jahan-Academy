from __future__ import annotations

import os
from datetime import date, timedelta
from unittest.mock import AsyncMock, patch
from uuid import uuid4

import psycopg
import pytest

from app.core.config import Settings
from app.modules.operational.sheets_backup import backup_day, day_bounds, prepare_day

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires migrated PostgreSQL"
)


async def test_expired_day_export_does_not_authenticate_or_write_to_google() -> None:
    day = "1900-01-01"
    with (
        patch(
            "app.modules.operational.sheets_backup.get_settings",
            return_value=Settings(sheets_backup_enabled=True),
        ),
        patch("app.modules.operational.sheets_backup.google_token", AsyncMock()) as token,
        patch("app.modules.operational.sheets_backup.write_snapshot", AsyncMock()) as remote,
    ):
        with pytest.raises(ValueError, match="retention window"):
            await prepare_day(day)
        result = await backup_day(day)
    assert result == {"status": "expired", "day": day}
    token.assert_not_awaited()
    remote.assert_not_awaited()


async def test_database_to_snapshot_includes_whole_day_and_archived_requests() -> None:
    day = date.today() - timedelta(days=3)
    start, end = day_bounds(day)
    references = [f"BK-{uuid4().hex[:18]}" for _ in range(6)]
    moments = [
        start - timedelta(microseconds=1),
        start,
        end - timedelta(microseconds=1),
        start,
        start,
        end,
    ]
    database_url = os.environ["JAHAN_DATABASE_URL"].replace(
        "postgresql+asyncpg://", "postgresql://"
    )
    try:
        with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
            for index, reference in enumerate(references):
                cursor.execute(
                    "INSERT INTO leads (public_reference, first_name, last_name, mobile_raw, "
                    "mobile_normalized, locale, created_at, archived_at, anonymized_at) "
                    "VALUES (%s, 'Backup', 'Test', '+989123456789', '+989123456789', 'fa', "
                    "%s, %s, %s)",
                    (
                        reference,
                        moments[index],
                        start if index == 3 else None,
                        start if index == 4 else None,
                    ),
                )
        remote = AsyncMock(return_value="saved")
        with (
            patch(
                "app.modules.operational.sheets_backup.get_settings",
                return_value=Settings(sheets_backup_enabled=True),
            ),
            patch(
                "app.modules.operational.sheets_backup.google_token", AsyncMock(return_value="test")
            ),
            patch("app.modules.operational.sheets_backup.write_snapshot", remote),
            patch("app.modules.operational.sheets_retention.reconcile", AsyncMock()),
        ):
            result = await backup_day(day.isoformat())
            prepared = await prepare_day(day.isoformat())
        assert result["status"] == "saved"
        exported = {row[0] for row in remote.call_args.args[3]}
        assert exported.intersection(references) == set(references[1:4])
        prepared_rows = prepared["requests"][1]["updateCells"]["rows"]
        prepared_references = {
            row["values"][0]["userEnteredValue"]["stringValue"] for row in prepared_rows[1:]
        }
        assert prepared_references == exported
        assert prepared["rowCount"] == len(exported)
        remote.assert_awaited_once()
    finally:
        with psycopg.connect(database_url) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM leads WHERE public_reference = ANY(%s)", (references,))
