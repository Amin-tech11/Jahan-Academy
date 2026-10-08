"""Daily consultation snapshots; all remote writes are atomic and text-safe."""

from __future__ import annotations

import asyncio
import json
import re
import time
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import httpx
import jdatetime  # type: ignore[import-untyped]
import jwt
from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import dispose_database, session_factory

TEHRAN = ZoneInfo("Asia/Tehran")
HEADERS = [
    "کد پیگیری",
    "نام و نام خانوادگی",
    "تلفن",
    "ایمیل",
    "سن",
    "شغل",
    "جنسیت",
    "تحصیلات",
    "وضعیت تأهل",
    "میزان سرمایه",
    "مهارت زبان انگلیسی",
    "تاریخ ثبت درخواست",
    "نوع درخواست",
    "وضعیت",
]
CHOICES = {
    "female": "زن",
    "male": "مرد",
    "non_binary": "غیردودویی",
    "self_described": "توصیف شخصی",
    "prefer_not_to_say": "تمایلی به پاسخ ندارم",
    "single": "مجرد",
    "married": "متأهل",
    "divorced": "جداشده",
    "widowed": "همسر فوت‌شده",
    "under_10k": "کمتر از ۱۰٬۰۰۰",
    "10k_20k": "۱۰٬۰۰۰ تا ۲۰٬۰۰۰",
    "20k_40k": "۲۰٬۰۰۰ تا ۴۰٬۰۰۰",
    "40k_plus": "بیش از ۴۰٬۰۰۰",
    "new": "جدید",
    "assigned": "ارجاع‌شده",
    "contacted": "تماس گرفته‌شده",
    "qualified": "واجد شرایط",
    "not_qualified": "فاقد شرایط",
    "converted": "تبدیل‌شده",
    "closed": "بسته‌شده",
}
ANSWERS = {
    "education": ("تحصیلات", "Education"),
    "budget": ("سرمایه مهاجرت", "Migration budget"),
    "english": ("مهارت زبان انگلیسی", "English proficiency"),
}


def day_bounds(day: date) -> tuple[datetime, datetime]:
    return (
        datetime.combine(day, datetime.min.time(), TEHRAN).astimezone(UTC),
        datetime.combine(day + timedelta(days=1), datetime.min.time(), TEHRAN).astimezone(UTC),
    )


def previous_day(now: datetime | None = None) -> str:
    return ((now or datetime.now(UTC)).astimezone(TEHRAN).date() - timedelta(days=1)).isoformat()


def row_values(row: dict[str, Any]) -> list[str]:
    message = str(row.get("message") or "")
    answers = {}
    for key, labels in ANSWERS.items():
        answers[key] = next(
            (
                line.split(":", 1)[1].strip()
                for line in message.splitlines()
                if ":" in line and line.split(":", 1)[0].strip() in labels
            ),
            "",
        )
    budget = answers["budget"]
    if row.get("investment_range_code"):
        code = str(row["investment_range_code"])
        budget = " · ".join(filter(None, [CHOICES.get(code, code), row.get("investment_currency")]))
    gender = row.get("gender_code")
    if gender == "self_described" and row.get("gender_self_description"):
        gender = row["gender_self_description"]
    else:
        gender = CHOICES.get(str(gender), gender)
    created = row["created_at"].astimezone(TEHRAN)
    jalali = jdatetime.datetime.fromgregorian(datetime=created)
    created_text = (
        f"{jalali.year}/{jalali.month}/{jalali.day}, {created.hour:02}:{created.minute:02}"
    )
    created_text = created_text.translate(str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹"))
    values = [
        row["public_reference"],
        " ".join(filter(None, [row.get("first_name"), row.get("last_name")])),
        re.sub(
            r"^(\+98)(\d{3})(\d{3})(\d{4})$",
            r"\1 \2 \3 \4",
            str(row.get("mobile_normalized") or ""),
        ),
        row.get("email"),
        row.get("age"),
        row.get("occupation"),
        gender,
        answers["education"],
        CHOICES.get(str(row.get("marital_status_code"))),
        budget,
        answers["english"],
        created_text,
        "ارزیابی" if len(message.strip().splitlines()) == 3 and all(answers.values()) else "مشاوره",
        CHOICES.get(str(row.get("status")), row.get("status")),
    ]
    return [str(value) if value is not None and value != "" else "—" for value in values]


def color(hex_value: str) -> dict[str, float]:
    return {
        key: int(hex_value[index : index + 2], 16) / 255
        for key, index in (("red", 0), ("green", 2), ("blue", 4))
    }


def snapshot_requests(day: str, values: list[list[str]]) -> list[dict[str, Any]]:
    # Deterministic ID + title allow a timed-out successful request to be detected on retry.
    sheet_id = 700000000 + date.fromisoformat(day).toordinal()
    grid = {
        "sheetId": sheet_id,
        "startRowIndex": 0,
        "endRowIndex": len(values) + 1,
        "startColumnIndex": 0,
        "endColumnIndex": len(HEADERS),
    }
    rows = []
    for index, cells in enumerate([HEADERS, *values]):
        rows.append(
            {
                "values": [
                    {
                        "userEnteredValue": {"stringValue": value},
                        "userEnteredFormat": {
                            "numberFormat": {"type": "TEXT"},
                            "horizontalAlignment": "CENTER" if index == 0 else "RIGHT",
                            "verticalAlignment": "MIDDLE",
                            "backgroundColor": color(
                                "123B78" if index == 0 else "F0F4FA" if index % 2 == 0 else "FFFFFF"
                            ),
                            "textFormat": {
                                "fontFamily": "B_Nazanin",
                                "fontSize": 11,
                                "bold": index == 0,
                                "foregroundColor": color("FFFFFF" if index == 0 else "172B4D"),
                            },
                        },
                    }
                    for value in cells
                ]
            }
        )
    return [
        {
            "addSheet": {
                "properties": {
                    "sheetId": sheet_id,
                    "title": f"درخواست‌ها {day}",
                    "rightToLeft": True,
                    "gridProperties": {
                        "rowCount": max(2, len(values) + 1),
                        "columnCount": len(HEADERS),
                        "frozenRowCount": 1,
                    },
                }
            }
        },
        {
            "updateCells": {
                "range": grid,
                "rows": rows,
                "fields": "userEnteredValue,userEnteredFormat",
            }
        },
        {"setBasicFilter": {"filter": {"range": grid}}},
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": sheet_id,
                    "dimension": "COLUMNS",
                    "startIndex": 0,
                    "endIndex": len(HEADERS),
                },
                "properties": {"pixelSize": 190},
                "fields": "pixelSize",
            }
        },
        {
            "updateDimensionProperties": {
                "range": {
                    "sheetId": sheet_id,
                    "dimension": "ROWS",
                    "startIndex": 0,
                    "endIndex": len(values) + 1,
                },
                "properties": {"pixelSize": 30},
                "fields": "pixelSize",
            }
        },
    ]


