from __future__ import annotations

import asyncio
import json
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch
from urllib.parse import parse_qs

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

from app.core.celery_app import celery_app
from app.core.config import Settings
from app.modules.operational.sheets_backup import (
    HEADERS,
    backup_day,
    day_bounds,
    google_token,
    prepare_day,
    previous_day,
    row_values,
    scheduled_through,
    snapshot_requests,
    write_snapshot,
)
from app.modules.operational.tasks import dispatch_sheets_backup_task, recover_sheets_task


def test_midnight_schedule_and_previous_tehran_day() -> None:
    assert celery_app.conf.timezone == "Asia/Tehran"
    schedule = celery_app.conf.beat_schedule["nightly-consultation-sheets-backup"]["schedule"]
    assert schedule.hour == {0} and schedule.minute == {0}
    assert str(schedule.tz) == "Asia/Tehran"
    assert previous_day(datetime(2026, 10, 7, 20, 30, tzinfo=UTC)) == "2026-10-07"
    assert previous_day(datetime(2026, 10, 7, 20, 29, tzinfo=UTC)) == "2026-10-06"
    assert day_bounds(date(2026, 10, 7)) == (
        datetime(2026, 10, 6, 20, 30, tzinfo=UTC),
        datetime(2026, 10, 7, 20, 30, tzinfo=UTC),
    )


def test_dispatch_freezes_date_in_task_arguments() -> None:
    with (
        patch(
            "app.modules.operational.tasks.get_settings",
            return_value=Settings(sheets_backup_enabled=True),
        ),
        patch("app.modules.operational.tasks.scheduled_through", return_value="2026-10-07"),
        patch("app.modules.operational.tasks.recover_sheets_task.delay") as queue,
    ):
        dispatch_sheets_backup_task()
    queue.assert_called_once_with("2026-10-07")


def test_daily_eight_am_deadline_does_not_run_early_on_startup() -> None:
    assert scheduled_through(datetime(2026, 10, 7, 4, 29, tzinfo=UTC)) == "2026-10-05"
    assert scheduled_through(datetime(2026, 10, 7, 4, 30, tzinfo=UTC)) == "2026-10-06"
    assert scheduled_through(datetime(2026, 10, 7, 20, 30, tzinfo=UTC)) == "2026-10-06"


def test_assessment_values_match_export_columns_and_preserve_text() -> None:
    values = row_values(
        {
            "public_reference": "JA-ONE",
            "first_name": "=1+1",
            "last_name": "Test",
            "mobile_normalized": "+989123456789",
            "age": 0,
            "gender_code": "female",
            "marital_status_code": "single",
            "status": "closed",
            "message": "تحصیلات: لیسانس\nسرمایه مهاجرت: ۱ میلیارد\nمهارت زبان انگلیسی: متوسط",
            "created_at": datetime(2026, 10, 7, 20, 29, tzinfo=UTC),
        }
    )
    assert len(values) == len(HEADERS) == 14
    assert values[:5] == ["JA-ONE", "=1+1 Test", "+98 912 345 6789", "—", "0"]
    assert values[6:11] == ["زن", "لیسانس", "مجرد", "۱ میلیارد", "متوسط"]
    assert values[11:] == ["۱۴۰۵/۷/۱۵, ۲۳:۵۹", "ارزیابی", "بسته‌شده"]


def test_atomic_payload_matches_template_and_does_not_execute_formulas() -> None:
    requests = snapshot_requests("2026-10-07", [["=1+1"] * 14, ["+98 912 345 6789"] * 14])
    properties = requests[0]["addSheet"]["properties"]
    assert properties["rightToLeft"] is True
    assert properties["gridProperties"]["frozenRowCount"] == 1
    rows = requests[1]["updateCells"]["rows"]
    assert [cell["userEnteredValue"]["stringValue"] for cell in rows[0]["values"]] == HEADERS
    for row in rows:
        for cell in row["values"]:
            assert cell["userEnteredFormat"]["textFormat"]["fontFamily"] == "B_Nazanin"
            assert list(cell["userEnteredValue"]) == ["stringValue"]
    assert rows[0]["values"][0]["userEnteredFormat"]["horizontalAlignment"] == "CENTER"
    assert (
        rows[1]["values"][0]["userEnteredFormat"]["backgroundColor"]
        != rows[2]["values"][0]["userEnteredFormat"]["backgroundColor"]
    )
    assert snapshot_requests("2026-10-07", []) == []


async def test_remote_atomic_save_then_retry_leaves_all_tabs_unchanged() -> None:
    sheets: list[dict[str, Any]] = [{"properties": {"sheetId": 0, "title": "Existing"}}]
    posts = 0
    written_rows: list[dict[str, Any]] = []

    def google(request: httpx.Request) -> httpx.Response:
        nonlocal posts, written_rows
        if request.method == "GET":
            if "ranges" in request.url.params:
                return httpx.Response(200, json={"sheets": [{"data": [{"rowData": written_rows}]}]})
            return httpx.Response(200, json={"sheets": sheets})
        posts += 1
        body = json.loads(request.content)
        written_rows = body["requests"][1]["updateCells"]["rows"]
        for row in written_rows:
            for cell in row["values"]:
                cell["effectiveFormat"] = cell["userEnteredFormat"]
        sheets.append({"properties": body["requests"][0]["addSheet"]["properties"]})
        return httpx.Response(200, json={})

    async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
        assert await write_snapshot(client, "target", "2026-10-07", [["record"] * 14]) == "saved"
        assert (
            await write_snapshot(client, "target", "2026-10-07", [["record"] * 14])
            == "already_saved"
        )
    assert posts == 1 and sheets[0]["properties"]["title"] == "Existing"


