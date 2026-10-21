from __future__ import annotations

import json
import os
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import authorization_context

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires isolated PostgreSQL and Redis"
)


def test_large_table_filters_pagination_facets_and_assigned_scope() -> None:
    database = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    actor, other = uuid4(), uuid4()
    prefix = "COL-" + uuid4().hex[:8]
    context = AuthorizationContext(
        user_id=actor,
        grants=(RoleGrant("support", "global", None, frozenset({"lead.read.all"})),),
    )

    async def override() -> AuthorizationContext:
        return context

    app.dependency_overrides[authorization_context] = override
    with psycopg.connect(database) as connection, connection.cursor() as cursor:
        cursor.executemany(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            [(actor,), (other,)],
        )
        cursor.executemany(
            """INSERT INTO leads (public_reference, first_name, last_name, mobile_raw,
                 mobile_normalized, age, occupation, message, assigned_consultant_id, locale)
               VALUES (%s, 'Applicant', 'Test', '09121234567', '+989121234567',
                 %s, %s, %s, %s, 'fa')""",
            [
                (
                    f"{prefix}-{index:04}",
                    20 + index % 5,
                    f"Job {index:04}",
                    "تحصیلات: لیسانس\nسرمایه مهاجرت: ۱ الی ۲ میلیارد\nمهارت زبان انگلیسی: متوسط",
                    actor if index < 10 else other,
                )
                for index in range(1100)
            ],
        )
    try:
        with TestClient(app) as client:
            params = {"q": prefix, "searchField": "reference", "limit": 20}
            response = client.get(
                "/api/v1/admin/leads",
                params={**params, "sortColumn": "age", "sortDirection": "asc"},
            )
            assert response.status_code == 200, response.text
            assert response.json()["meta"]["total"] == 1100
            assert len(response.json()["data"]) == 20
            assert {row["age"] for row in response.json()["data"]} == {20}
            for column in ("reference", "investmentBudget"):
                ordered = client.get(
                    "/api/v1/admin/leads",
                    params={**params, "sortColumn": column, "sortDirection": "asc"},
                )
                assert ordered.status_code == 200, ordered.text
                assert ordered.json()["meta"]["total"] == 1100
            selected = json.dumps({"age": ["23"], "education": ["لیسانس"]})
            first = client.get("/api/v1/admin/leads", params={**params, "columnFilters": selected})
            second = client.get(
                "/api/v1/admin/leads", params={**params, "columnFilters": selected, "page": 2}
            )
            assert first.json()["meta"]["total"] == 220
            assert {row["age"] for row in first.json()["data"]} == {23}
            assert not {row["id"] for row in first.json()["data"]} & {
                row["id"] for row in second.json()["data"]
            }
            facet = client.get(
                "/api/v1/admin/leads",
                params={**params, "columnFilters": selected, "facet": "age"},
            )
            assert facet.json()["data"] == []
            assert facet.json()["meta"]["columnValues"] == ["20", "21", "22", "23", "24"]
            capped = client.get("/api/v1/admin/leads", params={**params, "facet": "occupation"})
            assert len(capped.json()["meta"]["columnValues"]) == 500
            assert capped.json()["meta"]["columnValuesTruncated"]
            request_type = client.get(
                "/api/v1/admin/leads", params={**params, "facet": "requestType"}
            )
            assert request_type.json()["meta"]["columnValues"] == ["assessment"]
            context = AuthorizationContext(
                user_id=actor,
                grants=(
                    RoleGrant("consultant", "global", None, frozenset({"lead.read.assigned"})),
                ),
            )
            scoped = client.get("/api/v1/admin/leads", params=params)
            assert scoped.json()["meta"]["total"] == 10
            scoped_facet = client.get(
                "/api/v1/admin/leads", params={**params, "facet": "occupation"}
            )
            assert scoped_facet.json()["meta"]["columnValues"] == [f"Job {i:04}" for i in range(10)]
            assert (
                client.get(
                    "/api/v1/admin/leads", params={**params, "sortColumn": "age; DROP TABLE leads"}
                ).status_code
                == 422
            )
    finally:
        app.dependency_overrides.clear()
        with psycopg.connect(database) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM leads WHERE public_reference LIKE %s", (prefix + "%",))
            cursor.execute("DELETE FROM users WHERE id IN (%s, %s)", (actor, other))


def test_reference_and_budget_sort_numerically_in_postgresql() -> None:
    from sqlalchemy import text

    from app.modules.consultations.lead_columns import column_order

    database = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    with psycopg.connect(database) as connection:
        for column in ("reference", "investmentBudget"):
            query = (
                "SELECT l.public_reference FROM (VALUES "
                "('JA-2', NULL, 'Migration budget: 2 million', now(), 1), "
                "('JA-10', NULL, 'سرمایه مهاجرت: ۱ الی ۲ میلیارد', now(), 2), "
                "('JA-1', 'under_10k', '', now(), 3)) "
                "AS l(public_reference, investment_range_code, message, created_at, id) ORDER BY "
                + column_order(column, "asc")
            )
            rows = connection.execute(str(text(query).compile())).fetchall()
            assert [row[0] for row in rows] == ["JA-1", "JA-2", "JA-10"]


def test_contact_time_column_reads_all_form_labels_and_filters_in_postgresql() -> None:
    from sqlalchemy import create_engine, text

    from app.modules.consultations.lead_columns import apply_column_filters, column_expression

    database = os.environ["JAHAN_DATABASE_URL"].replace(
        "postgresql+asyncpg://", "postgresql+psycopg://"
    )
    source = """(VALUES
        (1, 'زمان مناسب تماس: 12:30 - 1'),
        (2, 'زمان ترجیحی تماس: 2 - 2:30'),
        (3, 'Preferred contact time: 3:30 - 4'),
        (4, 'زمان مناسب تماس: صبح'),
        (5, NULL)) AS l(id, message)"""
    engine = create_engine(database)
    try:
        with engine.connect() as connection:
            expression = column_expression("contactTime")
            rows = connection.execute(text(f"SELECT {expression} FROM {source} ORDER BY id"))
            assert rows.scalars().all() == ["12:30 - 1", "2 - 2:30", "3:30 - 4", "صبح", "—"]
            params: dict[str, object] = {}
            where = apply_column_filters("1=1", params, {"contactTime": ["2 - 2:30"]})
            filtered = connection.execute(text(f"SELECT id FROM {source} WHERE {where}"), params)
            assert filtered.scalars().all() == [2]
    finally:
        engine.dispose()
