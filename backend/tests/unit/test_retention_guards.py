from datetime import UTC, datetime, timedelta
from unittest.mock import AsyncMock, Mock, patch

import pytest

from app.core.config import Settings
from app.modules.media.storage import S3MediaStorage, StorageError
from app.modules.operational.sheets_backup import backup_day, prepare_day


async def test_expired_snapshot_cannot_be_recreated_or_prepared() -> None:
    with (
        patch(
            "app.modules.operational.sheets_backup.get_settings",
            return_value=Settings(_env_file=None, sheets_backup_enabled=True),
        ),
        patch("app.modules.operational.sheets_backup.session_factory", AsyncMock()) as sessions,
    ):
        assert (await backup_day("2000-01-01"))["status"] == "expired"
        with pytest.raises(ValueError, match="retention window"):
            await prepare_day("2000-01-01")
        sessions.assert_not_called()


async def test_storage_policy_never_outlives_recorded_intent_deadline() -> None:
    storage = S3MediaStorage.__new__(S3MediaStorage)
    storage._public = Mock()
    storage._public.generate_presigned_post.return_value = {"url": "synthetic", "fields": {}}
    await storage.create_upload_url(
        "bucket", "key", "image/png", 900, 100, deadline=datetime.now(UTC) + timedelta(seconds=31)
    )
    assert 1 <= storage._public.generate_presigned_post.call_args.kwargs["ExpiresIn"] <= 31


async def test_delayed_signing_cannot_issue_an_already_expired_intent() -> None:
    storage = S3MediaStorage.__new__(S3MediaStorage)
    storage._public = Mock()
    with pytest.raises(StorageError):
        await storage.create_upload_url(
            "bucket",
            "key",
            "image/png",
            900,
            100,
            deadline=datetime.now(UTC) - timedelta(seconds=1),
        )
    storage._public.generate_presigned_post.assert_not_called()
