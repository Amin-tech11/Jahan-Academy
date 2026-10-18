import asyncio
import os
from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock

import pytest
from sqlalchemy import text

from app.core.config import Settings
from app.core.database import dispose_database, session_factory
from app.modules.identity.auth_mail import deliver, enqueue
from app.modules.identity.mailer import AuthMailer
from app.modules.identity.repository import AuthRepository
from app.modules.identity.security import AuthSecurity
from tests.integration.test_admin_user_management_flow import _cleanup, _seed_super_admin

pytestmark = pytest.mark.skipif(os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="isolated DB")


async def test_encrypted_recovery_survives_failure_and_restart_and_erases_delivered_token() -> None:
    user = _seed_super_admin()
    settings = Settings(_env_file=None, environment="test")
    mailer = AsyncMock(spec=AuthMailer)
    token = "synthetic-recovery-token-" + str(user)
    try:
        async with session_factory() as session:
            repo = AuthRepository(session)
            account = await repo.get_account_by_user_id(user)
            assert account is not None
            await repo.create_password_reset(
                account.identity.id,
                AuthSecurity.token_hash(token),
                datetime.now(UTC) + timedelta(minutes=15),
            )
            await enqueue(session, settings, account.identity.id, "reset", token)
            await session.commit()
            ciphertext = await session.scalar(
                text("SELECT ciphertext FROM auth_mail_outbox WHERE token_hash=:h"),
                {"h": AuthSecurity.token_hash(token)},
            )
            assert token not in ciphertext
            mailer.send_password_reset.side_effect = RuntimeError("secret must not be recorded")
            assert (await deliver(session, mailer, settings))["failed"] == 1
            assert (await deliver(session, mailer, settings))["failed"] == 0  # backoff
        async with session_factory() as session:
            await session.execute(text("UPDATE auth_mail_outbox SET next_attempt_at=now()"))
            await session.commit()
            mailer.send_password_reset.side_effect = None
            assert (await deliver(session, mailer, settings))["sent"] == 1
            assert mailer.send_password_reset.await_args.args[1] == token
            assert await session.scalar(text("SELECT count(*) FROM auth_mail_outbox")) == 0
            assert (await deliver(session, mailer, settings))["sent"] == 0
    finally:
        _cleanup(user, [])
        await dispose_database()


@pytest.mark.parametrize("invalid", ["expired", "used", "replaced"])
async def test_invalid_recovery_is_erased_without_delivery(invalid: str) -> None:
    user = _seed_super_admin()
    settings = Settings(_env_file=None, environment="test")
    mailer = AsyncMock(spec=AuthMailer)
    try:
        async with session_factory() as session:
            repo = AuthRepository(session)
            account = await repo.get_account_by_user_id(user)
            assert account is not None
            token = str(user)
            await repo.create_password_reset(
                account.identity.id,
                AuthSecurity.token_hash(token),
                datetime.now(UTC) + timedelta(minutes=15),
            )
            await enqueue(session, settings, account.identity.id, "reset", token)
            await session.commit()
            if invalid == "expired":
                await session.execute(
                    text("UPDATE auth_mail_outbox SET expires_at=now()-interval '1 second'")
                )
            else:
                await session.execute(
                    text("UPDATE password_reset_tokens SET used_at=now() WHERE identity_id=:id"),
                    {"id": account.identity.id},
                )
                if invalid == "replaced":
                    await repo.create_password_reset(
                        account.identity.id,
                        "replacement-hash",
                        datetime.now(UTC) + timedelta(minutes=15),
                    )
            await session.commit()
            assert (await deliver(session, mailer, settings))["sent"] == 0
            mailer.send_password_reset.assert_not_awaited()
            assert await session.scalar(text("SELECT count(*) FROM auth_mail_outbox")) == 0
    finally:
        _cleanup(user, [])
        await dispose_database()


async def test_outbox_rolls_back_atomically_and_concurrent_workers_do_not_double_send() -> None:
    user = _seed_super_admin()
    settings = Settings(_env_file=None, environment="test")
    mailer = AsyncMock(spec=AuthMailer)

    async def slow_send(*args: object) -> None:
        await asyncio.sleep(0.05)

    mailer.send_password_reset.side_effect = slow_send
    try:
        async with session_factory() as session:
            repo = AuthRepository(session)
            account = await repo.get_account_by_user_id(user)
            assert account is not None
            identity = account.identity.id
            await enqueue(session, settings, identity, "reset", "rolled-back-token")
            await session.rollback()
            assert await session.scalar(text("SELECT count(*) FROM auth_mail_outbox")) == 0
            await repo.create_password_reset(
                identity,
                AuthSecurity.token_hash("parallel-token"),
                datetime.now(UTC) + timedelta(minutes=15),
            )
            await enqueue(session, settings, identity, "reset", "parallel-token")
            await session.commit()

        async def worker() -> dict[str, int]:
            async with session_factory() as session:
                return await deliver(session, mailer, settings)

        results = await asyncio.gather(worker(), worker())
        assert sum(result["sent"] for result in results) == 1
        mailer.send_password_reset.assert_awaited_once()
    finally:
        _cleanup(user, [])
        await dispose_database()
