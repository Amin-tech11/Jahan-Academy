import asyncio
import os
from datetime import UTC, datetime
from typing import cast
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient
from httpx import Response
from redis import Redis
from redis.asyncio import Redis as AsyncRedis

from app.core.config import get_settings
from app.main import app
from app.modules.identity.dependencies import auth_security
from app.modules.identity.reauth import consume, issue, key
from app.modules.identity.security import AccessClaims
from app.shared.exceptions import ApplicationError
from tests.integration.staff_mfa import login_enrolled_staff
from tests.integration.test_admin_user_management_flow import _cleanup, _seed_super_admin

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="isolated services"
)


async def test_stepup_session_binding_atomic_use_and_real_ttl() -> None:
    async with AsyncRedis.from_url(get_settings().redis_url, decode_responses=True) as redis:
        claims = AccessClaims(uuid4(), uuid4(), datetime.now(UTC))
        token = await issue(redis, claims, "POST", "/admin/staff")
        other = AccessClaims(claims.user_id, uuid4(), datetime.now(UTC))
        with pytest.raises(ApplicationError):
            await consume(redis, other, "POST", "/admin/staff", token)
        results = await asyncio.gather(
            *(consume(redis, claims, "POST", "/admin/staff", token) for _ in range(8)),
            return_exceptions=True,
        )
        assert sum(result is None for result in results) == 1
        assert sum(isinstance(result, ApplicationError) for result in results) == 7
        expiring = await issue(redis, claims, "POST", "/admin/staff")
        assert 0 < await redis.ttl(key(expiring)) <= 300
        await redis.expire(key(expiring), 1)
        await asyncio.sleep(1.1)
        with pytest.raises(ApplicationError):
            await consume(redis, claims, "POST", "/admin/staff", expiring)


def test_real_idle_activity_rotation_and_one_use_stepup() -> None:
    user_id = _seed_super_admin()
    database = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    email = f"session-security-{uuid4().hex}@example.com"
    password = "Synthetic-Session-Stepup-2026"
    try:
        with psycopg.connect(database) as db:
            db.execute(
                "UPDATE user_identities SET provider_subject=%s,normalized_value=%s,"
                "password_hash=%s WHERE user_id=%s",
                (email, email, auth_security().hash_password(password), user_id),
            )
        with TestClient(app) as client:
            signed = login_enrolled_staff(client, {"email": email}, password)
            data = signed.json()["data"]
            codes = iter(signed.extensions["unused_recovery_codes"])
            headers = {
                "Authorization": f"Bearer {data['accessToken']}",
                "X-CSRF-Token": data["csrfToken"],
            }
            sid = auth_security().decode_access_token(data["accessToken"]).session_id
            with psycopg.connect(database) as db:
                row = db.execute(
                    "UPDATE sessions SET last_seen_at=now()-interval '10 minutes' "
                    "WHERE id=%s RETURNING last_seen_at",
                    (sid,),
                ).fetchone()
                assert row is not None
                old = row[0]
            for _ in range(3):
                assert (
                    client.get("/api/v1/users/me/panel-access", headers=headers).status_code == 200
                )
            with psycopg.connect(database) as db:
                row = db.execute("SELECT last_seen_at FROM sessions WHERE id=%s", (sid,)).fetchone()
                assert row is not None and row[0] == old
            assert (
                client.post(
                    "/api/v1/auth/activity", headers={"Authorization": headers["Authorization"]}
                ).status_code
                == 403
            )
            assert client.post("/api/v1/auth/activity", headers=headers).status_code == 204
            with psycopg.connect(database) as db:
                row = db.execute("SELECT last_seen_at FROM sessions WHERE id=%s", (sid,)).fetchone()
                assert row is not None
                active = row[0]
                assert active > old
            rotated = client.post("/api/v1/auth/refresh", headers=headers)
            assert rotated.status_code == 200
            data = rotated.json()["data"]
            headers = {
                "Authorization": f"Bearer {data['accessToken']}",
                "X-CSRF-Token": data["csrfToken"],
            }
            sid = auth_security().decode_access_token(data["accessToken"]).session_id
            with psycopg.connect(database) as db:
                row = db.execute("SELECT last_seen_at FROM sessions WHERE id=%s", (sid,)).fetchone()
                assert row is not None and row[0] == active
            path = f"/admin/staff/{user_id}"
            target = "/api/v1" + path
            change = {"firstName": "Confirmed"}
            blocked = client.patch(target, headers={**headers, "If-Match": '"1"'}, json=change)
            assert blocked.status_code == 403
            assert blocked.json()["error"]["code"] == "REAUTH_REQUIRED"

            def proof(code: str, secret: str = password) -> Response:
                return cast(
                    Response,
                    client.post(
                        "/api/v1/auth/reauthenticate",
                        headers=headers,
                        json={
                            "password": secret,
                            "code": code,
                            "method": "PATCH",
                            "path": path,
                        },
                    ),
                )

            assert proof(next(codes), "wrong").status_code == 401
            bad = proof("invalid-proof")
            assert bad.status_code == 401
            accepted = proof(next(codes))
            assert accepted.status_code == 200, accepted.text
            token = accepted.json()["data"]["token"]
            fresh = {**headers, "If-Match": '"1"', "X-Reauth-Token": token}
            wrong_target = client.patch(
                f"/api/v1/admin/staff/{uuid4()}", headers=fresh, json=change
            )
            assert wrong_target.status_code == 403
            assert client.patch(target, headers=fresh, json=change).status_code == 200
            assert client.patch(target, headers=fresh, json=change).status_code == 403
            expired = proof(next(codes)).json()["data"]["token"]
            with Redis.from_url(get_settings().redis_url) as redis:
                redis.delete(key(expired))  # Deterministically simulate TTL expiration.
            assert (
                client.patch(
                    target, headers={**fresh, "X-Reauth-Token": expired}, json=change
                ).status_code
                == 403
            )
            # Foreground reads and refresh cannot rescue an already idle session.
            with psycopg.connect(database) as db:
                db.execute(
                    "UPDATE sessions SET last_seen_at=now()-interval '16 minutes' WHERE id=%s",
                    (sid,),
                )
            assert client.post("/api/v1/auth/activity", headers=headers).status_code == 401
            assert client.post("/api/v1/auth/refresh", headers=headers).status_code == 401
    finally:
        _cleanup(user_id, [])
