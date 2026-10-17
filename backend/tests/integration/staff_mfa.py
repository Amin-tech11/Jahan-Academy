"""Enroll synthetic staff through the real API before exercising privileged routes."""

import time
from typing import cast

from fastapi.testclient import TestClient
from httpx import Response

from app.modules.identity.mfa import MfaSecurity


def login_enrolled_staff(client: TestClient, identity: dict[str, str], password: str) -> Response:
    payload = {**identity, "password": password}
    initial = client.post("/api/v1/auth/login", json=payload)
    assert initial.status_code == 200, initial.text
    session = initial.json()["data"]
    assert session["mfaEnrollmentRequired"] is True
    headers = {
        "Authorization": f"Bearer {session['accessToken']}",
        "X-CSRF-Token": session["csrfToken"],
    }
    # Password-only sessions, including refreshed ones, cannot access private data.
    assert client.get("/api/v1/users/me", headers=headers).status_code == 403
    assert client.get("/api/v1/users/me/panel-access", headers=headers).status_code == 403
    refreshed = client.post("/api/v1/auth/refresh", headers=headers)
    assert refreshed.status_code == 200, refreshed.text
    session = refreshed.json()["data"]
    assert session["mfaEnrollmentRequired"] is True
    headers = {
        "Authorization": f"Bearer {session['accessToken']}",
        "X-CSRF-Token": session["csrfToken"],
    }
    assert client.get("/api/v1/users/me", headers=headers).status_code == 403
    setup = client.post("/api/v1/auth/mfa/setup", headers=headers, json={"password": password})
    assert setup.status_code == 200, setup.text
    code = MfaSecurity.code(setup.json()["data"]["secret"], int(time.time() / 30))
    confirmation = client.post(
        "/api/v1/auth/mfa/confirm",
        headers=headers,
        json={"password": password, "code": code},
    )
    assert confirmation.status_code == 200, confirmation.text
    assert client.get("/api/v1/users/me", headers=headers).status_code == 401
    codes = confirmation.json()["data"]["recoveryCodes"]
    assert client.post("/api/v1/auth/login", json=payload).json()["error"]["code"] == "MFA_REQUIRED"
    authenticated = client.post("/api/v1/auth/login", json={**payload, "mfaCode": codes[0]})
    assert authenticated.status_code == 200, authenticated.text
    assert authenticated.json()["data"]["mfaEnrollmentRequired"] is False
    assert (
        client.post("/api/v1/auth/login", json={**payload, "mfaCode": codes[0]}).status_code == 401
    )
    session = authenticated.json()["data"]
    forbidden = client.post(
        "/api/v1/auth/mfa/disable",
        headers={
            "Authorization": f"Bearer {session['accessToken']}",
            "X-CSRF-Token": session["csrfToken"],
        },
        json={"password": password, "code": codes[1]},
    )
    assert forbidden.status_code == 403, forbidden.text
    assert forbidden.json()["error"]["code"] == "MFA_REQUIRED_FOR_STAFF"
    return cast(Response, authenticated)
