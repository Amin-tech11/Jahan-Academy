"""Run retention independently of optional Celery integrations; dry-run by default."""

from __future__ import annotations

import argparse
import asyncio
import json

from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import dispose_database, session_factory
from app.modules.operational.retention import RetentionRepository


async def run(*, apply: bool) -> dict[str, int | bool]:
    settings = get_settings()
    result: dict[str, int | bool] = {
        "apply": apply,
        "eligible_leads": 0,
        "anonymized_leads": 0,
        "expired_idempotency_keys": 0,
    }
    try:
        async with session_factory() as session:
            result["eligible_leads"] = int(
                await session.scalar(
                    text(
                        "SELECT count(*) FROM leads WHERE anonymized_at IS NULL "
                        "AND greatest(created_at, updated_at) < now() "
                        "- make_interval(years => :years)"
                    ),
                    {"years": settings.lead_retention_years},
                )
                or 0
            )
            if apply:
                repository = RetentionRepository(session)
                # Each bounded batch commits separately; reruns are idempotent after interruption.
                for _ in range(100):
                    count = await repository.anonymize_expired_leads(
                        years=settings.lead_retention_years, limit=settings.retention_batch_size
                    )
                    result["anonymized_leads"] += count
                    await session.commit()
                    if count < settings.retention_batch_size:
                        break
                result[
                    "expired_idempotency_keys"
                ] = await repository.remove_expired_idempotency_keys()
                await session.commit()
            return result
    finally:
        await dispose_database()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    print(json.dumps(asyncio.run(run(apply=parser.parse_args().apply))))
