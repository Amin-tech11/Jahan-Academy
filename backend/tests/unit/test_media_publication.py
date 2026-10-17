import hashlib
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest

from app.core.config import Settings
from app.modules.identity.authorization import AuthorizationContext
from app.modules.media.repository import MediaRepository
from app.modules.media.service import MediaService
from app.modules.media.storage import S3MediaStorage, StoredObject
from app.modules.media.validation import MalwareScanError, MalwareScanner, MediaContentValidator
from app.shared.exceptions import ApplicationError


@pytest.mark.parametrize("scan_fails", [False, True])
async def test_quarantine_replacement_cannot_publish_unscanned_bytes(
    scan_fails: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    original = b"%PDF-1.7\noriginal scanned content\n%%EOF"
    replacement = b"unscanned replacement"
    owner = uuid4()
    asset_id = uuid4()
    repository = Mock(spec=MediaRepository)
    repository.session = AsyncMock()
    repository.get.return_value = {
        "id": asset_id,
        "owner_user_id": owner,
        "upload_status": "pending",
        "upload_expires_at": datetime.now(UTC) + timedelta(minutes=5),
        "bucket": "quarantine",
        "object_key": "upload.pdf",
        "size_bytes": len(original),
        "mime_type": "application/pdf",
    }
    repository.duplicate_ready_asset.return_value = None
    storage = S3MediaStorage.__new__(S3MediaStorage)
    client = Mock()
    storage._internal = client
    monkeypatch.setattr(
        storage, "head", AsyncMock(return_value=StoredObject(len(original), "application/pdf"))
    )
    monkeypatch.setattr(storage, "read", AsyncMock(return_value=original))
    quarantine = {"content": original}
    published: list[bytes] = []

    def put_object(**kwargs: object) -> None:
        assert quarantine["content"] == replacement
        assert kwargs["ContentType"] == "application/pdf"
        body = kwargs["Body"]
        assert isinstance(body, bytes)
        published.append(body)

    client.put_object.side_effect = put_object
    scanner = Mock(spec=MalwareScanner)

    async def scan(content: bytes) -> None:
        assert content == original
        quarantine["content"] = replacement
        if scan_fails:
            raise MalwareScanError("MALWARE_SCANNER_UNAVAILABLE")

    scanner.scan.side_effect = scan
    service = MediaService(
        repository,
        storage,
        MediaContentValidator(1_000_000),
        scanner,
        Settings(_env_file=None, environment="test"),
    )
    monkeypatch.setattr(service, "_view", Mock(return_value=SimpleNamespace()))
    if scan_fails:
        with pytest.raises(ApplicationError) as error:
            await service.confirm(
                asset_id, hashlib.sha256(original).hexdigest(), AuthorizationContext(owner, ())
            )
        assert error.value.status_code == 503
        assert not published
        repository.mark_ready.assert_not_awaited()
    else:
        await service.confirm(
            asset_id, hashlib.sha256(original).hexdigest(), AuthorizationContext(owner, ())
        )
        assert published == [original]
        assert (
            repository.mark_ready.call_args.kwargs["checksum"]
            == hashlib.sha256(original).hexdigest()
        )
    client.copy_object.assert_not_called()
