from __future__ import annotations

import json
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class StaleMediaError(Exception):
    pass


class MediaRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_intent(self, values: dict[str, Any]) -> dict[str, Any]:
        asset_id = uuid4()
        row = (
            (
                await self.session.execute(
                    text(
                        "INSERT INTO media_assets (id, owner_user_id, storage_provider, bucket, "
                        "object_key, original_filename, mime_type, size_bytes, privacy_class, "
                        "scan_status, purpose, upload_status, upload_expires_at, alt_fa, alt_en, "
                        "source_url, attribution) VALUES (:id, :owner_user_id, 's3', :bucket, "
                        ":object_key, :original_filename, :mime_type, :size_bytes, 'quarantine', "
                        "'pending', :purpose, 'pending', :upload_expires_at, :alt_fa, :alt_en, "
                        ":source_url, :attribution) RETURNING *"
                    ),
                    {"id": asset_id, **values},
                )
            )
            .mappings()
            .one()
        )
        return dict(row)

    async def get(self, asset_id: UUID, *, for_update: bool = False) -> dict[str, Any] | None:
        statement = (
            text("SELECT * FROM media_assets WHERE id = :id AND deleted_at IS NULL FOR UPDATE")
            if for_update
            else text("SELECT * FROM media_assets WHERE id = :id AND deleted_at IS NULL")
        )
        row = (
            (
                await self.session.execute(
                    statement,
                    {"id": asset_id},
                )
            )
            .mappings()
            .one_or_none()
        )
        return dict(row) if row else None

    async def list(
        self,
        *,
        page: int,
        limit: int,
        query: str | None,
        purpose: str | None,
        upload_status: str | None,
        mime_type: str | None,
    ) -> tuple[list[dict[str, Any]], int]:
        conditions = ["deleted_at IS NULL"]
        params: dict[str, Any] = {"limit": limit, "offset": (page - 1) * limit}
        if query:
            conditions.append("original_filename ILIKE :query")
            params["query"] = f"%{query}%"
        if purpose:
            conditions.append("purpose = :purpose")
            params["purpose"] = purpose
        if upload_status:
            conditions.append("upload_status = :upload_status")
            params["upload_status"] = upload_status
        if mime_type:
            conditions.append("mime_type = :mime_type")
            params["mime_type"] = mime_type
        where = " AND ".join(conditions)
        total = int(
            await self.session.scalar(
                text(f"SELECT count(*) FROM media_assets WHERE {where}"),  # nosec B608
                params,
            )
            or 0
        )
        rows = await self.session.execute(
            text(
                f"SELECT * FROM media_assets WHERE {where} "  # nosec B608
                "ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset"
            ),
            params,
        )
        return [dict(row._mapping) for row in rows], total

    async def mark_processing(self, asset_id: UUID) -> None:
        await self.session.execute(
            text(
                "UPDATE media_assets SET upload_status = 'processing', updated_at = now() "
                "WHERE id = :id"
            ),
            {"id": asset_id},
        )

    async def mark_ready(
        self,
        asset_id: UUID,
        *,
        bucket: str,
        object_key: str,
        checksum: str,
        width: int | None,
        height: int | None,
        scan_status: str,
    ) -> dict[str, Any]:
        row = (
            (
                await self.session.execute(
                    text(
                        "UPDATE media_assets SET bucket = :bucket, object_key = :object_key, "
                        "checksum_sha256 = :checksum, width = :width, height = :height, "
                        "privacy_class = 'public', scan_status = :scan_status, "
                        "upload_status = 'ready', confirmed_at = now(), upload_expires_at = NULL, "
                        "validation_error_code = NULL, updated_at = now(), "
                        "row_version = row_version + 1 "
                        "WHERE id = :id RETURNING *"
                    ),
                    {
                        "id": asset_id,
                        "bucket": bucket,
                        "object_key": object_key,
                        "checksum": checksum,
                        "width": width,
                        "height": height,
                        "scan_status": scan_status,
                    },
                )
            )
            .mappings()
            .one()
        )
        return dict(row)

    async def mark_rejected(self, asset_id: UUID, code: str) -> None:
        await self.session.execute(
            text(
                "UPDATE media_assets SET upload_status = 'rejected', scan_status = "
                "CASE WHEN :code = 'MALWARE_DETECTED' THEN 'infected' ELSE 'failed' END, "
                "validation_error_code = :code, updated_at = now(), row_version = row_version + 1 "
                "WHERE id = :id"
            ),
            {"id": asset_id, "code": code},
        )

    async def update_metadata(
        self, asset_id: UUID, values: dict[str, Any], expected_version: int
    ) -> dict[str, Any]:
        updated = await self.session.scalar(
            text(
                "UPDATE media_assets SET alt_fa = :alt_fa, alt_en = :alt_en, "
                "source_url = :source_url, attribution = :attribution, updated_at = now(), "
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "RETURNING id"
            ),
            {"id": asset_id, "version": expected_version, **values},
        )
        if updated is None:
            raise StaleMediaError
        result = await self.get(asset_id)
        if result is None:
            raise RuntimeError("Updated media asset unexpectedly disappeared")
        return result

    async def dependency_count(self, asset_id: UUID) -> int:
        return int(
            await self.session.scalar(
                text(
                    "SELECT (SELECT count(*) FROM university_media WHERE media_asset_id = :id) + "
                    "(SELECT count(*) FROM program_media WHERE media_asset_id = :id) + "
                    "(SELECT count(*) FROM articles WHERE featured_media_id = :id) + "
                    "(SELECT count(*) FROM services WHERE featured_media_id = :id) + "
                    "(SELECT count(*) FROM document_versions WHERE media_asset_id = :id) + "
                    "(SELECT count(*) FROM lesson_assets WHERE media_asset_id = :id)"
                ),
                {"id": asset_id},
            )
            or 0
        )

    async def soft_delete(self, asset_id: UUID, expected_version: int) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE media_assets SET deleted_at = now(), updated_at = now(), "
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {"id": asset_id, "version": expected_version},
        )
        if updated is None:
            raise StaleMediaError

    async def duplicate_ready_asset(self, checksum: str, asset_id: UUID) -> UUID | None:
        return await self.session.scalar(
            text(
                "SELECT id FROM media_assets WHERE checksum_sha256 = :checksum "
                "AND upload_status = 'ready' AND deleted_at IS NULL AND id <> :id LIMIT 1"
            ),
            {"checksum": checksum, "id": asset_id},
        )

    async def audit(
        self,
        *,
        actor_user_id: UUID,
        action: str,
        asset_id: UUID,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
    ) -> None:
        def safe(value: dict[str, Any] | None) -> str | None:
            if value is None:
                return None
            allowed = {
                key: value.get(key)
                for key in (
                    "id",
                    "purpose",
                    "mime_type",
                    "size_bytes",
                    "upload_status",
                    "scan_status",
                    "row_version",
                )
            }
            return json.dumps(allowed, default=str)

        await self.session.execute(
            text(
                "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, "
                "before_safe, after_safe) VALUES (:actor, :action, 'media_asset', :id, "
                "CAST(:before AS jsonb), CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_user_id,
                "action": action,
                "id": asset_id,
                "before": safe(before),
                "after": safe(after),
            },
        )
