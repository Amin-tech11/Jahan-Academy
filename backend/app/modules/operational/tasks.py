from __future__ import annotations

import asyncio
import json
from datetime import date, timedelta

import structlog
from redis import Redis

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import dispose_database, session_factory
from app.modules.operational.retention import RetentionRepository
from app.modules.operational.sheets_backup import backup_day, previous_day


async def enforce_retention() -> dict[str, int]:
    settings = get_settings()
    try:
        async with session_factory() as session:
            repository = RetentionRepository(session)
            anonymized = await repository.anonymize_expired_leads(
                years=settings.lead_retention_years, limit=settings.retention_batch_size
            )
            expired_keys = await repository.remove_expired_idempotency_keys()
            await session.commit()
            structlog.get_logger(__name__).info(
                "retention_enforced",
                anonymized_leads=anonymized,
                expired_idempotency_keys=expired_keys,
            )
            return {"anonymized_leads": anonymized, "expired_idempotency_keys": expired_keys}
    finally:
        await dispose_database()


@celery_app.task(name="jahan.operational.enforce_retention")  # type: ignore[untyped-decorator]
def enforce_retention_task() -> dict[str, int]:
    return asyncio.run(enforce_retention())


@celery_app.task(name="jahan.operational.dispatch_sheets_backup")  # type: ignore[untyped-decorator]
def dispatch_sheets_backup_task() -> None:
    if get_settings().sheets_backup_enabled:
        # Freeze the target day before queueing: retries after midnight keep the same day.
        recover_sheets_task.delay(previous_day())


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
    if last > date.fromisoformat(previous_day()):
        raise ValueError("Only complete Tehran days may be backed up")
    day = date(2026, 10, 7)
    processed = 0
    with Redis.from_url(settings.redis_url) as state:
        while day <= last:
            target = day.isoformat()
            key = f"sheets-backup:{settings.sheets_backup_spreadsheet_id}:{target}"
            if not state.exists(key):
                result = asyncio.run(backup_day(target))
                if result["status"] not in {"saved", "already_saved", "empty"}:
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
