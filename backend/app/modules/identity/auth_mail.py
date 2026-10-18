"""Private, encrypted, expiring outbox. Successful delivery erases the token copy."""

import base64
import hmac
from datetime import UTC, datetime, timedelta
from uuid import UUID

from cryptography.fernet import Fernet
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.modules.identity.mailer import AuthMailer
from app.modules.identity.security import AuthSecurity


def cipher(settings: Settings) -> Fernet:
    secret = settings.mfa_encryption_key or settings.session_secret
    key = hmac.digest(secret.get_secret_value().encode(), b"jahan-auth-mail-v1", "sha256")
    return Fernet(base64.urlsafe_b64encode(key))


async def enqueue(
    session: AsyncSession, settings: Settings, identity_id: UUID, kind: str, token: str
) -> None:
    ttl = (
        timedelta(minutes=settings.password_reset_minutes)
        if kind == "reset"
        else timedelta(hours=settings.email_verification_hours)
    )
    # Replacement tokens erase earlier queued secrets in the same transaction.
    await session.execute(
        text("DELETE FROM auth_mail_outbox WHERE identity_id=:id AND kind=:kind"),
        {"id": identity_id, "kind": kind},
    )
    await session.execute(
        text("""INSERT INTO auth_mail_outbox
        (identity_id,kind,token_hash,ciphertext,expires_at)
        VALUES (:id,:kind,:hash,:cipher,:expires)"""),
        {
            "id": identity_id,
            "kind": kind,
            "hash": AuthSecurity.token_hash(token),
            "cipher": cipher(settings).encrypt(token.encode()).decode(),
            "expires": datetime.now(UTC) + ttl,
        },
    )


async def deliver(
    session: AsyncSession, mailer: AuthMailer, settings: Settings, token_hash: str | None = None
) -> dict[str, int]:
    # Remove superseded/used/expired tokens even if SMTP is disabled.
    await session.execute(
        text("""DELETE FROM auth_mail_outbox o WHERE expires_at <= now()
      OR NOT EXISTS (SELECT 1 FROM user_identities i JOIN users u ON u.id=i.user_id
                     WHERE i.id=o.identity_id AND u.deleted_at IS NULL)
      OR (kind='reset' AND NOT EXISTS (SELECT 1 FROM password_reset_tokens t
          WHERE t.identity_id=o.identity_id AND t.token_hash=o.token_hash
            AND t.used_at IS NULL AND t.expires_at>now()))
      OR (kind='verify' AND NOT EXISTS (SELECT 1 FROM auth_challenges t
          WHERE t.identity_id=o.identity_id AND t.secret_hash=o.token_hash
            AND t.consumed_at IS NULL AND t.expires_at>now()))""")
    )
    result = {"sent": 0, "failed": 0}
    if settings.email_delivery_enabled:
        rows = (
            (
                await session.execute(
                    text("""SELECT o.*, i.provider_subject AS email
            FROM auth_mail_outbox o JOIN user_identities i ON i.id=o.identity_id
            WHERE o.next_attempt_at<=now() AND (CAST(:hash AS text) IS NULL OR o.token_hash=:hash)
            ORDER BY o.next_attempt_at LIMIT 20 FOR UPDATE OF o SKIP LOCKED"""),
                    {"hash": token_hash},
                )
            )
            .mappings()
            .all()
        )
        for row in rows:
            try:
                token = cipher(settings).decrypt(row["ciphertext"].encode()).decode()
                if row["kind"] == "reset":
                    await mailer.send_password_reset(row["email"], token)
                else:
                    await mailer.send_email_verification(row["email"], token)
            except Exception:
                result["failed"] += 1
                await session.execute(
                    text("""UPDATE auth_mail_outbox
                    SET attempt_count=attempt_count+1, next_attempt_at=now()+interval '1 minute'
                    WHERE id=:id"""),
                    {"id": row["id"]},
                )
            else:
                result["sent"] += 1
                await session.execute(
                    text("DELETE FROM auth_mail_outbox WHERE id=:id"), {"id": row["id"]}
                )
    await session.commit()
    return result
