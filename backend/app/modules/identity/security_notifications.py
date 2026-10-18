"""Durable security email queue using existing notification tables. Never log recipients."""

import argparse
import asyncio
import json

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import dispose_database, session_factory
from app.modules.identity.mailer import AuthMailer, SmtpAuthMailer

NOTICES = {
    "auth.password.reset": "Your password was reset. All earlier sessions have been revoked.",
    "auth.account.locked": "Your account was temporarily locked after repeated failed attempts.",
    "auth.mfa.enabled": "Multi-factor authentication was enabled for your account.",
    "auth.mfa.disabled": "Multi-factor authentication was disabled for your account.",
}


def notice(event: str) -> tuple[str, str]:
    return "Jahan Academy security notification", NOTICES[event] + (
        " If you did not request this action, contact Jahan Academy support immediately."
        " Never share your password or recovery codes."
    )


async def deliver_pending(
    session: AsyncSession, mailer: AuthMailer, settings: Settings
) -> dict[str, int | str]:
    if not settings.email_delivery_enabled:
        return {"status": "email_not_configured", "sent": 0, "failed": 0}
    rows = (
        (
            await session.execute(
                text("""SELECT d.id, n.event_code, i.provider_subject AS email
                FROM notification_deliveries d
                JOIN notifications n ON n.id = d.notification_id
                JOIN user_identities i ON i.user_id = d.user_id AND i.provider = 'email'
                JOIN users u ON u.id = d.user_id
                WHERE d.provider = 'auth-security' AND d.channel = 'email'
                  AND d.status IN ('pending', 'failed') AND d.attempt_count < 12
                  AND i.verified_at IS NOT NULL AND u.deleted_at IS NULL
                ORDER BY d.created_at LIMIT 100 FOR UPDATE OF d SKIP LOCKED""")
            )
        )
        .mappings()
        .all()
    )
    sent, failed = 0, 0
    for row in rows:
        try:
            subject, body = notice(row["event_code"])
            await mailer.send_security_notice(row["email"], subject, body)
        except Exception:
            failed += 1
            await session.execute(
                text("""UPDATE notification_deliveries SET status = 'failed',
                    attempt_count = attempt_count + 1, last_error_safe = 'SMTP_DELIVERY_FAILED'
                    WHERE id = :id"""),
                {"id": row["id"]},
            )
        else:
            sent += 1
            await session.execute(
                text("""UPDATE notification_deliveries SET status = 'sent', sent_at = now(),
                    attempt_count = attempt_count + 1, last_error_safe = NULL WHERE id = :id"""),
                {"id": row["id"]},
            )
    await session.commit()
    exhausted = int(
        await session.scalar(
            text("""SELECT count(*) FROM notification_deliveries
            WHERE provider = 'auth-security' AND status = 'failed' AND attempt_count >= 12""")
        )
        or 0
    )
    return {"status": "processed", "sent": sent, "failed": failed, "exhausted": exhausted}


async def run(*, apply: bool) -> dict[str, int | str]:
    try:
        async with session_factory() as session:
            if not apply:
                count = await session.scalar(
                    text("""SELECT count(*) FROM notification_deliveries
                    WHERE provider = 'auth-security' AND status IN ('pending','failed')""")
                )
                return {"status": "dry_run", "pending": int(count or 0)}
            settings = get_settings()
            return await deliver_pending(session, SmtpAuthMailer(settings), settings)
    finally:
        await dispose_database()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    result = asyncio.run(run(apply=parser.parse_args().apply))
    print(json.dumps(result))
    if int(result.get("failed", 0)) or int(result.get("exhausted", 0)):
        raise SystemExit(1)
