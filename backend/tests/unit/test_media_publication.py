import asyncio
import hashlib
import io
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from pypdf import PdfWriter

from app.core.config import Settings
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.password_work import password_work
from app.modules.media.repository import MediaRepository
from app.modules.media.service import MediaService
from app.modules.media.storage import MediaStorage, S3MediaStorage, StoredObject
from app.modules.media.validation import MalwareScanError, MalwareScanner, MediaContentValidator
from app.shared.exceptions import ApplicationError


@pytest.mark.parametrize("scan_fails", [False, True])
async def test_quarantine_replacement_cannot_publish_unscanned_bytes(
    scan_fails: bool,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    output = io.BytesIO()
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    writer.write(output)
    original = output.getvalue()
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


@pytest.mark.parametrize("cancel_first", [False, True])
async def test_concurrent_confirmation_is_rejected_before_storage_read_and_can_retry(
    monkeypatch: pytest.MonkeyPatch,
    cancel_first: bool,
) -> None:
    owner = uuid4()
    asset_id = uuid4()
    content = b"synthetic media"
    actor = AuthorizationContext(owner, ())

    def repository() -> Mock:
        repo = Mock(spec=MediaRepository)
        repo.session = AsyncMock()
        repo.get.return_value = {
            "id": asset_id,
            "owner_user_id": owner,
            "upload_status": "pending",
            "upload_expires_at": datetime.now(UTC) + timedelta(minutes=5),
            "bucket": "quarantine",
            "object_key": "upload.png",
            "size_bytes": len(content),
            "mime_type": "image/png",
        }
        repo.duplicate_ready_asset.return_value = None
        return repo

    first_repo, second_repo = repository(), repository()
    storage = Mock()
    entered, release = asyncio.Event(), asyncio.Event()

    async def blocked_head(*args: object) -> StoredObject:
        entered.set()
        await release.wait()
        return StoredObject(len(content), "image/png")

    storage.head = AsyncMock(side_effect=blocked_head)
    storage.read = AsyncMock(return_value=content)
    storage.promote = AsyncMock()
    scanner = Mock(spec=MalwareScanner)
    scanner.scan.side_effect = MalwareScanError("SYNTHETIC_SCANNER_OUTAGE")
    validator = Mock(spec=MediaContentValidator)
    validator.validate.return_value = SimpleNamespace(
        checksum_sha256=hashlib.sha256(content).hexdigest(),
        detected_mime_type="image/png",
        width=1,
        height=1,
    )
    settings = Settings(_env_file=None, environment="test")
    first = MediaService(first_repo, storage, validator, scanner, settings)
    second = MediaService(second_repo, storage, validator, scanner, settings)
    first_task = asyncio.create_task(
        first.confirm(asset_id, hashlib.sha256(content).hexdigest(), actor)
    )
    await asyncio.wait_for(entered.wait(), 2)
    with pytest.raises(ApplicationError) as busy:
        await password_work(lambda: None)
    assert busy.value.code == "AUTH_CRYPTO_BUSY"
    if cancel_first:
        first_task.cancel()
        await asyncio.sleep(0)
    try:
        with pytest.raises(ApplicationError) as error:
            await second.confirm(asset_id, hashlib.sha256(content).hexdigest(), actor)
        assert error.value.status_code == 503
        assert error.value.code == "MEDIA_VALIDATOR_BUSY"
        assert storage.head.await_count == 1
        storage.read.assert_not_awaited()
        second_repo.mark_rejected.assert_not_awaited()
        second_repo.session.rollback.assert_awaited_once()
    finally:
        release.set()
        expected_error = asyncio.CancelledError if cancel_first else ApplicationError
        with pytest.raises(expected_error):
            await first_task
    # A scanner failure releases admission capacity. The pending second intent can retry.
    scanner.scan.side_effect = None
    monkeypatch.setattr(second, "_view", Mock(return_value=SimpleNamespace()))
    await second.confirm(asset_id, hashlib.sha256(content).hexdigest(), actor)
    second_repo.mark_ready.assert_awaited_once()


@pytest.mark.parametrize("pdf", [False, True])
async def test_larger_configuration_cannot_issue_intent_beyond_worker_input_cap(pdf: bool) -> None:
    repository = Mock(spec=MediaRepository)
    storage = Mock(spec=MediaStorage)
    service = MediaService(
        repository,
        storage,
        Mock(spec=MediaContentValidator),
        Mock(spec=MalwareScanner),
        Settings(
            _env_file=None,
            media_max_image_bytes=100 * 1024 * 1024,
            media_max_public_file_bytes=100 * 1024 * 1024,
        ),
    )
    with pytest.raises(ApplicationError) as error:
        await service.create_upload_intent(
            {
                "purpose": "public_file" if pdf else "university_image",
                "mime_type": "application/pdf" if pdf else "image/png",
                "filename": "guide.pdf" if pdf else "campus.png",
                "size_bytes": (26 if pdf else 16) * 1024 * 1024,
            },
            AuthorizationContext(uuid4(), ()),
        )
    assert error.value.status_code == 413
    repository.create_intent.assert_not_awaited()
    storage.create_upload_url.assert_not_awaited()


@pytest.mark.parametrize("pdf", [False, True])
async def test_legacy_oversized_intent_is_rejected_before_storage_read(pdf: bool) -> None:
    asset, owner = uuid4(), uuid4()
    repository = Mock(spec=MediaRepository)
    repository.session = AsyncMock()
    repository.get.return_value = {
        "id": asset,
        "owner_user_id": owner,
        "upload_status": "pending",
        "upload_expires_at": datetime.now(UTC) + timedelta(minutes=5),
        "mime_type": "application/pdf" if pdf else "image/png",
        "size_bytes": (26 if pdf else 16) * 1024 * 1024,
        "bucket": "quarantine",
        "object_key": "synthetic-key",
    }
    storage = Mock(spec=MediaStorage)
    service = MediaService(
        repository,
        storage,
        Mock(spec=MediaContentValidator),
        Mock(spec=MalwareScanner),
        Settings(_env_file=None),
    )
    with pytest.raises(ApplicationError) as error:
        await service.confirm(asset, "unused", AuthorizationContext(owner, ()))
    assert error.value.status_code == 422
    assert error.value.code == "MEDIA_TOO_LARGE"
    storage.head.assert_not_awaited()
    storage.read.assert_not_awaited()
    repository.mark_rejected.assert_awaited_once_with(asset, "MEDIA_TOO_LARGE")
