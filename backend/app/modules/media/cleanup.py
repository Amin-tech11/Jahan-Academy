"""Replay-safe, bounded quarantine cleanup. Never remove a ready public object."""

import argparse
import asyncio
import json
from pathlib import PurePosixPath

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings, get_settings
from app.core.database import dispose_database, session_factory
from app.modules.media.storage import MediaStorage, S3MediaStorage


async def cleanup_uploads(session: AsyncSession, storage: MediaStorage, settings: Settings) -> int:
    rows = (
        (
            await session.execute(
                text("""
        SELECT * FROM media_assets WHERE quarantine_cleaned_at IS NULL
          AND quarantine_key IS NOT NULL AND quarantine_cleanup_after <= now()
        ORDER BY quarantine_cleanup_after LIMIT :limit FOR UPDATE SKIP LOCKED
    """),
                {"limit": settings.retention_batch_size},
            )
        )
        .mappings()
        .all()
    )
    for row in rows:
        await storage.delete(settings.media_quarantine_bucket, row["quarantine_key"])
        if row["upload_status"] != "ready":
            # Also remove a promotion that succeeded before its database transaction failed.
            target = f"public/{row['id']}/{PurePosixPath(row['quarantine_key']).name}"
            await storage.delete(settings.media_public_bucket, target)
        await session.execute(
            text("""
            UPDATE media_assets SET quarantine_cleaned_at = now(),
              upload_status = CASE WHEN upload_status = 'ready' THEN 'ready' ELSE 'rejected' END,
              validation_error_code = CASE WHEN upload_status = 'ready' THEN validation_error_code
                  ELSE coalesce(validation_error_code, 'MEDIA_UPLOAD_EXPIRED') END,
              updated_at = now(), row_version = row_version + 1 WHERE id = :id
        """),
            {"id": row["id"]},
        )
    return len(rows)


async def run(*, apply: bool) -> dict[str, int | bool]:
    settings = get_settings()
    result: dict[str, int | bool] = {"apply": apply, "cleaned": 0}
    try:
        async with session_factory() as session:
            result["eligible"] = int(
                await session.scalar(
                    text("""
                SELECT count(*) FROM media_assets WHERE quarantine_cleaned_at IS NULL
                  AND quarantine_key IS NOT NULL AND quarantine_cleanup_after <= now()
            """)
                )
                or 0
            )
            if apply:
                storage = S3MediaStorage(settings)
                for _ in range(100):
                    count = await cleanup_uploads(session, storage, settings)
                    await session.commit()
                    result["cleaned"] = int(result["cleaned"]) + count
                    if count < settings.retention_batch_size:
                        break
        return result
    finally:
        await dispose_database()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    print(json.dumps(asyncio.run(run(apply=parser.parse_args().apply))))
