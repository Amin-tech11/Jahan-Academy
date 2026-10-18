import asyncio
import os
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import text

from app.core.config import Settings
from app.core.database import dispose_database, session_factory
from app.modules.identity.mailer import AuthMailer, SmtpAuthMailer
from app.modules.identity.repository import AuthRepository
from app.modules.identity.security_notifications import deliver_pending
from tests.integration.test_admin_user_management_flow import _cleanup, _seed_super_admin

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="isolated PostgreSQL required"
)


async def test_notice_survives_disabled_smtp_failure_and_dispatcher_restart() -> None:
    user = _seed_super_admin()
    mailer = AsyncMock(spec=AuthMailer)
    settings = Settings(_env_file=None, environment="test")
    try:
        async with session_factory() as session:
            await AuthRepository(session).queue_security_notice(user, "auth.password.reset")
            await session.commit()
            disabled = await deliver_pending(
                session, mailer, Settings(_env_file=None, email_delivery_enabled=False)
            )
            assert disabled["status"] == "email_not_configured"
            mailer.send_security_notice.assert_not_awaited()
            mailer.send_security_notice.side_effect = RuntimeError("private recipient/token")
            result = await deliver_pending(session, mailer, settings)
            assert int(result["failed"]) >= 1
            row = (
                await session.execute(
                    text("""SELECT status, attempt_count, last_error_safe
                FROM notification_deliveries WHERE user_id = :id AND provider = 'auth-security'
            """),
                    {"id": user},
                )
            ).one()
            assert tuple(row) == ("failed", 1, "SMTP_DELIVERY_FAILED")
        # A new dispatcher/session recovers the durable record without the request process.
        mailer.send_security_notice.side_effect = None
        async with session_factory() as session:
            result = await deliver_pending(session, mailer, settings)
            assert int(result["sent"]) >= 1
            row = (
                await session.execute(
                    text("""SELECT status, attempt_count, last_error_safe
                FROM notification_deliveries WHERE user_id = :id AND provider = 'auth-security'
            """),
                    {"id": user},
                )
            ).one()
            assert tuple(row) == ("sent", 2, None)
            assert (await deliver_pending(session, mailer, settings))["sent"] == 0
    finally:
        _cleanup(user, [])
        await dispose_database()


async def test_notice_reaches_real_loopback_smtp_without_external_delivery() -> None:
    messages: list[bytes] = []

    async def smtp(reader: asyncio.StreamReader, writer: asyncio.StreamWriter) -> None:
        writer.write(b"220 synthetic SMTP ready\r\n")
        await writer.drain()
        try:
            while line := await reader.readline():
                command = line.split(b" ", 1)[0].strip().upper()
                if command in {b"EHLO", b"HELO"}:
                    writer.write(b"250-synthetic\r\n250 SIZE 100000\r\n")
                elif command == b"DATA":
                    writer.write(b"354 End with dot\r\n")
                    await writer.drain()
                    messages.append(await reader.readuntil(b"\r\n.\r\n"))
                    writer.write(b"250 accepted\r\n")
                elif command == b"QUIT":
                    writer.write(b"221 bye\r\n")
                    await writer.drain()
                    break
                else:
                    writer.write(b"250 OK\r\n")
                await writer.drain()
        finally:
            writer.close()
            await writer.wait_closed()

    user = _seed_super_admin()
    server = await asyncio.start_server(smtp, "127.0.0.1", 0)
    settings = Settings(
        _env_file=None,
        environment="test",
        smtp_host="127.0.0.1",
        smtp_port=server.sockets[0].getsockname()[1],
        smtp_timeout_seconds=3,
    )
    try:
        async with server, session_factory() as session:
            await AuthRepository(session).queue_security_notice(user, "auth.mfa.enabled")
            await session.commit()
            result = await deliver_pending(session, SmtpAuthMailer(settings), settings)
            assert int(result["sent"]) >= 1 and result["failed"] == 0
            assert any(b"Multi-factor authentication was enabled" in body for body in messages)
    finally:
        server.close()
        await server.wait_closed()
        _cleanup(user, [])
        await dispose_database()
