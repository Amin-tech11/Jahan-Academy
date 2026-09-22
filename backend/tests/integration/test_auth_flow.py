from __future__ import annotations

import os
from collections.abc import AsyncIterator

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.database import session_factory
from app.main import app
from app.modules.identity.dependencies import auth_security, auth_service
from app.modules.identity.mailer import AuthMailer
from app.modules.identity.repository import AuthRepository
from app.modules.identity.service import AuthService

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL",
)


class CapturingMailer(AuthMailer):
    verification_token: str | None = None
    password_reset_token: str | None = None

    async def send_email_verification(self, email: str, token: str) -> None:
        self.verification_token = token

    async def send_password_reset(self, email: str, token: str) -> None:
        self.password_reset_token = token


def test_complete_email_authentication_lifecycle() -> None:
    mailer = CapturingMailer()

    async def service_override() -> AsyncIterator[AuthService]:
        async with session_factory() as session:
            yield AuthService(
                repository=AuthRepository(session),
                security=auth_security(),
                mailer=mailer,
                settings=get_settings(),
            )

    app.dependency_overrides[auth_service] = service_override
    email = "auth-flow@example.com"
    original_password = "Secure-Password-2026"
    replacement_password = "Replacement-Password-2027"

    try:
        with TestClient(app) as client:
            registration = client.post(
                "/api/v1/auth/register",
                json={
                    "email": email,
                    "password": original_password,
                    "firstName": "Auth",
                    "lastName": "Flow",
                    "locale": "fa",
                    "acceptedTermsVersion": "1.0",
                    "acceptedPrivacyVersion": "1.0",
                },
            )
            assert registration.status_code == 202
            assert mailer.verification_token is not None

            before_verification = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": original_password},
            )
            assert before_verification.status_code == 403
            assert before_verification.json()["error"]["code"] == "EMAIL_NOT_VERIFIED"

            verification = client.post(
                "/api/v1/auth/email-verifications",
                json={"token": mailer.verification_token},
            )
            assert verification.status_code == 200
            access_token = verification.json()["data"]["accessToken"]
            csrf_token = verification.json()["data"]["csrfToken"]
            original_refresh = client.cookies.get("jahan_refresh")
            assert original_refresh

            current_user = client.get(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            assert current_user.status_code == 200
            assert current_user.json()["data"]["email"] == email

            rotated = client.post(
                "/api/v1/auth/refresh",
                headers={"X-CSRF-Token": csrf_token},
            )
            assert rotated.status_code == 200
            rotated_csrf = rotated.json()["data"]["csrfToken"]
            assert client.cookies.get("jahan_refresh") != original_refresh

            client.cookies.delete("jahan_refresh", path="/api/v1/auth")
            client.cookies.set("jahan_refresh", original_refresh, path="/api/v1/auth")
            reused = client.post(
                "/api/v1/auth/refresh",
                headers={"X-CSRF-Token": rotated_csrf},
            )
            assert reused.status_code == 401
            assert reused.json()["error"]["code"] == "REFRESH_TOKEN_REUSED"

            reset_request = client.post(
                "/api/v1/auth/password-reset-requests",
                json={"email": email},
            )
            assert reset_request.status_code == 202
            assert mailer.password_reset_token is not None

            reset = client.post(
                "/api/v1/auth/password-resets",
                json={
                    "token": mailer.password_reset_token,
                    "newPassword": replacement_password,
                },
            )
            assert reset.status_code == 204

            login = client.post(
                "/api/v1/auth/login",
                json={"email": email, "password": replacement_password},
            )
            assert login.status_code == 200
            final_access = login.json()["data"]["accessToken"]
            final_csrf = login.json()["data"]["csrfToken"]

            logout = client.post(
                "/api/v1/auth/logout",
                headers={
                    "Authorization": f"Bearer {final_access}",
                    "X-CSRF-Token": final_csrf,
                },
            )
            assert logout.status_code == 204

            after_logout = client.get(
                "/api/v1/users/me",
                headers={"Authorization": f"Bearer {final_access}"},
            )
            assert after_logout.status_code == 401
            assert after_logout.json()["error"]["code"] == "SESSION_EXPIRED"
    finally:
        app.dependency_overrides.clear()
