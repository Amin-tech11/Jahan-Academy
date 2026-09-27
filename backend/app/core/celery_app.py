from celery import Celery  # type: ignore[import-untyped]

from app.core.config import get_settings

settings = get_settings()
celery_app = Celery("jahan-academy", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        "dispatch-noura-outbox": {
            "task": "jahan.integrations.dispatch_noura_outbox",
            "schedule": 10.0,
        },
        "enforce-data-retention": {
            "task": "jahan.operational.enforce_retention",
            "schedule": 86400.0,
        },
    },
    imports=("app.modules.integrations.tasks", "app.modules.operational.tasks"),
)
