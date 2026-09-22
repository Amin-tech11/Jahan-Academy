from celery import Celery  # type: ignore[import-untyped]

from app.core.config import get_settings

settings = get_settings()
celery_app = Celery("jahan", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.workers.tasks.integration.*": {"queue": "integration"},
        "app.workers.tasks.notification.*": {"queue": "notification"},
        "app.workers.tasks.document.*": {"queue": "document"},
        "app.workers.tasks.media.*": {"queue": "media"},
    },
)
