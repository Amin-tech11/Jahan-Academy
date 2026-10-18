from types import SimpleNamespace
from typing import cast
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from app.core.config import Settings
from app.modules.identity.abuse import AuthAbuseControl
from app.modules.identity.repository import AccountRecord, AuthRepository
from app.modules.identity.security import AuthSecurity
from app.modules.identity.service import AuthService


@pytest.mark.parametrize("locked", [False, True])
async def test_failures_audit_without_credentials_and_lockout_enqueues_notice(locked: bool) -> None:
    repo = Mock(spec=AuthRepository)
    repo.session = AsyncMock()
    abuse = AsyncMock(spec=AuthAbuseControl)
    abuse.register_failure.return_value = (5 if locked else 1, 900 if locked else 0)
    settings = Settings(_env_file=None)
    service = AuthService(
        repo,
        AuthSecurity(settings),
        Mock(),
        settings,
        abuse,
        ip_address="192.0.2.2",
        user_agent="synthetic-agent",
    )
    user = SimpleNamespace(id=uuid4())
    account = cast(AccountRecord, SimpleNamespace(user=user))
    await service._record_mfa_failure(account, "auth.login.failed")
    first = repo.audit_security_event.await_args_list[0].args
    assert first[:2] == (user.id, "auth.login.failed")
    assert first[2] != "192.0.2.2" and len(first[2]) == 64
    assert first[3] == "synthetic-agent"
    if locked:
        repo.queue_security_notice.assert_awaited_once_with(user.id, "auth.account.locked")
        assert repo.audit_security_event.await_count == 2
    else:
        repo.queue_security_notice.assert_not_awaited()
    repo.session.commit.assert_awaited_once()
