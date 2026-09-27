from __future__ import annotations

from fastapi.testclient import TestClient
from pydantic import SecretStr

from app.core.config import Settings
from app.core.operational import monitoring_token_is_valid
from app.main import app


def test_api_responses_include_security_and_correlation_headers() -> None:
    with TestClient(app) as client:
        response = client.get("/health/live", headers={"X-Request-ID": "trace-123"})

    assert response.status_code == 200
    assert response.headers["x-request-id"] == "trace-123"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert "frame-ancestors 'none'" in response.headers["content-security-policy"]


def test_monitoring_token_uses_constant_time_comparison() -> None:
    settings = Settings(monitoring_token=SecretStr("m" * 32))

    assert monitoring_token_is_valid("m" * 32, settings)
    assert not monitoring_token_is_valid("wrong", settings)
    assert not monitoring_token_is_valid(None, settings)


def test_production_requires_monitoring_secret() -> None:
    try:
        Settings(
            environment="production",
            cookie_secure=True,
            session_secret=SecretStr("s" * 32),
        )
    except ValueError as error:
        assert "JAHAN_MONITORING_TOKEN" in str(error)
    else:
        raise AssertionError("Production must require a monitoring token")
