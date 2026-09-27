from __future__ import annotations

import os
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.database import session_factory
from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import (
    auth_security,
    authorization_context,
    staff_management_service,
)
from app.modules.identity.mailer import AuthMailer
from app.modules.identity.staff_repository import StaffRepository
from app.modules.identity.staff_service import StaffManagementService

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL",
)


class CapturingMailer(AuthMailer):
    def __init__(self) -> None:
        self.password_resets: list[tuple[str, str]] = []

    async def send_email_verification(self, email: str, token: str) -> None:
        del email, token

    async def send_password_reset(self, email: str, token: str) -> None:
        self.password_resets.append((email, token))


def _sync_database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _seed_super_admin() -> UUID:
    actor_id = uuid4()
    marker = uuid4().hex
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
        cursor.execute(
            """
            INSERT INTO user_profiles (user_id, first_name, last_name)
            VALUES (%s, 'System', 'Admin')
            """,
            (actor_id,),
        )
        cursor.execute(
            """
            INSERT INTO user_identities (
                id, user_id, provider, provider_subject, normalized_value,
                password_hash, verified_at
            ) VALUES (%s, %s, 'email', %s, %s, %s, now())
            """,
            (
                uuid4(),
                actor_id,
                f"admin-{marker}@jahanacademy.dev",
                f"admin-{marker}@jahanacademy.dev",
                "x",
            ),
        )
        cursor.execute(
            """
            INSERT INTO user_roles (user_id, role_id, scope_type)
            SELECT %s, id, 'global' FROM roles WHERE code = 'super_admin'
            """,
            (actor_id,),
        )
    return actor_id


def _cleanup(actor_id: UUID, staff_ids: list[UUID]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        all_ids = [actor_id, *staff_ids]
        cursor.execute(
            "DELETE FROM audit_logs WHERE actor_user_id = ANY(%s) OR entity_id = ANY(%s)",
            (all_ids, all_ids),
        )
        cursor.execute("DELETE FROM users WHERE id = ANY(%s)", (all_ids,))


def test_staff_administration_lifecycle_roles_and_access_recovery() -> None:
    actor_id = _seed_super_admin()
    staff_ids: list[UUID] = []
    mailer = CapturingMailer()
    actor = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="super_admin",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"identity.manage", "role.manage"}),
            ),
        ),
    )

    async def actor_override() -> AuthorizationContext:
        return actor

    async def staff_service_override():
        async with session_factory() as session:
            yield StaffManagementService(
                repository=StaffRepository(session),
                security=auth_security(),
                mailer=mailer,
                settings=get_settings(),
            )

    app.dependency_overrides[authorization_context] = actor_override
    app.dependency_overrides[staff_management_service] = staff_service_override
    try:
        with TestClient(app) as client:
            created = client.post(
                "/api/v1/admin/staff",
                json={
                    "email": "team.member@jahanacademy.dev",
                    "firstName": "Team",
                    "lastName": "Member",
                    "roleCodes": ["support", "consultant", "content_editor"],
                },
            )
            assert created.status_code == 201, created.text
            staff_id = UUID(created.json()["data"]["id"])
            staff_ids.append(staff_id)
            assert created.json()["data"]["active"] is True
            assert {item["code"] for item in created.json()["data"]["roles"]} == {
                "support",
                "consultant",
                "content_editor",
            }
            assert mailer.password_resets[-1][0] == "team.member@jahanacademy.dev"

            listed = client.get("/api/v1/admin/staff", params={"q": "team.member"})
            assert listed.status_code == 200, listed.text
            assert listed.json()["meta"]["total"] == 1

            updated = client.patch(
                f"/api/v1/admin/staff/{staff_id}",
                headers={"If-Match": created.headers["etag"]},
                json={"firstName": "Updated", "active": False},
            )
            assert updated.status_code == 200, updated.text
            assert updated.json()["data"]["status"] == "disabled"

            without_reactivation = client.post(
                f"/api/v1/admin/staff/{staff_id}/access-recovery",
                headers={"If-Match": updated.headers["etag"]},
                json={},
            )
            assert without_reactivation.status_code == 409
            assert without_reactivation.json()["error"]["code"] == "STAFF_REACTIVATION_REQUIRED"

            recovered = client.post(
                f"/api/v1/admin/staff/{staff_id}/access-recovery",
                headers={"If-Match": updated.headers["etag"]},
                json={"reactivate": True},
            )
            assert recovered.status_code == 202, recovered.text
            assert recovered.json()["data"]["active"] is True

            reset = client.post(
                "/api/v1/auth/password-resets",
                json={
                    "token": mailer.password_resets[-1][1],
                    "newPassword": "A-strong-password-2026",
                },
            )
            assert reset.status_code == 204, reset.text
            login = client.post(
                "/api/v1/auth/login",
                json={
                    "email": "team.member@jahanacademy.dev",
                    "password": "A-strong-password-2026",
                },
            )
            assert login.status_code == 200, login.text

            roles = client.put(
                f"/api/v1/admin/staff/{staff_id}/roles",
                headers={"If-Match": recovered.headers["etag"]},
                json={"roleCodes": ["consultant"]},
            )
            assert roles.status_code == 200, roles.text
            assert roles.json()["data"]["roles"] == [{"code": "consultant"}]

            stale = client.patch(
                f"/api/v1/admin/staff/{staff_id}",
                headers={"If-Match": recovered.headers["etag"]},
                json={"lastName": "Stale"},
            )
            assert stale.status_code == 412

            actor_view = client.get(f"/api/v1/admin/staff/{actor_id}")
            assert actor_view.status_code == 200, actor_view.text
            last_admin = client.put(
                f"/api/v1/admin/staff/{actor_id}/roles",
                headers={"If-Match": actor_view.headers["etag"]},
                json={"roleCodes": ["content_editor"]},
            )
            assert last_admin.status_code == 409
            assert last_admin.json()["error"]["code"] == "LAST_SUPER_ADMIN_PROTECTED"
    finally:
        app.dependency_overrides.clear()
        _cleanup(actor_id, staff_ids)
