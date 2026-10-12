"""Dedicated backup queue and scheduler; no other operational jobs are dispatched."""

from typing import Any

from celery.schedules import crontab  # type: ignore[import-untyped]
from celery.signals import worker_ready  # type: ignore[import-untyped]

from app.core.celery_app import celery_app
from app.core.config import get_settings

celery_app.conf.update(
    task_default_queue="sheets-backup",
    beat_schedule={
        "recover-consultation-sheets": {
            "task": "jahan.operational.dispatch_sheets_backup",
            "schedule": crontab(hour="*/4", minute=0, app=celery_app),
        }
    },
)


@worker_ready.connect  # type: ignore[untyped-decorator]
def recover_on_startup(**kwargs: Any) -> None:
    if get_settings().sheets_backup_enabled:
        from app.modules.operational.tasks import dispatch_sheets_backup_task

        dispatch_sheets_backup_task()
