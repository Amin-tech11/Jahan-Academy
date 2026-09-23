from __future__ import annotations

import asyncio
import hashlib
import io
import socket
import struct
from dataclasses import dataclass
from typing import Protocol

from PIL import Image, UnidentifiedImageError

from app.modules.media.domain import IMAGE_MIME_TYPES


class MediaValidationError(Exception):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class MalwareScanError(Exception):
    pass


@dataclass(frozen=True, slots=True)
class ValidationResult:
    checksum_sha256: str
    detected_mime_type: str
    width: int | None = None
    height: int | None = None


class MalwareScanner(Protocol):
    async def scan(self, content: bytes) -> None: ...


class DisabledMalwareScanner:
    async def scan(self, content: bytes) -> None:
        del content


class ClamAvScanner:
    def __init__(self, host: str, port: int, timeout_seconds: float) -> None:
        self._host = host
        self._port = port
        self._timeout = timeout_seconds

    async def scan(self, content: bytes) -> None:
        await asyncio.to_thread(self._scan_sync, content)

    def _scan_sync(self, content: bytes) -> None:
        try:
            with socket.create_connection(
                (self._host, self._port), timeout=self._timeout
            ) as client:
                client.settimeout(self._timeout)
                client.sendall(b"zINSTREAM\0")
                for offset in range(0, len(content), 64 * 1024):
                    chunk = content[offset : offset + 64 * 1024]
                    client.sendall(struct.pack("!I", len(chunk)))
                    client.sendall(chunk)
                client.sendall(struct.pack("!I", 0))
                response = client.recv(4096).decode("utf-8", errors="replace")
        except OSError as exc:
            raise MalwareScanError("MALWARE_SCANNER_UNAVAILABLE") from exc
        if " FOUND" in response:
            raise MediaValidationError("MALWARE_DETECTED")
        if " OK" not in response:
            raise MalwareScanError("MALWARE_SCAN_FAILED")


class MediaContentValidator:
    FORMAT_MIME = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}
    DANGEROUS_PDF_TOKENS = (
        b"/JavaScript",
        b"/JS",
        b"/Launch",
        b"/EmbeddedFile",
        b"/OpenAction",
        b"/AA",
    )

    def __init__(self, max_image_pixels: int) -> None:
        self._max_image_pixels = max_image_pixels

    def validate(self, content: bytes, declared_mime_type: str) -> ValidationResult:
        if not content:
            raise MediaValidationError("MEDIA_EMPTY_FILE")
        if content.startswith((b"MZ", b"\x7fELF", b"#!")):
            raise MediaValidationError("MEDIA_EXECUTABLE_REJECTED")
        if declared_mime_type in IMAGE_MIME_TYPES:
            detected, width, height = self._validate_image(content)
        elif declared_mime_type == "application/pdf":
            detected, width, height = self._validate_pdf(content), None, None
        else:
            raise MediaValidationError("MEDIA_TYPE_NOT_ALLOWED")
        if detected != declared_mime_type:
            raise MediaValidationError("MEDIA_CONTENT_TYPE_MISMATCH")
        return ValidationResult(
            checksum_sha256=hashlib.sha256(content).hexdigest(),
            detected_mime_type=detected,
            width=width,
            height=height,
        )

    def _validate_image(self, content: bytes) -> tuple[str, int, int]:
        try:
            with Image.open(io.BytesIO(content)) as image:
                detected = self.FORMAT_MIME.get(image.format or "")
                width, height = image.size
                if detected is None:
                    raise MediaValidationError("MEDIA_IMAGE_FORMAT_NOT_ALLOWED")
                if width < 1 or height < 1 or width * height > self._max_image_pixels:
                    raise MediaValidationError("MEDIA_IMAGE_DIMENSIONS_INVALID")
                image.verify()
            with Image.open(io.BytesIO(content)) as image:
                image.load()
        except MediaValidationError:
            raise
        except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
            raise MediaValidationError("MEDIA_IMAGE_INVALID") from exc
        return detected, width, height

    def _validate_pdf(self, content: bytes) -> str:
        if not content.startswith(b"%PDF-") or b"%%EOF" not in content[-2048:]:
            raise MediaValidationError("MEDIA_PDF_INVALID")
        if any(token in content for token in self.DANGEROUS_PDF_TOKENS):
            raise MediaValidationError("MEDIA_PDF_ACTIVE_CONTENT_REJECTED")
        return "application/pdf"
