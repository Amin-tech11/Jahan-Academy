from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from http.cookies import SimpleCookie
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.identity.dependencies import auth_security
from tests.integration.staff_mfa import login_enrolled_staff
from tests.integration.test_admin_user_management_flow import _cleanup, _seed_super_admin

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="requires isolated database and Redis"
)


@pytest.mark.parametrize("expired_by", ["idle", "absolute", "missing_root"])
@pytest.mark.parametrize("first_request", ["access", "refresh"])
def test_access_and_refresh_reject_expired_staff_sessions(
    expired_by: str, first_request: str
) -> None:
    user_id = _seed_super_admin()
    email = f"expiry-{uuid4().hex}@example.com"
    password = "Synthetic-Session-Password-2026"
    database = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    try:
        with psycopg.connect(database) as db:
            db.execute(
                "UPDATE user_identities SET provider_subject=%s, normalized_value=%s, "
                "password_hash=%s WHERE user_id=%s",
                (email, email, auth_security().hash_password(password), user_id),
            )
        with TestClient(app) as client:
            result = login_enrolled_staff(client, {"email": email}, password)
            issued = result.json()["data"]
            for cookie in result.headers.get_list("set-cookie"):
                parsed = SimpleCookie()
                parsed.load(cookie)
                for value in parsed.values():
                    assert 0 < int(value["max-age"]) <= 8 * 60 * 60
            access = issued["accessToken"]
            csrf = issued["csrfToken"]
            sid = auth_security().decode_access_token(access).session_id
            # Passive reads cannot extend the idle deadline; explicit input can.
            with psycopg.connect(database) as db:
                db.execute(
                    "UPDATE sessions SET last_seen_at=now()-interval '10 minutes' WHERE id=%s",
                    (sid,),
                )
            before = datetime.now(UTC)
            assert (
                client.get(
                    "/api/v1/users/me", headers={"Authorization": f"Bearer {access}"}
                ).status_code
                == 200
            )
            with psycopg.connect(database) as db:
                row = db.execute(
                    "SELECT last_seen_at, family_id, expires_at FROM sessions WHERE id=%s", (sid,)
                ).fetchone()
                assert row is not None
                seen, family, original_expiry = row
                assert seen < before
            active = client.post(
                "/api/v1/auth/activity",
                headers={
                    "Authorization": f"Bearer {access}",
                    "X-CSRF-Token": csrf,
                },
            )
            assert active.status_code == 204
            rotated = client.post("/api/v1/auth/refresh", headers={"X-CSRF-Token": csrf})
            assert rotated.status_code == 200, rotated.text
            current = rotated.json()["data"]
            current_sid = auth_security().decode_access_token(current["accessToken"]).session_id
            with psycopg.connect(database) as db:
                row = db.execute(
                    "SELECT expires_at FROM sessions WHERE id=%s", (current_sid,)
                ).fetchone()
                assert row is not None
                new_expiry = row[0]
                assert new_expiry == original_expiry
                assert original_expiry <= datetime.now(UTC) + timedelta(hours=8)
                if expired_by == "idle":
                    db.execute(
                        "UPDATE sessions SET last_seen_at=now()-interval '16 minutes' WHERE id=%s",
                        (current_sid,),
                    )
                elif expired_by == "absolute":
                    # A legacy 30-day expiry must still obey the original family age.
                    db.execute(
                        "UPDATE sessions SET created_at=now()-interval '9 hours' WHERE id=%s",
                        (family,),
                    )
                    db.execute(
                        "UPDATE sessions SET expires_at=now()+interval '30 days' WHERE id=%s",
                        (current_sid,),
                    )
                else:
                    db.execute(
                        "UPDATE sessions SET family_id=%s WHERE id=%s", (uuid4(), current_sid)
                    )
            headers = {"Authorization": f"Bearer {current['accessToken']}"}
            if first_request == "refresh":
                assert (
                    client.post(
                        "/api/v1/auth/refresh", headers={"X-CSRF-Token": current["csrfToken"]}
                    ).status_code
                    == 401
                )
            denied = client.get("/api/v1/users/me", headers=headers)
            assert denied.status_code == 401, denied.text
            assert denied.json()["error"]["code"] == "SESSION_EXPIRED"
            assert (
                client.post(
                    "/api/v1/auth/refresh", headers={"X-CSRF-Token": current["csrfToken"]}
                ).status_code
                == 401
            )
    finally:
        _cleanup(UUID(str(user_id)), [])
