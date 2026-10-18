"""Reconcile only application-owned snapshot tabs; never touch unrelated user tabs."""

import asyncio
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any
from urllib.parse import quote

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.modules.operational.sheets_backup import TEHRAN, google_token


def managed_day(properties: dict[str, Any]) -> date | None:
    title = properties.get("title", "")
    if not isinstance(title, str) or not title.startswith("درخواست‌ها "):
        return None
    try:
        day = date.fromisoformat(title.removeprefix("درخواست‌ها "))
    except ValueError:
        return None
    if title != f"درخواست‌ها {day.isoformat()}":
        return None
    return day if properties.get("sheetId") == 700000000 + day.toordinal() else None


async def reconcile(
    client: httpx.AsyncClient,
    session: AsyncSession,
    spreadsheet: str,
    days: int,
    *,
    today: date | None = None,
) -> dict[str, int]:
    await session.execute(text("SELECT pg_advisory_xact_lock(720029)"))
    cutoff = (today or datetime.now(UTC).astimezone(TEHRAN).date()) - timedelta(days=days)
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet}"
    response = await client.get(url, params={"fields": "sheets.properties"})
    response.raise_for_status()
    sheets = response.json().get("sheets", [])
    expired = [
        s["properties"]["sheetId"]
        for s in sheets
        if (day := managed_day(s["properties"])) is not None and day <= cutoff
    ]
    if expired:
        requests: list[dict[str, Any]] = []
        if len(expired) == len(sheets):
            requests.append({"addSheet": {"properties": {"title": "Retention status"}}})
        requests.extend({"deleteSheet": {"sheetId": sid}} for sid in expired)
        result = await client.post(url + ":batchUpdate", json={"requests": requests})
        result.raise_for_status()
        check = await client.get(url, params={"fields": "sheets.properties"})
        check.raise_for_status()
        if any(s["properties"]["sheetId"] in expired for s in check.json().get("sheets", [])):
            raise ValueError("Snapshot expiry readback failed")
    deleted = 0
    for sheet in sheets:
        props = sheet["properties"]
        if managed_day(props) is None or props["sheetId"] in expired:
            continue
        title = props["title"]
        count = int(props["gridProperties"]["rowCount"])
        # Work bottom-up so deleting lower rows never changes upcoming row indices.
        for end in range(count, 1, -1000):
            start = max(2, end - 999)
            cell_range = quote(f"'{title}'!A{start}:A{end}", safe="")
            endpoint = url + "/values/" + cell_range
            result = await client.get(endpoint, params={"valueRenderOption": "UNFORMATTED_VALUE"})
            result.raise_for_status()
            values = result.json().get("values", [])
            refs = [str(row[0]) for row in values if row]
            if not refs:
                continue
            removed = set(
                (
                    await session.execute(
                        text(
                            "SELECT public_reference FROM leads WHERE anonymized_at IS NOT NULL "
                            "AND public_reference = ANY(:refs)"
                        ),
                        {"refs": refs},
                    )
                ).scalars()
            )
            indexes = [
                start - 1 + i for i, row in enumerate(values) if row and str(row[0]) in removed
            ]
            if not indexes:
                continue
            requests = [
                {
                    "deleteDimension": {
                        "range": {
                            "sheetId": props["sheetId"],
                            "dimension": "ROWS",
                            "startIndex": index,
                            "endIndex": index + 1,
                        }
                    }
                }
                for index in reversed(indexes)
            ]
            result = await client.post(url + ":batchUpdate", json={"requests": requests})
            result.raise_for_status()
            check = await client.get(endpoint, params={"valueRenderOption": "UNFORMATTED_VALUE"})
            check.raise_for_status()
            if any(row and str(row[0]) in removed for row in check.json().get("values", [])):
                raise ValueError("Snapshot anonymization readback failed")
            deleted += len(indexes)
    return {"expired_tabs": len(expired), "removed_rows": deleted}


async def cleanup_sheets(session: AsyncSession, settings: Settings) -> dict[str, str | int]:
    configured = await asyncio.to_thread(Path(settings.sheets_backup_credentials_file).is_file)
    if not configured and not settings.sheets_backup_enabled:
        return {"status": "not_configured"}
    async with httpx.AsyncClient(timeout=60) as client:
        token = await google_token(client, settings.sheets_backup_credentials_file)
        client.headers["Authorization"] = f"Bearer {token}"
        result = await reconcile(
            client,
            session,
            settings.sheets_backup_spreadsheet_id,
            settings.sheets_snapshot_retention_days,
        )
    return {"status": "success", **result}
