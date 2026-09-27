from __future__ import annotations

import os
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import authorization_context

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires migrated PostgreSQL"
)


def _database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def test_dashboard_returns_aggregate_metrics_without_exposing_lead_pii() -> None:
    actor_id, consultant_id, lead_id = uuid4(), uuid4(), uuid4()
    with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            """INSERT INTO users (id, status, preferred_locale)
               VALUES (%s, 'active', 'fa'), (%s, 'active', 'fa')""",
            (actor_id, consultant_id),
        )
        cursor.execute(
            """INSERT INTO user_profiles (user_id, first_name, last_name)
               VALUES (%s, 'Admin', 'Test'), (%s, 'Consultant', 'Test')""",
            (actor_id, consultant_id),
        )
        cursor.execute(
            """INSERT INTO leads (
                 id, public_reference, first_name, last_name, mobile_raw, mobile_normalized,
                 locale, status, assigned_consultant_id
               ) VALUES (
                 %s, 'RPT-TEST-001', 'Lead', 'Test', '+989121234567', '+989121234567',
                 'fa', 'converted', %s
               )""",
            (lead_id, consultant_id),
        )
        cursor.execute(
            """INSERT INTO integration_sync_records
               (provider, entity_type, entity_id, status, last_error_safe)
               VALUES ('noura', 'lead', %s, 'failed', 'NOURA_TIMEOUT')""",
            (lead_id,),
        )

    async def actor_override() -> AuthorizationContext:
        return AuthorizationContext(
            user_id=actor_id,
            grants=(RoleGrant("super_admin", "global", None, frozenset({"report.read"})),),
        )

    app.dependency_overrides[authorization_context] = actor_override
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/reporting/dashboard", params={"from": "2026-01-01"})
        assert response.status_code == 200
        payload = response.json()
        assert payload["source"] == "local_temporary"
        assert payload["totalLeads"] >= 1
        assert all("mobile" not in item for item in payload["consultants"])
        assert any(item["code"] == "NOURA_TIMEOUT" for item in payload["syncErrors"])
    finally:
        app.dependency_overrides.clear()
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM integration_sync_records WHERE entity_id = %s", (lead_id,))
            cursor.execute("DELETE FROM leads WHERE id = %s", (lead_id,))
            cursor.execute(
                "DELETE FROM user_profiles WHERE user_id IN (%s, %s)", (actor_id, consultant_id)
            )
            cursor.execute("DELETE FROM users WHERE id IN (%s, %s)", (actor_id, consultant_id))
