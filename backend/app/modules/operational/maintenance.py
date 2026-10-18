"""Run retention independently of optional Celery integrations; dry-run by default."""

from __future__ import annotations

import argparse
import asyncio
import json

from sqlalchemy import text

from app.core.config import get_settings
from app.core.database import dispose_database, session_factory
from app.modules.media.cleanup import cleanup_uploads
from app.modules.media.storage import S3MediaStorage
from app.modules.operational.retention import EXPIRED_LEAD_PREDICATE, RetentionRepository
from app.modules.operational.sheets_retention import cleanup_sheets


async def run(*, apply: bool) -> dict[str, int | bool | str]:
    settings = get_settings()
    result: dict[str, int | bool | str] = {
        "apply": apply,
        "eligible_leads": 0,
        "anonymized_leads": 0,
        "expired_idempotency_keys": 0,
    }
    try:
        async with session_factory() as session:
            result["eligible_leads"] = int(
                await session.scalar(
                    # The only inserted fragment is a fixed source constant; years is bound.
                    text(f"SELECT count(*) FROM leads l WHERE {EXPIRED_LEAD_PREDICATE}"),  # nosec B608
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
                    result["anonymized_leads"] = int(result["anonymized_leads"]) + count
                    await session.commit()
                    if count < settings.retention_batch_size:
                        break
                result[
                    "expired_idempotency_keys"
                ] = await repository.remove_expired_idempotency_keys()
                await session.commit()
                # Independent transactions: neither remote system may starve the other.
                failures: list[Exception] = []
                try:
                    result["media_cleaned"] = await cleanup_uploads(
                        session, S3MediaStorage(settings), settings
                    )
                    await session.commit()
                except Exception as error:
                    await session.rollback()
                    failures.append(error)
                try:
                    sheets = await cleanup_sheets(session, settings)
                    await session.commit()
                except Exception as error:
                    await session.rollback()
                    failures.append(error)
                    sheets = {"status": "failed"}
                result["sheets_status"] = str(sheets["status"])
                result["sheets_removed_rows"] = int(sheets.get("removed_rows", 0))
                result["sheets_expired_tabs"] = int(sheets.get("expired_tabs", 0))
                if failures:
                    raise ExceptionGroup("Independent retention jobs failed", failures)
            return result
    finally:
        await dispose_database()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    print(json.dumps(asyncio.run(run(apply=parser.parse_args().apply))))
