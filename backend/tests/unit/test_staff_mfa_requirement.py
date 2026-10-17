from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import cast
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from fastapi import Request
from fastapi.security import HTTPAuthorizationCredentials

from app.core.config import Settings
from app.modules.identity.abuse import AuthAbuseControl
from app.modules.identity.dependencies import current_user
from app.modules.identity.repository import AccountRecord, AuthRepository
from app.modules.identity.schemas import LoginRequest
from app.modules.identity.security import AuthSecurity
from app.modules.identity.service import AuthService
from app.shared.exceptions import ApplicationError


@pytest.fixture
def auth() -> tuple[AuthService, Mock, AccountRecord]:
    settings = Settings(_env_file=None, environment="test")
    security = AuthSecurity(settings)
    account = cast(
        AccountRecord,
        SimpleNamespace(
            user=SimpleNamespace(
                id=uuid4(), status="active", locked_until=None, preferred_locale="fa"
            ),
            identity=SimpleNamespace(
                password_hash=security.hash_password("Synthetic-Password-2026"),
                verified_at=datetime.now(UTC),
                provider_subject="staff@example.com",
            ),
            profile=SimpleNamespace(first_name="Test", last_name="Staff"),
        ),
    )
    repository = Mock(spec=AuthRepository)
    repository.session = AsyncMock()
    repository.get_account_by_email.return_value = account
    repository.get_staff_account_by_username.return_value = account
    repository.get_account_by_user_id.return_value = account
    repository.get_active_session.return_value = SimpleNamespace(
        user=account.user,
        session=SimpleNamespace(
            family_id=uuid4(),
            last_seen_at=datetime.now(UTC),
            expires_at=datetime.now(UTC) + timedelta(hours=8),
        ),
    )
    repository.session_family_started_at.return_value = datetime.now(UTC)
    repository.create_session.return_value = SimpleNamespace(id=uuid4())
    repository.requires_staff_mfa.return_value = True
    repository.mfa_record.return_value = None
    abuse = AsyncMock(spec=AuthAbuseControl)
    abuse.register_failure.return_value = (1, 0)
    return AuthService(repository, security, Mock(), settings, abuse), repository, account


@pytest.mark.parametrize("identifier", [{"username": "staff"}, {"email": "staff@example.com"}])
async def test_password_only_staff_login_is_enrollment_only(
    auth: tuple[AuthService, Mock, AccountRecord], identifier: dict[str, str]
) -> None:
    service, _, _ = auth
    issued = await service.login(
        LoginRequest(**identifier, password="Synthetic-Password-2026"), None, None
    )
    assert issued.view.mfa_enrollment_required
    with pytest.raises(ApplicationError) as error:
        await service.authenticate(issued.view.access_token)
    assert error.value.code == "MFA_ENROLLMENT_REQUIRED"
    assert error.value.status_code == 403
    await service.authenticate(issued.view.access_token, allow_mfa_enrollment=True)


async def test_old_staff_session_cannot_bypass_enrollment(
    auth: tuple[AuthService, Mock, AccountRecord],
) -> None:
    service, _, account = auth
    token, _ = service._security.create_access_token(account.user.id, uuid4())
    with pytest.raises(ApplicationError) as error:
        await service.authenticate(token)
    assert error.value.code == "MFA_ENROLLMENT_REQUIRED"


async def test_refresh_cannot_upgrade_an_unenrolled_staff_session(
    auth: tuple[AuthService, Mock, AccountRecord],
) -> None:
    service, repository, account = auth
    repository.get_refresh_session_for_update.return_value = SimpleNamespace(
        user=account.user,
        session=SimpleNamespace(
            revoked_at=None,
            expires_at=datetime.now(UTC) + timedelta(days=1),
            family_id=uuid4(),
            id=uuid4(),
            last_seen_at=datetime.now(UTC),
        ),
    )
    issued = await service.refresh("synthetic-refresh", None, None)
    assert issued.view.mfa_enrollment_required
    with pytest.raises(ApplicationError):
        await service.authenticate(issued.view.access_token)


@pytest.mark.parametrize("code", [None, "invalid-code", "synthetic-recovery"])
async def test_enrolled_staff_must_supply_valid_mfa(
    auth: tuple[AuthService, Mock, AccountRecord],
    code: str | None,
) -> None:
    service, repository, _ = auth
    from app.modules.identity.mfa import MfaSecurity

    mfa = MfaSecurity(service._settings)
    repository.mfa_record.return_value = {
        "enabled": True,
        "secret_ciphertext": mfa.encrypt(mfa.new_secret()),
        "last_counter": -1,
        "recovery_hashes": [service._security.token_hash("synthetic-recovery")],
    }
    request = LoginRequest(
        email="staff@example.com", password="Synthetic-Password-2026", mfa_code=code
    )
    if code != "synthetic-recovery":
        with pytest.raises(ApplicationError) as error:
            await service.login(request, None, None)
        assert error.value.code == ("MFA_REQUIRED" if code is None else "MFA_INVALID")
        repository.create_session.assert_not_awaited()
    else:
        issued = await service.login(request, None, None)
        assert not issued.view.mfa_enrollment_required
        repository.update_mfa_proof.assert_awaited_once()
        await service.authenticate(issued.view.access_token)


async def test_staff_cannot_disable_required_mfa(
    auth: tuple[AuthService, Mock, AccountRecord],
) -> None:
    service, repository, _ = auth
    with pytest.raises(ApplicationError) as error:
        await service.mfa_disable("staff@example.com", "Synthetic-Password-2026", "123456")
    assert error.value.code == "MFA_REQUIRED_FOR_STAFF"
    repository.delete_mfa.assert_not_awaited()


async def test_regular_users_keep_optional_mfa(
    auth: tuple[AuthService, Mock, AccountRecord],
) -> None:
    service, repository, _ = auth
    repository.requires_staff_mfa.return_value = False
    issued = await service.login(
        LoginRequest(email="staff@example.com", password="Synthetic-Password-2026"), None, None
    )
    assert not issued.view.mfa_enrollment_required
    await service.authenticate(issued.view.access_token)


@pytest.mark.parametrize(
    "path,allowed",
    [
        ("/api/v1/auth/mfa", True),
        ("/api/v1/auth/mfa/setup", True),
        ("/api/v1/auth/mfa/confirm", True),
        ("/api/v1/auth/logout", True),
        ("/api/v1/users/me", False),
        ("/api/v1/users/me/panel-access", False),
        ("/api/v1/auth/mfa/disable", False),
        ("/api/v1/admin/staff", False),
    ],
)
async def test_enrollment_exception_is_limited_to_exact_endpoints(path: str, allowed: bool) -> None:
    service = Mock(spec=AuthService)
    service.authenticate.return_value = (Mock(), Mock())
    request = Request({"type": "http", "method": "POST", "path": path, "headers": []})
    await current_user(
        request, HTTPAuthorizationCredentials(scheme="Bearer", credentials="synthetic"), service
    )
    service.authenticate.assert_awaited_once_with("synthetic", allow_mfa_enrollment=allowed)
