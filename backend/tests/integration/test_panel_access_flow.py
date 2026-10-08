from __future__ import annotations

import os
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.identity.dependencies import auth_security
from tests.integration.test_admin_user_management_flow import _cleanup, _seed_super_admin

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires migrated PostgreSQL"
)


def test_real_sessions_follow_grants_revocations_and_super_admin_protection() -> None:
    admin_id, staff_id = _seed_super_admin(), _seed_super_admin()
    marker = uuid4().hex
    emails = {admin_id: f"admin-{marker}@example.com", staff_id: f"staff-{marker}@example.com"}
    password = "Panel-access-test-2026"
    db_url = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    lead_ids = [uuid4(), uuid4()]
    try:
        with psycopg.connect(db_url) as connection, connection.cursor() as cursor:
            for user_id, email in emails.items():
                cursor.execute(
                    "UPDATE user_identities SET normalized_value=%s, provider_subject=%s, "
                    "password_hash=%s WHERE user_id=%s",
                    (email, email, auth_security().hash_password(password), user_id),
                )
            cursor.execute("DELETE FROM user_roles WHERE user_id=%s", (staff_id,))
            cursor.execute(
                "INSERT INTO user_roles (user_id, role_id, scope_type) "
                "SELECT %s, id, 'global' FROM roles WHERE code='consultant'",
                (staff_id,),
            )
            for index, lead_id in enumerate(lead_ids):
                cursor.execute(
                    "INSERT INTO leads (id, public_reference, first_name, last_name, mobile_raw, "
                    "mobile_normalized, locale, status, assigned_consultant_id) "
                    "VALUES (%s,%s,'Access','Test','+989121234567','+989121234567','fa','new',%s)",
                    (lead_id, f"PA-{uuid4().hex[:12]}", staff_id if index == 0 else None),
                )
        with TestClient(app) as client:
            tokens = {}
            for user_id, email in emails.items():
                result = client.post(
                    "/api/v1/auth/login", json={"email": email, "password": password}
                )
                assert result.status_code == 200, result.text
                tokens[user_id] = {
                    "Authorization": f"Bearer {result.json()['data']['accessToken']}"
                }
            admin, staff = tokens[admin_id], tokens[staff_id]
            path = f"/api/v1/admin/staff/{staff_id}/panel-access"
            own = "/api/v1/users/me/panel-access"
            own_response = client.get(own, headers=staff)
            assert own_response.status_code == 200, own_response.text
            assert own_response.json()["data"]["sections"] == ["leads"]
            assert client.get(own, headers=admin).json()["data"]["isSuperAdmin"] is True
            leads = client.get("/api/v1/admin/leads", headers=staff)
            assert leads.status_code == 200, leads.text
            ids = {UUID(item["id"]) for item in leads.json()["data"]}
            assert lead_ids[0] in ids and lead_ids[1] not in ids
            assert client.get("/api/v1/admin/universities", headers=staff).status_code == 403
            assert client.get(path, headers=staff).status_code == 403
            assert client.get("/api/v1/admin/audit-logs", headers=staff).status_code == 403
            assert client.get(own).status_code == 401
            assert client.put(path, headers=admin, json={"sections": []}).status_code == 428
            for reserved in ("staff", "audit", "access", "unknown"):
                invalid = client.put(
                    path, headers={**admin, "If-Match": '"1"'}, json={"sections": [reserved]}
                )
                assert invalid.status_code == 422
            granted = client.put(
                path,
                headers={**admin, "If-Match": '"1"'},
                json={"sections": ["leads", "universities"]},
            )
            assert granted.status_code == 200, granted.text
            assert granted.json()["data"]["version"] == 2
            assert client.get("/api/v1/admin/universities", headers=staff).status_code == 200
            assert client.get("/api/v1/admin/programs", headers=staff).status_code == 403
            stale = client.put(path, headers={**admin, "If-Match": '"1"'}, json={"sections": []})
            assert stale.status_code == 412
            denied = client.put(
                path, headers={**staff, "If-Match": '"2"'}, json={"sections": ["dashboard"]}
            )
            assert denied.status_code == 403
            revoked = client.put(path, headers={**admin, "If-Match": '"2"'}, json={"sections": []})
            assert revoked.status_code == 200, revoked.text
            assert client.get(own, headers=staff).json()["data"]["sections"] == []
            assert client.get("/api/v1/admin/leads", headers=staff).status_code == 403
            assert client.get("/api/v1/admin/universities", headers=staff).status_code == 403
            protected = client.put(
                f"/api/v1/admin/staff/{admin_id}/panel-access",
                headers={**admin, "If-Match": '"1"'},
                json={"sections": []},
            )
            assert protected.status_code == 409
        with psycopg.connect(db_url) as connection, connection.cursor() as cursor:
            cursor.execute(
                "SELECT count(*) FROM audit_logs WHERE entity_id=%s "
                "AND action='staff.panel_access_updated'",
                (staff_id,),
            )
            assert cursor.fetchone() == (2,)
    finally:
        with psycopg.connect(db_url) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM leads WHERE id = ANY(%s)", (lead_ids,))
        _cleanup(admin_id, [staff_id])
