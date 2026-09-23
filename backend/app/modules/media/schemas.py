from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.media.domain import MediaPurpose, UploadStatus


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class MediaModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, extra="forbid")


class UploadIntentRequest(MediaModel):
    filename: str = Field(min_length=1, max_length=255)
    mime_type: str = Field(min_length=3, max_length=150)
    size_bytes: int = Field(gt=0)
    purpose: MediaPurpose
    alt_fa: str | None = Field(default=None, max_length=300)
    alt_en: str | None = Field(default=None, max_length=300)
    source_url: str | None = Field(default=None, max_length=2000)
    attribution: str | None = Field(default=None, max_length=1000)

    @field_validator("filename", "mime_type")
    @classmethod
    def strip_required(cls, value: str) -> str:
        return value.strip()

    @field_validator("alt_fa", "alt_en", "source_url", "attribution")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @model_validator(mode="after")
    def require_image_alt_text(self) -> UploadIntentRequest:
        if self.purpose is not MediaPurpose.PUBLIC_FILE and (not self.alt_fa or not self.alt_en):
            raise ValueError("altFa and altEn are required for images")
        return self


class UploadIntent(MediaModel):
    id: UUID
    upload_url: str
    method: str = "PUT"
    headers: dict[str, str]
    expires_at: datetime
    max_size_bytes: int


class UploadIntentEnvelope(MediaModel):
    data: UploadIntent


class ConfirmUploadRequest(MediaModel):
    checksum_sha256: str = Field(pattern=r"^[a-fA-F0-9]{64}$")

    @field_validator("checksum_sha256")
    @classmethod
    def normalize_checksum(cls, value: str) -> str:
        return value.casefold()


class MediaMetadataUpdate(MediaModel):
    alt_fa: str | None = Field(default=None, max_length=300)
    alt_en: str | None = Field(default=None, max_length=300)
    source_url: str | None = Field(default=None, max_length=2000)
    attribution: str | None = Field(default=None, max_length=1000)

    @field_validator("alt_fa", "alt_en", "source_url", "attribution")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class MediaAssetView(MediaModel):
    id: UUID
    owner_user_id: UUID | None = None
    original_filename: str | None = None
    mime_type: str
    size_bytes: int
    checksum_sha256: str | None = None
    purpose: MediaPurpose | None = None
    upload_status: UploadStatus
    scan_status: str
    width: int | None = None
    height: int | None = None
    alt_fa: str | None = None
    alt_en: str | None = None
    source_url: str | None = None
    attribution: str | None = None
    public_url: str | None = None
    validation_error_code: str | None = None
    expires_at: datetime | None = None
    confirmed_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class MediaAssetEnvelope(MediaModel):
    data: MediaAssetView


class MediaPageMeta(MediaModel):
    page: int
    limit: int
    total: int
    total_pages: int


class MediaPage(MediaModel):
    data: list[MediaAssetView]
    meta: MediaPageMeta


class StorageObjectInfo(MediaModel):
    size_bytes: int
    content_type: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
