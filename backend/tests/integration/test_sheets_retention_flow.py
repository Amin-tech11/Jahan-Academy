import json
import os
from datetime import date
from uuid import uuid4

import httpx
import psycopg
import pytest

from app.core.database import dispose_database, session_factory
from app.modules.operational.retention import RetentionRepository
from app.modules.operational.sheets_retention import reconcile

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="isolated DB required"
)


async def test_anonymized_database_record_is_removed_from_recent_snapshot_on_retry() -> None:
    lead = uuid4()
    ref = "SR-" + uuid4().hex[:20]
    url = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    with psycopg.connect(url) as connection, connection.cursor() as cursor:
        cursor.execute(
            """INSERT INTO leads
            (id, public_reference, first_name, last_name, mobile_raw, mobile_normalized,
             locale, created_at, updated_at)
            VALUES (%s, %s, 'Synthetic', 'Private', '+989120000000', '+989120000000',
                    'fa', now() - interval '4 years', now() - interval '4 years')
        """,
            (lead, ref),
        )
    rows = [ref, "active-other-record"]
    failed = False

    def google(request: httpx.Request) -> httpx.Response:
        nonlocal failed
        if request.method == "POST":
            operation = json.loads(request.content)["requests"][0]
            assert operation["deleteDimension"]["range"]["startIndex"] == 1
            if not failed:
                failed = True
                return httpx.Response(503, json={})
            rows.pop(0)
            return httpx.Response(200, json={})
        if "/values/" in request.url.path:
            return httpx.Response(200, json={"values": [[value] for value in rows]})
        return httpx.Response(
            200,
            json={
                "sheets": [
                    {
                        "properties": {
                            "title": "درخواست‌ها 2026-10-17",
                            "sheetId": 700000000 + date(2026, 10, 17).toordinal(),
                            "gridProperties": {"rowCount": 3},
                        }
                    }
                ]
            },
        )

    try:
        async with session_factory() as session:
            assert (
                await RetentionRepository(session).anonymize_expired_leads(years=3, limit=10) == 1
            )
            await session.commit()
            async with httpx.AsyncClient(transport=httpx.MockTransport(google)) as client:
                with pytest.raises(httpx.HTTPStatusError):
                    await reconcile(client, session, "synthetic", 14, today=date(2026, 10, 18))
                await session.rollback()
                assert rows[0] == ref
                result = await reconcile(client, session, "synthetic", 14, today=date(2026, 10, 18))
                await session.commit()
                assert result["removed_rows"] == 1
                assert rows == ["active-other-record"]
    finally:
        with psycopg.connect(url) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = %s", (lead,))
            cursor.execute("DELETE FROM leads WHERE id = %s", (lead,))
        await dispose_database()
