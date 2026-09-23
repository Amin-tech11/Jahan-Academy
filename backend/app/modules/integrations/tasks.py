from __future__ import annotations

import asyncio

from app.core.celery_app import celery_app
from app.core.config import get_settings
from app.core.database import dispose_database, session_factory
from app.modules.integrations.adapter import HttpNouraLeadAdapter
from app.modules.integrations.repository import NouraRepository
from app.modules.integrations.service import NouraSyncService


async def dispatch_noura_outbox() -> dict[str, int]:
    settings = get_settings()
    try:
        async with session_factory() as session:
            service = NouraSyncService(
                NouraRepository(session),
                HttpNouraLeadAdapter(
                    base_url=settings.noura_base_url,
                    timeout_seconds=settings.noura_timeout_seconds,
                    mock_outcome=settings.noura_mock_outcome,
                ),
            )
            return await service.process_due(
                limit=settings.noura_dispatch_batch_size,
                lock_timeout_seconds=settings.noura_lock_timeout_seconds,
            )
    finally:
        await dispose_database()


@celery_app.task(name="jahan.integrations.dispatch_noura_outbox")  # type: ignore[untyped-decorator]
def dispatch_noura_outbox_task() -> dict[str, int]:
    return asyncio.run(dispatch_noura_outbox())
