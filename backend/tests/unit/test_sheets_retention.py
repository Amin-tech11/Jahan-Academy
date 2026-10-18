import json
from datetime import date
from typing import Any
from unittest.mock import AsyncMock, Mock
from urllib.parse import unquote

import httpx
import pytest

from app.modules.operational.sheets_retention import managed_day, reconcile


def tab(day: date, rows: list[str]) -> dict[str, Any]:
    return {
        "properties": {
            "title": f"درخواست‌ها {day}",
            "sheetId": 700000000 + day.toordinal(),
            "gridProperties": {"rowCount": 10},
        },
        "refs": rows,
    }


@pytest.mark.parametrize("failure", [None, "403", "readback", "timeout"])
async def test_expiry_and_anonymization_preserve_unrelated_tabs_and_retry(
    failure: str | None,
) -> None:
    old = tab(date(2026, 10, 1), ["old-sensitive"])
    recent = tab(date(2026, 10, 17), ["active", "anonymized", "another-active", "anonymized"])
    manual = {"properties": {"title": "درخواست‌ها 2026-10-01", "sheetId": 123}, "refs": ["manual"]}
    sheets = [old, recent, manual]
    session = AsyncMock()
    result = Mock()
    result.scalars.return_value = ["anonymized"]
    session.execute.return_value = result
    mutations: list[dict[str, Any]] = []
    fail = failure

    def google(request: httpx.Request) -> httpx.Response:
        nonlocal fail
        if request.method == "POST":
            if fail == "403":
                return httpx.Response(403, json={})
            for operation in json.loads(request.content)["requests"]:
                mutations.append(operation)
                if fail == "readback":
                    continue
                if "deleteSheet" in operation:
                    sheets[:] = [
                        s
                        for s in sheets
                        if s["properties"]["sheetId"] != operation["deleteSheet"]["sheetId"]
                    ]
                elif "deleteDimension" in operation:
                    span = operation["deleteDimension"]["range"]
                    assert span["sheetId"] == recent["properties"]["sheetId"]
                    recent["refs"].pop(span["startIndex"] - 1)
            if fail == "timeout":
                fail = None
                raise httpx.ReadTimeout("synthetic timeout after successful mutation")
            return httpx.Response(200, json={})
        if "/values/" in unquote(request.url.path):
            return httpx.Response(200, json={"values": [[r] for r in recent["refs"]]})
        return httpx.Response(
            200, json={"sheets": [{"properties": s["properties"]} for s in sheets]}
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
        if failure:
            with pytest.raises((httpx.HTTPError, ValueError)):
                await reconcile(client, session, "synthetic", 14, today=date(2026, 10, 18))
            fail = None
        outcome = await reconcile(client, session, "synthetic", 14, today=date(2026, 10, 18))
        assert outcome["removed_rows"] == 2
        assert recent["refs"] == ["active", "another-active"]
        assert manual in sheets and manual["refs"] == ["manual"]
        assert old not in sheets
        assert await reconcile(client, session, "synthetic", 14, today=date(2026, 10, 18)) == {
            "expired_tabs": 0,
            "removed_rows": 0,
        }


def test_user_tab_with_wrong_identity_is_not_managed() -> None:
    assert managed_day({"title": "درخواست‌ها 2026-10-01", "sheetId": 123}) is None
    assert managed_day({"title": "درخواست‌ها invalid", "sheetId": 123}) is None
    assert (
        managed_day(
            {"title": "درخواست‌ها 20261001", "sheetId": 700000000 + date(2026, 10, 1).toordinal()}
        )
        is None
    )


async def test_last_expired_tab_is_replaced_by_empty_status_tab() -> None:
    sheets = [tab(date(2026, 1, 1), [])]

    def google(request: httpx.Request) -> httpx.Response:
        if request.method == "POST":
            operations = json.loads(request.content)["requests"]
            assert "addSheet" in operations[0]
            sheets[:] = [{"properties": {"title": "Retention status", "sheetId": 123}}]
            return httpx.Response(200, json={})
        return httpx.Response(200, json={"sheets": sheets})

    async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
        assert (await reconcile(client, AsyncMock(), "synthetic", 14, today=date(2026, 10, 18)))[
            "expired_tabs"
        ] == 1
