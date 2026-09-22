from fastapi.testclient import TestClient

from app.main import app


def test_liveness() -> None:
    with TestClient(app) as client:
        response = client.get("/health/live")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_openapi_uses_versioned_api_boundary() -> None:
    with TestClient(app) as client:
        response = client.get("/openapi.json")
    assert response.status_code == 200
    application_paths = (
        path for path in response.json()["paths"] if not path.startswith("/health/")
    )
    assert all(path.startswith("/api/v1/") for path in application_paths)


def test_authentication_routes_are_registered() -> None:
    with TestClient(app) as client:
        paths = client.get("/openapi.json").json()["paths"]
    assert {
        "/api/v1/auth/register",
        "/api/v1/auth/login",
        "/api/v1/auth/logout",
        "/api/v1/auth/refresh",
        "/api/v1/auth/email-verifications",
        "/api/v1/auth/password-reset-requests",
        "/api/v1/auth/password-resets",
        "/api/v1/users/me",
    } <= paths.keys()
