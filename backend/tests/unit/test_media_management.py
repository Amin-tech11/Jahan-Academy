from __future__ import annotations

import hashlib
import io

import pytest
from PIL import Image
from pydantic import ValidationError

from app.modules.media.schemas import UploadIntentRequest
from app.modules.media.validation import MediaContentValidator, MediaValidationError


def _image_bytes(format_name: str) -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (32, 24), color=(17, 50, 78)).save(output, format=format_name)
    return output.getvalue()


@pytest.mark.parametrize(
    ("format_name", "mime_type"),
    [("JPEG", "image/jpeg"), ("PNG", "image/png"), ("WEBP", "image/webp")],
)
def test_image_validator_inspects_real_content(format_name: str, mime_type: str) -> None:
    content = _image_bytes(format_name)
    result = MediaContentValidator(max_image_pixels=1_000_000).validate(content, mime_type)

    assert result.detected_mime_type == mime_type
    assert (result.width, result.height) == (32, 24)
    assert result.checksum_sha256 == hashlib.sha256(content).hexdigest()


def test_image_validator_rejects_declared_mime_mismatch() -> None:
    with pytest.raises(MediaValidationError) as mismatch:
        MediaContentValidator(max_image_pixels=1_000_000).validate(
            _image_bytes("PNG"), "image/jpeg"
        )
    assert mismatch.value.code == "MEDIA_CONTENT_TYPE_MISMATCH"


def test_validator_rejects_executable_and_active_pdf() -> None:
    validator = MediaContentValidator(max_image_pixels=1_000_000)
    with pytest.raises(MediaValidationError) as executable:
        validator.validate(b"MZ" + b"0" * 100, "application/pdf")
    assert executable.value.code == "MEDIA_EXECUTABLE_REJECTED"

    with pytest.raises(MediaValidationError) as active_pdf:
        validator.validate(b"%PDF-1.7\n/JavaScript true\n%%EOF", "application/pdf")
    assert active_pdf.value.code == "MEDIA_PDF_ACTIVE_CONTENT_REJECTED"


def test_upload_intent_requires_bilingual_alt_for_images() -> None:
    with pytest.raises(ValidationError, match="altFa and altEn"):
        UploadIntentRequest.model_validate(
            {
                "filename": "campus.webp",
                "mimeType": "image/webp",
                "sizeBytes": 100,
                "purpose": "university_image",
                "altFa": "نمای دانشگاه",
            }
        )


def test_public_pdf_does_not_require_alt_text() -> None:
    payload = UploadIntentRequest.model_validate(
        {
            "filename": "guide.pdf",
            "mimeType": "application/pdf",
            "sizeBytes": 100,
            "purpose": "public_file",
        }
    )
    assert payload.alt_fa is None
