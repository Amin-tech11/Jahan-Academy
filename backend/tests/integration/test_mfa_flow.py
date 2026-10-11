from __future__ import annotations

import os
import time
from collections.abc import AsyncIterator
from concurrent.futures import ThreadPoolExecutor
from uuid import uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.core.database import session_factory
from app.main import app
from app.modules.identity.dependencies import auth_security, auth_service
from app.modules.identity.mfa import MfaSecurity
from app.modules.identity.repository import AuthRepository
from app.modules.identity.service import AuthService
from tests.integration.test_auth_flow import CapturingMailer

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires isolated migrated database and Redis",
)


def test_optional_mfa_enrollment_replay_recovery_and_session_revocation() -> None:
    mailer = CapturingMailer()

    async def override() -> AsyncIterator[AuthService]:
        async with session_factory() as session:
            yield AuthService(AuthRepository(session), auth_security(), mailer, get_settings())

    app.dependency_overrides[auth_service] = override
    email = f"mfa-{uuid4().hex}@example.com"
    password = "Secure-Password-2026"
    database = os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")
    try:
        with TestClient(app) as client:
            assert client.get("/api/v1/auth/mfa").status_code == 401
            registration = client.post(
                "/api/v1/auth/register",
                json={
                    "email": email,
                    "password": password,
                    "firstName": "MFA",
                    "lastName": "Test",
                    "acceptedTermsVersion": "1.0",
                    "acceptedPrivacyVersion": "1.0",
                },
            )
            assert registration.status_code == 202
            verified = client.post(
                "/api/v1/auth/email-verifications", json={"token": mailer.verification_token}
            )
            assert verified.status_code == 200
            account = verified.json()["data"]
            headers = {
                "Authorization": "Bearer " + account["accessToken"],
                "X-CSRF-Token": account["csrfToken"],
            }
            assert not client.get("/api/v1/auth/mfa", headers=headers).json()["data"]["enabled"]
            assert (
                client.post(
                    "/api/v1/auth/mfa/setup",
                    headers={"Authorization": headers["Authorization"]},
                    json={"password": password},
                ).status_code
                == 403
            )
            setup = client.post(
                "/api/v1/auth/mfa/setup", headers=headers, json={"password": password}
            )
            assert setup.status_code == 200, setup.text
            with psycopg.connect(database) as connection, connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE user_mfa SET setup_expires_at = now() - interval '1 minute' "
                    "WHERE user_id = %s",
                    (account["user"]["id"],),
                )
            expired = client.post(
                "/api/v1/auth/mfa/confirm",
                headers=headers,
                json={"password": password, "code": "000000"},
            )
            assert expired.status_code == 400
            assert expired.json()["error"]["code"] == "MFA_SETUP_EXPIRED"
            setup = client.post(
                "/api/v1/auth/mfa/setup", headers=headers, json={"password": password}
            )
            secret = setup.json()["data"]["secret"]
            code = MfaSecurity.code(secret, int(time.time() / 30))
            confirmation = client.post(
                "/api/v1/auth/mfa/confirm",
                headers=headers,
                json={"password": password, "code": code},
            )
            assert confirmation.status_code == 200, confirmation.text
            codes = confirmation.json()["data"]["recoveryCodes"]
            assert len(codes) == len(set(codes)) == 10
            assert client.get("/api/v1/users/me", headers=headers).status_code == 401
            with psycopg.connect(database) as connection, connection.cursor() as cursor:
                cursor.execute(
                    "SELECT secret_ciphertext, recovery_hashes FROM user_mfa WHERE user_id = %s",
                    (account["user"]["id"],),
                )
                row = cursor.fetchone()
                assert row and secret not in row[0] and not set(codes) & set(row[1])
                # Even a previously issued, unconsumed verification link must not
                # create a session for an already verified MFA account.
                cursor.execute(
                    "UPDATE auth_challenges SET consumed_at = NULL WHERE user_id = %s",
                    (account["user"]["id"],),
                )
            assert (
                client.post(
                    "/api/v1/auth/email-verifications", json={"token": mailer.verification_token}
                ).status_code
                == 400
            )
            base = {"email": email, "password": password}
            assert (
                client.post("/api/v1/auth/login", json=base).json()["error"]["code"]
                == "MFA_REQUIRED"
            )
            assert (
                client.post("/api/v1/auth/login", json={**base, "mfaCode": code}).status_code == 401
            )
            recovery = client.post("/api/v1/auth/login", json={**base, "mfaCode": codes[0]})
            assert recovery.status_code == 200, recovery.text
            assert (
                client.post("/api/v1/auth/login", json={**base, "mfaCode": codes[0]}).status_code
                == 401
            )
            session = recovery.json()["data"]
            headers = {
                "Authorization": "Bearer " + session["accessToken"],
                "X-CSRF-Token": session["csrfToken"],
            }
            status = client.get("/api/v1/auth/mfa", headers=headers)
            assert status.json()["data"]["recoveryCodesRemaining"] == 9
            with ThreadPoolExecutor(max_workers=2) as workers:
                simultaneous = list(
                    workers.map(
                        lambda _: client.post(
                            "/api/v1/auth/login", json={**base, "mfaCode": codes[1]}
                        ),
                        range(2),
                    )
                )
            assert sorted(response.status_code for response in simultaneous) == [200, 401]
            # Login rotates CSRF cookies, including when another tab signs in.
            winner = next(response for response in simultaneous if response.status_code == 200)
            session = winner.json()["data"]
            headers = {
                "Authorization": "Bearer " + session["accessToken"],
                "X-CSRF-Token": session["csrfToken"],
            }
            disabled = client.post(
                "/api/v1/auth/mfa/disable",
                headers=headers,
                json={"password": password, "code": codes[2]},
            )
            assert disabled.status_code == 200, disabled.text
            assert client.get("/api/v1/users/me", headers=headers).status_code == 401
            assert client.post("/api/v1/auth/login", json=base).status_code == 200
    finally:
        app.dependency_overrides.clear()
        with psycopg.connect(database) as connection, connection.cursor() as cursor:
            cursor.execute(
                "SELECT user_id FROM user_identities WHERE provider_subject = %s", (email,)
            )
            row = cursor.fetchone()
            if row:
                cursor.execute("DELETE FROM audit_logs WHERE entity_id = %s", (row[0],))
                cursor.execute("DELETE FROM consent_records WHERE user_id = %s", (row[0],))
                cursor.execute("DELETE FROM users WHERE id = %s", (row[0],))
