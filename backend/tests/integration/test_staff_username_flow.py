import os
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.identity.dependencies import auth_security
from tests.integration.staff_mfa import login_enrolled_staff

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires migrated PostgreSQL and Redis"
)


@pytest.mark.parametrize("role", ["super_admin", "support", "consultant", "content_editor"])
def test_staff_username_login_requires_mfa_and_preserves_section_isolation(role: str) -> None:
    user_id = uuid4()
    name = f"support-{uuid4().hex[:12]}"
    email = f"{name}@example.com"
    password = "Test-Staff-Password-2026"
    database = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    with psycopg.connect(database) as connection, connection.cursor() as cursor:
        cursor.execute("INSERT INTO users (id, status) VALUES (%s,'active')", (user_id,))
        cursor.execute(
            "INSERT INTO user_profiles (user_id,first_name,last_name) VALUES (%s,'Test','Support')",
            (user_id,),
        )
        cursor.execute(
            "INSERT INTO user_identities "
            "(user_id,provider,provider_subject,normalized_value,password_hash,verified_at) "
            "VALUES (%s,'email',%s,%s,%s,now())",
            (user_id, email, email, auth_security().hash_password(password)),
        )
        cursor.execute(
            "INSERT INTO user_roles (user_id,role_id,scope_type) "
            "SELECT %s,id,'global' FROM roles WHERE code=%s",
            (user_id, role),
        )
        cursor.execute(
            "INSERT INTO staff_login_names (user_id,username) VALUES (%s,%s)", (user_id, name)
        )
        cursor.execute(
            "INSERT INTO staff_panel_access (user_id,sections) VALUES (%s,ARRAY['leads'])",
            (user_id,),
        )
    try:
        with TestClient(app) as client:
            result = login_enrolled_staff(client, {"username": name.upper()}, password)
            assert result.status_code == 200, result.text
            headers = {"Authorization": f"Bearer {result.json()['data']['accessToken']}"}
            sections = client.get("/api/v1/users/me/panel-access", headers=headers).json()["data"][
                "sections"
            ]
            assert "leads" in sections
            assert client.get("/api/v1/admin/leads", headers=headers).status_code == 200
            for path in (
                "/admin/staff",
                "/admin/universities",
                "/admin/audit-logs",
                "/reporting/dashboard",
            ):
                expected = 200 if role == "super_admin" else 403
                assert client.get("/api/v1" + path, headers=headers).status_code == expected
            wrong = client.post("/api/v1/auth/login", json={"username": name, "password": "wrong"})
            assert wrong.status_code == 401
    finally:
        with psycopg.connect(database) as connection, connection.cursor() as cursor:
            cursor.execute("DELETE FROM audit_logs WHERE actor_user_id=%s", (user_id,))
            cursor.execute("DELETE FROM users WHERE id=%s", (user_id,))
