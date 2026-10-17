import asyncio
import os
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from redis.asyncio import Redis

from app.core.config import Settings, get_settings
from app.main import app
from app.modules.identity.abuse import AuthAbuseControl
from app.shared.exceptions import ApplicationError

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires isolated Redis",
)


def test_http_limits_normalized_login_and_combined_email_requests() -> None:
    identifier = f"missing-{uuid4().hex}@example.com"
    with TestClient(app) as client:
        for index in range(10):
            result = client.post(
                "/api/v1/auth/login",
                json={
                    "email": identifier if index % 2 else identifier.upper(),
                    "password": "wrong",
                },
            )
            assert result.status_code == 401
        result = client.post(
            "/api/v1/auth/login",
            json={
                "email": identifier,
                "password": "wrong",
            },
        )
        assert result.status_code == 429
        assert 0 < int(result.headers["Retry-After"]) <= 900
        for endpoint in [
            "password-reset-requests",
            "email-verification-requests",
            "password-reset-requests",
        ]:
            assert (
                client.post(f"/api/v1/auth/{endpoint}", json={"email": identifier}).status_code
                == 202
            )
        result = client.post("/api/v1/auth/email-verification-requests", json={"email": identifier})
        assert result.status_code == 429


async def test_atomic_limits_across_clients_and_expiry() -> None:
    async with Redis.from_url(get_settings().redis_url) as redis:
        settings = Settings(_env_file=None, auth_ip_limit=3, auth_identifier_limit=2)
        control = AuthAbuseControl(redis, settings)
        subject = uuid4().hex
        results = await asyncio.gather(
            *(control.check_request("login", f"{subject}-{i}", subject) for i in range(20)),
            return_exceptions=True,
        )
        assert sum(result is None for result in results) == 2
        assert all(result is None or isinstance(result, ApplicationError) for result in results)
        for i in range(3):
            await control.check_request("login", subject, f"{subject}-different-{i}")
        with pytest.raises(ApplicationError) as error:
            await control.check_request("login", subject, "another-account")
        assert error.value.status_code == 429
        await redis.expire(control._key("login:identifier", subject), 1)
        await asyncio.sleep(1.1)
        await control.check_request("login", f"new-{subject}", subject)


async def test_windowed_failures_exponential_backoff_cap_and_reset() -> None:
    async with Redis.from_url(get_settings().redis_url) as redis:
        control = AuthAbuseControl(redis, Settings(_env_file=None))
        user_id = uuid4()
        assert await control.register_failure(user_id) == (1, 0)
        await redis.expire(control._key("failures", str(user_id)), 1)
        await asyncio.sleep(1.1)
        assert await control.register_failure(user_id) == (1, 0)
        for expected_delay in [900, 1800, 3600, 7200, 14400, 28800, 57600, 86400, 86400]:
            start = 1 if expected_delay == 900 else 0
            for _ in range(start, 4):
                _, delay = await control.register_failure(user_id)
                assert delay == 0
            assert await control.register_failure(user_id) == (5, expected_delay)
        await control.clear_failures(user_id)
        assert await control.register_failure(user_id) == (1, 0)


async def test_rotating_refresh_tokens_cannot_bypass_account_limit() -> None:
    async with Redis.from_url(get_settings().redis_url) as redis:
        control = AuthAbuseControl(
            redis,
            Settings(
                _env_file=None,
                auth_refresh_identifier_limit=2,
            ),
        )
        user_id = uuid4()
        for _ in range(2):
            await control.check_account("refresh", user_id)
        with pytest.raises(ApplicationError) as error:
            await control.check_account("refresh", user_id)
        assert error.value.status_code == 429
