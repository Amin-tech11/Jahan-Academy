from __future__ import annotations

from enum import StrEnum


class MediaPurpose(StrEnum):
    LOGO = "logo"
    UNIVERSITY_IMAGE = "university_image"
    ARTICLE_IMAGE = "article_image"
    PUBLIC_FILE = "public_file"


class UploadStatus(StrEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    REJECTED = "rejected"


IMAGE_MIME_TYPES = frozenset({"image/jpeg", "image/png", "image/webp"})
PUBLIC_FILE_MIME_TYPES = frozenset({"application/pdf"})
EXTENSIONS_BY_MIME = {
    "image/jpeg": frozenset({".jpg", ".jpeg"}),
    "image/png": frozenset({".png"}),
    "image/webp": frozenset({".webp"}),
    "application/pdf": frozenset({".pdf"}),
}


def accepted_mime_types(purpose: MediaPurpose) -> frozenset[str]:
    return PUBLIC_FILE_MIME_TYPES if purpose is MediaPurpose.PUBLIC_FILE else IMAGE_MIME_TYPES
