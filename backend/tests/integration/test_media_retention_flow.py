import asyncio
import os
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock
from uuid import UUID, uuid4

import pytest
from pydantic import SecretStr
from sqlalchemy import text

from app.core.config import Settings
from app.core.database import dispose_database, session_factory
from app.modules.media.cleanup import cleanup_uploads
from app.modules.media.repository import MediaRepository
from app.modules.media.storage import S3MediaStorage, StorageError
from app.shared.exceptions import ApplicationError
from tests.integration.test_media_management_flow import _cleanup, _create_actor

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1", reason="isolated DB required"
)


def intent(owner: UUID, bucket: str = "synthetic-quarantine") -> dict[str, Any]:
    return {
        "owner_user_id": owner,
        "bucket": bucket,
        "object_key": f"media/{uuid4()}.pdf",
        "original_filename": "guide.pdf",
        "mime_type": "application/pdf",
        "size_bytes": 600,
        "purpose": "public_file",
        "upload_expires_at": datetime.now(UTC) + timedelta(minutes=5),
        "alt_fa": None,
        "alt_en": None,
        "source_url": None,
        "attribution": None,
    }


@pytest.mark.parametrize("limit", ["user_pending", "total_pending", "user_bytes", "total_bytes"])
async def test_quota_reservations_are_atomic_across_concurrent_sessions(limit: str) -> None:
    owners = [_create_actor(), _create_actor()]
    assets: list[UUID] = []
    overrides: dict[str, Any] = {
        "user_pending": {"media_user_pending_limit": 1},
        "total_pending": {"media_total_pending_limit": 1},
        "user_bytes": {"media_user_quota_bytes": 2048},
        "total_bytes": {"media_total_quota_bytes": 2048},
    }[limit]
    settings = Settings(_env_file=None, **overrides)

    async def reserve(owner: UUID) -> None:
        async with session_factory() as session:
            repo = MediaRepository(session)
            await repo.reserve_quota(owner, 600, settings)
            row = await repo.create_intent(intent(owner))
            assets.append(row["id"])
            await session.commit()

    try:
        results = await asyncio.gather(
            reserve(owners[0]),
            reserve(owners[0] if limit.startswith("user") else owners[1]),
            return_exceptions=True,
        )
        assert sum(r is None for r in results) == 1, repr(results)
        errors = [r for r in results if isinstance(r, ApplicationError)]
        assert len(errors) == 1 and errors[0].code == "MEDIA_QUOTA_EXCEEDED"
    finally:
        _cleanup(owners[0], assets)
        _cleanup(owners[1], [])
        await dispose_database()


@pytest.mark.skipif(not os.getenv("JAHAN_STORAGE_POLICY_TEST_URL"), reason="real MinIO required")
async def test_cleanup_waits_out_replay_retries_errors_and_preserves_ready_public_objects() -> None:
    owner = _create_actor()
    suffix = uuid4().hex
    settings = Settings(
        _env_file=None,
        storage_endpoint_url=os.environ["JAHAN_STORAGE_POLICY_TEST_URL"],
        storage_public_endpoint_url=os.environ["JAHAN_STORAGE_POLICY_TEST_URL"],
        storage_access_key=SecretStr("synthetic-local-user"),
        storage_secret_key=SecretStr("synthetic-local-password-only"),
        media_quarantine_bucket="quarantine-" + suffix,
        media_public_bucket="public-" + suffix,
    )
    storage = S3MediaStorage(settings)
    assets: list[UUID] = []
    for bucket in [settings.media_quarantine_bucket, settings.media_public_bucket]:
        storage._internal.create_bucket(Bucket=bucket)
    try:
        async with session_factory() as session:
            repo = MediaRepository(session)
            rows = [
                await repo.create_intent(intent(owner, settings.media_quarantine_bucket))
                for _ in range(3)
            ]
            assets.extend(r["id"] for r in rows)
            for row in rows:
                storage._internal.put_object(
                    Bucket=settings.media_quarantine_bucket,
                    Key=row["object_key"],
                    Body=b"synthetic",
                )
            public_key = f"public/{rows[0]['id']}/{rows[0]['object_key'].split('/')[-1]}"
            await repo.mark_ready(
                rows[0]["id"],
                bucket=settings.media_public_bucket,
                object_key=public_key,
                checksum="a" * 64,
                width=None,
                height=None,
                scan_status="clean",
            )
            storage._internal.put_object(
                Bucket=settings.media_public_bucket, Key=public_key, Body=b"safe"
            )
            await repo.mark_rejected(rows[1]["id"], "SYNTHETIC_REJECTION")
            await session.commit()
            assert await cleanup_uploads(session, storage, settings) == 0
            # Simulate the time after all presigns and the safety grace have expired.
            await session.execute(
                text(
                    "UPDATE media_assets SET quarantine_cleanup_after = now() "
                    "- interval '1 second' WHERE id = ANY(:ids)"
                ),
                {"ids": assets},
            )
            await session.commit()
            original_delete = storage.delete
            storage.delete = AsyncMock(side_effect=StorageError("synthetic outage"))  # type: ignore[method-assign]
            with pytest.raises(StorageError):
                await cleanup_uploads(session, storage, settings)
            await session.rollback()
            assert (
                await session.scalar(
                    text(
                        "SELECT count(*) FROM media_assets WHERE id = ANY(:ids) "
                        "AND quarantine_cleaned_at IS NULL"
                    ),
                    {"ids": assets},
                )
                == 3
            )
            storage.delete = original_delete  # type: ignore[method-assign]
            assert await cleanup_uploads(session, storage, settings) == 3
            await session.commit()
            assert await cleanup_uploads(session, storage, settings) == 0
            assert (await storage.head(settings.media_public_bucket, public_key)).size_bytes == 4
            assert (
                storage._internal.list_objects_v2(Bucket=settings.media_quarantine_bucket).get(
                    "KeyCount", 0
                )
                == 0
            )
            await session.commit()
    finally:
        _cleanup(owner, assets)
        for bucket in [settings.media_quarantine_bucket, settings.media_public_bucket]:
            for obj in storage._internal.list_objects_v2(Bucket=bucket).get("Contents", []):
                storage._internal.delete_object(Bucket=bucket, Key=obj["Key"])
            storage._internal.delete_bucket(Bucket=bucket)
        await dispose_database()