async def google_token(client: httpx.AsyncClient, credentials_file: str) -> str:
    raw = await asyncio.to_thread(Path(credentials_file).read_text, encoding="utf-8")
    credentials = json.loads(raw)
    now = int(time.time())
    assertion = jwt.encode(
        {
            "iss": credentials["client_email"],
            "scope": "https://www.googleapis.com/auth/spreadsheets",
            "aud": "https://oauth2.googleapis.com/token",
            "iat": now,
            "exp": now + 3600,
        },
        credentials["private_key"],
        algorithm="RS256",
        headers={"kid": credentials["private_key_id"]},
    )
    response = await client.post(
        "https://oauth2.googleapis.com/token",
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": assertion,
        },
    )
    response.raise_for_status()
    return str(response.json()["access_token"])


async def write_snapshot(
    client: httpx.AsyncClient, spreadsheet_id: str, day: str, values: list[list[str]]
) -> str:
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}"
    response = await client.get(url, params={"fields": "sheets.properties"})
    response.raise_for_status()
    title = f"درخواست‌ها {day}"
    target_id = 700000000 + date.fromisoformat(day).toordinal()
    for sheet in response.json().get("sheets", []):
        props = sheet["properties"]
        if props["title"] == title or props["sheetId"] == target_id:
            if props["title"] == title and props["sheetId"] == target_id:
                return "already_saved"
            raise ValueError("Backup tab conflicts with an existing sheet; no data overwritten")
    response = await client.post(
        url + ":batchUpdate", json={"requests": snapshot_requests(day, values)}
    )
    response.raise_for_status()
    return "saved"


async def backup_day(day: str) -> dict[str, str | int]:
    settings = get_settings()
    if not settings.sheets_backup_enabled:
        return {"status": "disabled", "day": day}
    start, end = day_bounds(date.fromisoformat(day))
    if end > datetime.now(UTC):
        raise ValueError("Only complete Tehran days may be backed up")
    try:
        async with session_factory() as session, session.begin():
            # Transaction-scoped lock releases even on a failed remote write.
            locked = await session.scalar(
                text("SELECT pg_try_advisory_xact_lock(:key)"),
                {"key": 700000000 + date.fromisoformat(day).toordinal()},
            )
            if not locked:
                raise RuntimeError("Another worker is saving this backup; retry later")
            result = await session.execute(
                text(
                    "SELECT * FROM leads WHERE created_at >= :start AND created_at < :end "
                    "AND anonymized_at IS NULL ORDER BY created_at, id"
                ),
                {"start": start, "end": end},
            )
            values = [row_values(dict(row)) for row in result.mappings()]
            async with httpx.AsyncClient(timeout=60) as client:
                token = await google_token(client, settings.sheets_backup_credentials_file)
                client.headers["Authorization"] = f"Bearer {token}"
                status = await write_snapshot(
                    client, settings.sheets_backup_spreadsheet_id, day, values
                )
            return {"status": status, "day": day, "rows": len(values)}
    finally:
        await dispose_database()


if __name__ == "__main__":
    import sys

    print(json.dumps(asyncio.run(backup_day(sys.argv[1] if len(sys.argv) > 1 else previous_day()))))
