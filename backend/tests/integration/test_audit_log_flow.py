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


def test_super_admin_can_filter_immutable_audit_events() -> None:
    actor_id, event_id = uuid4(), uuid4()
    with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
        cursor.execute(
            "INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id) "
            "VALUES (%s, %s, 'lead.assigned', 'lead', %s)",
            (event_id, actor_id, uuid4()),
        )

    async def actor_override() -> AuthorizationContext:
        return AuthorizationContext(
            user_id=actor_id,
            grants=(RoleGrant("super_admin", "global", None, frozenset({"audit.read"})),),
        )

    app.dependency_overrides[authorization_context] = actor_override
    try:
        with TestClient(app) as client:
            response = client.get("/api/v1/admin/audit-logs", params={"action": "lead.assigned"})
        assert response.status_code == 200
        assert any(item["id"] == str(event_id) for item in response.json()["data"])
    finally:
        app.dependency_overrides.clear()
        with psycopg.connect(_database_url()) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM audit_logs WHERE id = %s", (event_id,))
            cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))