def test_recovery_checkpoints_empty_and_saved_days_and_skips_completed_days() -> None:
    state = MagicMock()
    state.exists.side_effect = [True, False, False]
    backup = AsyncMock(
        side_effect=[
            {"status": "empty", "day": "2026-10-08", "rows": 0},
            {"status": "saved", "day": "2026-10-09", "rows": 1},
        ]
    )
    with (
        patch(
            "app.modules.operational.tasks.get_settings",
            return_value=Settings(sheets_backup_enabled=True),
        ),
        patch("app.modules.operational.tasks.Redis.from_url") as redis,
        patch("app.modules.operational.tasks.backup_day", backup),
    ):
        redis.return_value.__enter__.return_value = state
        assert recover_sheets_task("2026-10-09") == {"processed": 2}
    assert backup.await_count == 2
    assert state.set.call_count == 2


def test_recovery_does_not_checkpoint_failed_days() -> None:
    state = MagicMock()
    state.exists.return_value = False
    with (
        patch(
            "app.modules.operational.tasks.get_settings",
            return_value=Settings(sheets_backup_enabled=True),
        ),
        patch("app.modules.operational.tasks.Redis.from_url") as redis,
        patch(
            "app.modules.operational.tasks.backup_day",
            AsyncMock(side_effect=ValueError("readback differs")),
        ),
    ):
        redis.return_value.__enter__.return_value = state
        with pytest.raises(ValueError, match="readback"):
            recover_sheets_task.run("2026-10-07")
    state.set.assert_not_called()


async def test_remote_error_does_not_report_success() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda request: httpx.Response(403, json={"error": "denied"}))
    ) as client:
        with pytest.raises(httpx.HTTPStatusError):
            await write_snapshot(client, "target", "2026-10-07", [["record"] * 14])


async def test_successful_write_with_incomplete_readback_is_not_confirmed() -> None:
    sheets: list[dict[str, Any]] = []
    posts = 0

    def google(request: httpx.Request) -> httpx.Response:
        nonlocal posts
        if request.method == "POST":
            posts += 1
            sheets.append(
                {"properties": json.loads(request.content)["requests"][0]["addSheet"]["properties"]}
            )
            return httpx.Response(200, json={})
        if "ranges" in request.url.params:
            return httpx.Response(200, json={"sheets": [{"data": [{"rowData": []}]}]})
        return httpx.Response(200, json={"sheets": sheets})

    async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
        for _ in range(2):
            with pytest.raises(ValueError, match="readback"):
                await write_snapshot(client, "target", "2026-10-07", [["record"] * 14])
    assert posts == 1


async def test_existing_user_tab_is_never_overwritten() -> None:
    def google(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        return httpx.Response(
            200,
            json={
                "sheets": [
                    {
                        "properties": {
                            "title": "درخواست‌ها 2026-10-07",
                            "sheetId": 123,
                        }
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
        with pytest.raises(ValueError, match="conflicts"):
            await write_snapshot(client, "target", "2026-10-07", [["record"] * 14])


async def test_empty_day_never_contacts_google_or_creates_a_sheet() -> None:
    def google(request: httpx.Request) -> httpx.Response:
        pytest.fail("Empty days must not contact Google")

    async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
        assert await write_snapshot(client, "target", "2026-10-07", []) == "empty"


async def test_service_account_token_uses_signed_limited_scope_assertion(tmp_path: Path) -> None:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_key = key.private_bytes(
        serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
    ).decode()
    credentials = tmp_path / "test-service-account.json"
    await asyncio.to_thread(
        credentials.write_text,
        json.dumps(
            {
                "client_email": "backup@example.iam.gserviceaccount.com",
                "private_key_id": "test",
                "private_key": private_key,
            }
        ),
        encoding="utf-8",
    )

    def google(request: httpx.Request) -> httpx.Response:
        assert str(request.url) == "https://oauth2.googleapis.com/token"
        form = parse_qs(request.content.decode())
        assert form["grant_type"] == ["urn:ietf:params:oauth:grant-type:jwt-bearer"]
        claims = jwt.decode(
            form["assertion"][0],
            key.public_key(),
            algorithms=["RS256"],
            audience="https://oauth2.googleapis.com/token",
        )
        assert claims["scope"] == "https://www.googleapis.com/auth/spreadsheets"
        assert claims["exp"] - claims["iat"] == 3600
        return httpx.Response(200, json={"access_token": "test-access-token"})

    async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
        assert await google_token(client, str(credentials)) == "test-access-token"


async def test_backup_disabled_without_opening_database_or_google() -> None:
    with patch("app.modules.operational.sheets_backup.get_settings", return_value=Settings()):
        assert await backup_day("2026-10-07") == {"status": "disabled", "day": "2026-10-07"}


async def test_current_day_cannot_be_saved_as_a_complete_snapshot() -> None:
    with patch(
        "app.modules.operational.sheets_backup.get_settings",
        return_value=Settings(sheets_backup_enabled=True),
    ):
        with pytest.raises(ValueError, match="complete Tehran days"):
            await backup_day("2999-01-01")


async def test_connector_preparation_rejects_incomplete_days_before_database_access() -> None:
    with patch("app.modules.operational.sheets_backup.session_factory") as sessions:
        with pytest.raises(ValueError, match="complete Tehran days"):
            await prepare_day("2999-01-01")
        sessions.assert_not_called()
