from __future__ import annotations

import math
import secrets
from datetime import UTC, datetime, timedelta
from pathlib import Path
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.core.config import Settings
from app.modules.identity.authorization import AuthorizationContext
from app.modules.media.domain import (
    EXTENSIONS_BY_MIME,
    MediaPurpose,
    UploadStatus,
    accepted_mime_types,
)
from app.modules.media.repository import MediaRepository, StaleMediaError
from app.modules.media.schemas import MediaAssetView, MediaPage, MediaPageMeta, UploadIntent
from app.modules.media.storage import MediaStorage, StorageError
from app.modules.media.validation import (
    MalwareScanError,
    MalwareScanner,
    MediaContentValidator,
    MediaValidationError,
)
from app.shared.exceptions import ApplicationError


class MediaService:
    def __init__(
        self,
        repository: MediaRepository,
        storage: MediaStorage,
        validator: MediaContentValidator,
        scanner: MalwareScanner,
        settings: Settings,
    ) -> None:
        self._repository = repository
        self._storage = storage
        self._validator = validator
        self._scanner = scanner
        self._settings = settings

    async def create_upload_intent(
        self, payload: dict[str, object], actor: AuthorizationContext
    ) -> UploadIntent:
        purpose = MediaPurpose(str(payload["purpose"]))
        mime_type = str(payload["mime_type"]).casefold()
        filename = str(payload["filename"])
        size_bytes = int(str(payload["size_bytes"]))
        self._validate_declaration(filename, mime_type, purpose, size_bytes)
        expires_at = datetime.now(UTC) + timedelta(
            seconds=self._settings.media_upload_expiry_seconds
        )
        extension = Path(filename).suffix.casefold()
        object_key = f"media/{datetime.now(UTC):%Y/%m}/{secrets.token_urlsafe(24)}{extension}"
        values = {
            "owner_user_id": actor.user_id,
            "bucket": self._settings.media_quarantine_bucket,
            "object_key": object_key,
            "original_filename": Path(filename).name,
            "mime_type": mime_type,
            "size_bytes": size_bytes,
            "purpose": purpose.value,
            "upload_expires_at": expires_at,
            "alt_fa": payload.get("alt_fa"),
            "alt_en": payload.get("alt_en"),
            "source_url": payload.get("source_url"),
            "attribution": payload.get("attribution"),
        }
        try:
            row = await self._repository.create_intent(values)
            upload_url = await self._storage.create_upload_url(
                row["bucket"],
                row["object_key"],
                mime_type,
                self._settings.media_upload_expiry_seconds,
            )
            await self._repository.audit(
                actor_user_id=actor.user_id,
                action="media.upload_intent.created",
                asset_id=row["id"],
                before=None,
                after=row,
            )
            await self._repository.session.commit()
        except StorageError as exc:
            await self._repository.session.rollback()
            raise self._storage_unavailable() from exc
        return UploadIntent(
            id=row["id"],
            upload_url=upload_url,
            headers={"Content-Type": mime_type},
            expires_at=expires_at,
            max_size_bytes=self._max_size(purpose),
        )

    async def confirm(
        self, asset_id: UUID, checksum: str, actor: AuthorizationContext
    ) -> MediaAssetView:
        row = await self._repository.get(asset_id, for_update=True)
        if row is None:
            raise self._not_found()
        self._require_owner_or_super_admin(row, actor)
        if row["upload_status"] == UploadStatus.READY.value:
            if row["checksum_sha256"] == checksum:
                return self._view(row)
            raise ApplicationError(
                "MEDIA_ALREADY_CONFIRMED", "The upload is already confirmed.", 409
            )
        if row["upload_status"] == UploadStatus.REJECTED.value:
            raise ApplicationError("MEDIA_UPLOAD_REJECTED", "The upload was rejected.", 409)
        if row["upload_expires_at"] < datetime.now(UTC):
            await self._reject(row, "MEDIA_UPLOAD_EXPIRED")
            raise ApplicationError("MEDIA_UPLOAD_EXPIRED", "The upload intent has expired.", 410)
        await self._repository.mark_processing(asset_id)
        try:
            stored = await self._storage.head(row["bucket"], row["object_key"])
            if stored.size_bytes != row["size_bytes"]:
                raise MediaValidationError("MEDIA_SIZE_MISMATCH")
            if stored.content_type and stored.content_type.casefold() != row["mime_type"]:
                raise MediaValidationError("MEDIA_CONTENT_TYPE_MISMATCH")
            content = await self._storage.read(row["bucket"], row["object_key"], row["size_bytes"])
            result = self._validator.validate(content, row["mime_type"])
            if not secrets.compare_digest(result.checksum_sha256, checksum):
                raise MediaValidationError("MEDIA_CHECKSUM_MISMATCH")
            duplicate_id = await self._repository.duplicate_ready_asset(checksum, asset_id)
            if duplicate_id is not None:
                raise ApplicationError(
                    "MEDIA_DUPLICATE",
                    "An identical media asset already exists.",
                    409,
                    field_errors={"existingMediaId": str(duplicate_id)},
                )
            await self._scanner.scan(content)
            target_key = f"public/{asset_id}/{Path(row['object_key']).name}"
            await self._storage.promote(
                row["bucket"], row["object_key"], self._settings.media_public_bucket, target_key
            )
            ready = await self._repository.mark_ready(
                asset_id,
                bucket=self._settings.media_public_bucket,
                object_key=target_key,
                checksum=checksum,
                width=result.width,
                height=result.height,
                scan_status="clean" if self._settings.malware_scan_enabled else "not_required",
            )
            await self._repository.audit(
                actor_user_id=actor.user_id,
                action="media.upload.confirmed",
                asset_id=asset_id,
                before=row,
                after=ready,
            )
            await self._repository.session.commit()
            return self._view(ready)
        except ApplicationError:
            await self._repository.session.rollback()
            raise
        except MediaValidationError as exc:
            await self._reject(row, exc.code)
            raise ApplicationError(exc.code, "The uploaded file failed validation.", 422) from exc
        except MalwareScanError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                exc.args[0], "Media scanning is temporarily unavailable.", 503
            ) from exc
        except StorageError as exc:
            await self._repository.session.rollback()
            raise self._storage_unavailable() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                "MEDIA_DUPLICATE", "An identical media asset already exists.", 409
            ) from exc

    async def list(
        self,
        *,
        page: int,
        limit: int,
        query: str | None,
        purpose: MediaPurpose | None,
        upload_status: UploadStatus | None,
        mime_type: str | None,
    ) -> MediaPage:
        rows, total = await self._repository.list(
            page=page,
            limit=limit,
            query=query,
            purpose=purpose.value if purpose else None,
            upload_status=upload_status.value if upload_status else None,
            mime_type=mime_type,
        )
        return MediaPage(
            data=[self._view(row) for row in rows],
            meta=MediaPageMeta(
                page=page,
                limit=limit,
                total=total,
                total_pages=math.ceil(total / limit) if total else 0,
            ),
        )

    async def get(self, asset_id: UUID) -> MediaAssetView:
        row = await self._repository.get(asset_id)
        if row is None:
            raise self._not_found()
        return self._view(row)

    async def update_metadata(
        self,
        asset_id: UUID,
        values: dict[str, object],
        expected_version: int,
        actor: AuthorizationContext,
    ) -> MediaAssetView:
        row = await self._repository.get(asset_id)
        if row is None:
            raise self._not_found()
        merged = {
            field: values[field] if field in values else row.get(field)
            for field in ("alt_fa", "alt_en", "source_url", "attribution")
        }
        if row["purpose"] != MediaPurpose.PUBLIC_FILE.value and (
            not merged["alt_fa"] or not merged["alt_en"]
        ):
            raise ApplicationError(
                "MEDIA_ALT_REQUIRED", "Persian and English alt text are required for images.", 422
            )
        try:
            updated = await self._repository.update_metadata(asset_id, merged, expected_version)
            await self._repository.audit(
                actor_user_id=actor.user_id,
                action="media.metadata.updated",
                asset_id=asset_id,
                before=row,
                after=updated,
            )
            await self._repository.session.commit()
            return self._view(updated)
        except StaleMediaError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc

    async def delete(
        self, asset_id: UUID, expected_version: int, actor: AuthorizationContext
    ) -> None:
        row = await self._repository.get(asset_id, for_update=True)
        if row is None:
            raise self._not_found()
        if row["row_version"] != expected_version:
            raise self._stale()
        if await self._repository.dependency_count(asset_id):
            raise ApplicationError(
                "RESOURCE_HAS_DEPENDENCIES",
                "The media asset is in use and cannot be deleted.",
                409,
            )
        try:
            await self._storage.delete(row["bucket"], row["object_key"])
            await self._repository.soft_delete(asset_id, expected_version)
            await self._repository.audit(
                actor_user_id=actor.user_id,
                action="media.deleted",
                asset_id=asset_id,
                before=row,
                after=None,
            )
            await self._repository.session.commit()
        except StaleMediaError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except StorageError as exc:
            await self._repository.session.rollback()
            raise self._storage_unavailable() from exc

    async def public_download_url(self, asset_id: UUID) -> str:
        row = await self._repository.get(asset_id)
        if row is None or row["upload_status"] != UploadStatus.READY.value:
            raise self._not_found()
        try:
            return await self._storage.create_download_url(
                row["bucket"], row["object_key"], self._settings.media_download_expiry_seconds
            )
        except StorageError as exc:
            raise self._storage_unavailable() from exc

    async def _reject(self, row: dict[str, object], code: str) -> None:
        await self._repository.mark_rejected(row["id"], code)  # type: ignore[arg-type]
        try:
            await self._storage.delete(str(row["bucket"]), str(row["object_key"]))
        except StorageError:
            pass
        await self._repository.session.commit()

    def _validate_declaration(
        self, filename: str, mime_type: str, purpose: MediaPurpose, size_bytes: int
    ) -> None:
        if Path(filename).name != filename or any(ord(char) < 32 for char in filename):
            raise ApplicationError("MEDIA_FILENAME_INVALID", "The filename is invalid.", 422)
        if mime_type not in accepted_mime_types(purpose):
            raise ApplicationError("MEDIA_TYPE_NOT_ALLOWED", "The media type is not allowed.", 415)
        if Path(filename).suffix.casefold() not in EXTENSIONS_BY_MIME[mime_type]:
            raise ApplicationError(
                "MEDIA_EXTENSION_MISMATCH",
                "The filename extension does not match its media type.",
                422,
            )
        if size_bytes > self._max_size(purpose):
            raise ApplicationError(
                "MEDIA_TOO_LARGE", "The media asset exceeds its size limit.", 413
            )

    def _max_size(self, purpose: MediaPurpose) -> int:
        if purpose is MediaPurpose.LOGO:
            return self._settings.media_max_logo_bytes
        if purpose is MediaPurpose.PUBLIC_FILE:
            return self._settings.media_max_public_file_bytes
        return self._settings.media_max_image_bytes

    @staticmethod
    def _require_owner_or_super_admin(row: dict[str, object], actor: AuthorizationContext) -> None:
        if row["owner_user_id"] == actor.user_id or any(
            grant.role == "super_admin" for grant in actor.grants
        ):
            return
        raise ApplicationError(
            "MEDIA_UPLOAD_OWNER_REQUIRED", "The media upload is not accessible.", 404
        )

    @staticmethod
    def _view(row: dict[str, object]) -> MediaAssetView:
        return MediaAssetView.model_validate(
            {
                "id": row["id"],
                "owner_user_id": row.get("owner_user_id"),
                "original_filename": row.get("original_filename"),
                "mime_type": row["mime_type"],
                "size_bytes": row["size_bytes"],
                "checksum_sha256": row.get("checksum_sha256"),
                "purpose": row.get("purpose"),
                "upload_status": row["upload_status"],
                "scan_status": row["scan_status"],
                "width": row.get("width"),
                "height": row.get("height"),
                "alt_fa": row.get("alt_fa"),
                "alt_en": row.get("alt_en"),
                "source_url": row.get("source_url"),
                "attribution": row.get("attribution"),
                "validation_error_code": row.get("validation_error_code"),
                "expires_at": row.get("upload_expires_at"),
                "confirmed_at": row.get("confirmed_at"),
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "version": row["row_version"],
                "public_url": (
                    f"/api/v1/media/{row['id']}/content"
                    if row["upload_status"] == "ready"
                    else None
                ),
            }
        )

    @staticmethod
    def _not_found() -> ApplicationError:
        return ApplicationError("MEDIA_NOT_FOUND", "The media asset was not found.", 404)

    @staticmethod
    def _stale() -> ApplicationError:
        return ApplicationError("STALE_WRITE", "The media asset changed; refresh and retry.", 412)

    @staticmethod
    def _storage_unavailable() -> ApplicationError:
        return ApplicationError("MEDIA_STORAGE_UNAVAILABLE", "Media storage is unavailable.", 503)
