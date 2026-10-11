from unittest.mock import AsyncMock, patch

import pytest

from app.core.config import Settings
from app.modules.identity.mailer import SmtpAuthMailer
from app.modules.identity.security import AuthSecurity
from app.modules.identity.service import AuthService
from app.shared.exceptions import ApplicationError


async def test_email_links_use_fragments_and_bounded_tls_delivery() -> None:
    settings = Settings(smtp_start_tls=True, smtp_timeout_seconds=7)
    with patch("app.modules.identity.mailer.aiosmtplib.send", new_callable=AsyncMock) as send:
        await SmtpAuthMailer(settings).send_password_reset("test@example.com", "t" * 40)
        message = send.call_args.args[0]
        assert "/reset-password#token=" in message.get_content()
        assert "?token=" not in message.get_content()
        assert send.call_args.kwargs["timeout"] == 7
        assert send.call_args.kwargs["start_tls"]
        await SmtpAuthMailer(settings).send_email_verification("test@example.com", "t" * 40)
        assert "/verify-email#token=" in send.call_args.args[0].get_content()


async def test_unavailable_delivery_is_explicit_and_does_not_lookup_accounts() -> None:
    settings = Settings(email_delivery_enabled=False)
    repository = AsyncMock()
    service = AuthService(repository, AuthSecurity(settings), AsyncMock(), settings)
    for email in ("exists@example.com", "missing@example.com"):
        with pytest.raises(ApplicationError) as failure:
            await service.request_password_reset(email)
        assert failure.value.status_code == 503
    repository.get_account_by_email.assert_not_called()
