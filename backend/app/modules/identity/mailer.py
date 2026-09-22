from __future__ import annotations

from email.message import EmailMessage
from typing import Protocol

import aiosmtplib

from app.core.config import Settings


class AuthMailer(Protocol):
    async def send_email_verification(self, email: str, token: str) -> None: ...

    async def send_password_reset(self, email: str, token: str) -> None: ...


class SmtpAuthMailer:
    def __init__(self, settings: Settings) -> None:
        self._settings = settings

    async def send_email_verification(self, email: str, token: str) -> None:
        url = f"{self._settings.frontend_url}/verify-email?token={token}"
        await self._send(email, "Verify your Jahan Academy email", f"Verify your email: {url}")

    async def send_password_reset(self, email: str, token: str) -> None:
        url = f"{self._settings.frontend_url}/reset-password?token={token}"
        await self._send(email, "Reset your Jahan Academy password", f"Reset password: {url}")

    async def _send(self, recipient: str, subject: str, body: str) -> None:
        message = EmailMessage()
        message["From"] = self._settings.email_from
        message["To"] = recipient
        message["Subject"] = subject
        message.set_content(body)
        await aiosmtplib.send(
            message,
            hostname=self._settings.smtp_host,
            port=self._settings.smtp_port,
            username=self._settings.smtp_username,
            password=(
                self._settings.smtp_password.get_secret_value()
                if self._settings.smtp_password
                else None
            ),
            start_tls=self._settings.smtp_start_tls,
        )
