from __future__ import annotations

from typing import cast
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import FastAPI, Request
from fastapi.testclient import TestClient
from pydantic import SecretStr
from redis.asyncio import Redis
from redis.exceptions import ConnectionError as RedisConnectionError

from app.core.client_ip import TrustedClientIPMiddleware
from app.core.config import Settings
from app.core.operational import OperationalMiddleware
from app.core.rate_limit import WINDOW_SCRIPT, window_count
from app.modules.consultations.rate_limit import ConsultationRateLimiter
from app.shared.exceptions import ApplicationError


async def test_atomic_window_and_consultation_limit() -> None:
    client = AsyncMock(spec=Redis)
    client.eval = AsyncMock(return_value=6)
    assert await window_count(cast(Redis, client), "subject", 600) == 6
    client.eval.assert_awaited_once_with(WINDOW_SCRIPT, 1, "subject", "600")
    limiter = ConsultationRateLimiter(cast(Redis, client), limit=5, window_seconds=600)
    assert not await limiter.allow("mobile-hash")
    client.eval.side_effect = RedisConnectionError()
    with pytest.raises(ApplicationError) as error:
        await limiter.allow("mobile-hash")
    assert error.value.status_code == 503


def test_api_fails_closed_and_liveness_remains_available() -> None:
    app = FastAPI()
    app.add_middleware(OperationalMiddleware, settings=Settings())

    @app.get("/api/private")
    @app.get("/health/live")
    def endpoint() -> dict[str, bool]:
        return {"ok": True}

    client = AsyncMock(spec=Redis)
    client.eval.side_effect = RedisConnectionError()
    with patch("app.core.operational.get_redis", return_value=client), TestClient(app) as http:
        response = http.get("/api/private")
        assert response.status_code == 503
        assert response.headers["retry-after"] == "30"
        assert response.headers["x-content-type-options"] == "nosniff"
        assert http.get("/health/live").status_code == 200


def test_forwarded_ip_requires_internal_credential_and_valid_address() -> None:
    secret = "proxy-key-" + "s" * 32
    app = FastAPI()
    app.add_middleware(
        TrustedClientIPMiddleware, settings=Settings(trusted_proxy_secret=SecretStr(secret))
    )

    @app.get("/")
    def endpoint(request: Request) -> dict[str, str | None]:
        return {
            "ip": request.client.host if request.client else None,
            "key": request.headers.get("x-jahan-proxy-key"),
        }

    with TestClient(app) as http:
        assert http.get("/", headers={"X-Forwarded-For": "1.2.3.4"}).json()["ip"] == "testclient"
        assert (
            http.get(
                "/", headers={"X-Jahan-Proxy-Key": "wrong", "X-Jahan-Client-IP": "1.2.3.4"}
            ).json()["ip"]
            == "testclient"
        )
        assert (
            http.get(
                "/", headers={"X-Jahan-Proxy-Key": secret, "X-Jahan-Client-IP": "bad,1.2.3.4"}
            ).json()["ip"]
            == "testclient"
        )
        assert http.get(
            "/", headers={"X-Jahan-Proxy-Key": secret, "X-Jahan-Client-IP": "2001:db8::1"}
        ).json() == {"ip": "2001:db8::1", "key": None}
