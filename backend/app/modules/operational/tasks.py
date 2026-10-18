from __future__ import annotations

import asyncio
import json
from datetime import date, timedelta

import structlog
from redis import Redis

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.modules.operational.maintenance import run as maintenance_run
from app.modules.operational.sheets_backup import backup_day, scheduled_through


@celery_app.task(name="jahan.operational.deliver_security_notifications")  # type: ignore[untyped-decorator]
def deliver_security_notifications_task() -> dict[str, int | str]:
    from app.modules.identity.security_notifications import run

    return asyncio.run(run(apply=True))


async def enforce_retention() -> dict[str, int | bool | str]:
    result = await maintenance_run(apply=True)
    structlog.get_logger(__name__).info("retention_enforced", **result)
    return result


@celery_app.task(name="jahan.operational.enforce_retention")  # type: ignore[untyped-decorator]
def enforce_retention_task() -> dict[str, int | bool | str]:
    return asyncio.run(enforce_retention())


@celery_app.task(name="jahan.operational.dispatch_sheets_backup")  # type: ignore[untyped-decorator]
def dispatch_sheets_backup_task() -> None:
    if get_settings().sheets_backup_enabled:
        # Freeze the target day before queueing: retries after midnight keep the same day.
        recover_sheets_task.delay(scheduled_through())


@celery_app.task(  # type: ignore[untyped-decorator]
    name="jahan.operational.recover_sheets",
    autoretry_for=(Exception,),
    retry_backoff=60,
    retry_backoff_max=3600,
    retry_jitter=True,
    max_retries=12,
)
def recover_sheets_task(through: str) -> dict[str, int]:
    settings = get_settings()
    if not settings.sheets_backup_enabled:
        return {"processed": 0}
    last = date.fromisoformat(through)
    if last > date.fromisoformat(scheduled_through()):
        raise ValueError("Only days past their 08:00 Tehran deadline may be recovered")
    day = date(2026, 10, 7)
    processed = 0
    with Redis.from_url(settings.redis_url) as state:
        while day <= last:
            target = day.isoformat()
            key = f"sheets-backup:{settings.sheets_backup_spreadsheet_id}:{target}"
            if not state.exists(key):
                result = asyncio.run(backup_day(target))
                if result["status"] not in {"saved", "already_saved", "empty", "expired"}:
                    raise RuntimeError("Backup was not completed; do not checkpoint")
                state.set(key, json.dumps(result))
                structlog.get_logger(__name__).info("consultation_sheets_backup", **result)
                processed += 1
            day += timedelta(days=1)
    return {"processed": processed}


@celery_app.task(  # type: ignore[untyped-decorator]
    name="jahan.operational.backup_sheets",
    autoretry_for=(Exception,),
    retry_backoff=60,
    retry_backoff_max=3600,
    retry_jitter=True,
    max_retries=12,
)
def backup_sheets_task(day: str) -> dict[str, str | int]:
    result = asyncio.run(backup_day(day))
    structlog.get_logger(__name__).info("consultation_sheets_backup", **result)
    return result
