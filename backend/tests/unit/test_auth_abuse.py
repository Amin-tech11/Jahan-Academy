from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import Request
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core.config import Settings
from app.modules.identity.abuse import AuthAbuseControl
from app.modules.identity.router import auth_request_limit
from app.modules.identity.security import AuthSecurity, _common_password_hashes
from app.shared.exceptions import ApplicationError


async def test_limit_returns_actual_retry_after_and_hides_identifiers() -> None:
    redis = AsyncMock()
    redis.eval.return_value = 47
    control = AuthAbuseControl(redis, Settings(_env_file=None))
    with pytest.raises(ApplicationError) as error:
        await control.check_request("login", "192.0.2.1", "private@example.com")
    assert error.value.status_code == 429
    assert error.value.headers["Retry-After"] == "47"
    assert "192.0.2.1" not in str(redis.eval.call_args)
    assert "private@example.com" not in control._key("login", "private@example.com")


@pytest.mark.parametrize("action", ["request", "account", "failure", "clear"])
async def test_redis_outage_does_not_disable_authentication_protection(action: str) -> None:
    redis = AsyncMock()
    redis.eval.side_effect = RedisConnectionError("unavailable")
    redis.delete.side_effect = RedisConnectionError("unavailable")
    control = AuthAbuseControl(redis, Settings(_env_file=None))
    operations = {
        "request": lambda: control.check_request("login", "192.0.2.1", "account"),
        "account": lambda: control.check_account("login", uuid4()),
        "failure": lambda: control.register_failure(uuid4()),
        "clear": lambda: control.clear_failures(uuid4()),
    }
    with pytest.raises(ApplicationError) as error:
        await operations[action]()
    assert error.value.status_code == 503
    assert error.value.code == "AUTH_LIMITER_UNAVAILABLE"


@pytest.mark.parametrize(
    "endpoint", ["login", "password-reset-requests", "email-verification-requests"]
)
async def test_identifier_normalization_and_shared_email_limit(endpoint: str) -> None:
    async def receive() -> dict:
        return {"type": "http.request", "body": b'{"email":"  TEST@EXAMPLE.COM  "}'}

    request = Request(
        {
            "type": "http",
            "method": "POST",
            "path": f"/api/v1/auth/{endpoint}",
            "headers": [],
            "client": ("192.0.2.1", 1234),
            "scheme": "http",
            "server": ("localhost", 80),
            "query_string": b"",
        },
        receive,
    )
    abuse = AsyncMock(spec=AuthAbuseControl)
    settings = Settings(_env_file=None)
    await auth_request_limit(request, abuse, AuthSecurity(settings), settings)
    abuse.check_request.assert_awaited_once_with(
        "login" if endpoint == "login" else "email",
        "192.0.2.1",
        "test@example.com",
    )


def test_missing_password_blocklist_fails_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    from pathlib import Path

    _common_password_hashes.cache_clear()
    monkeypatch.setattr(Path, "read_text", lambda *args, **kwargs: "invalid-json")
    try:
        with pytest.raises(ApplicationError) as error:
            _common_password_hashes()
        assert error.value.code == "PASSWORD_POLICY_UNAVAILABLE"
    finally:
        _common_password_hashes.cache_clear()
