from __future__ import annotations

import asyncio

import structlog

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
        backup_sheets_task.delay(previous_day())


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
