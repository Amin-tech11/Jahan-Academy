from __future__ import annotations

import asyncio
import hashlib
import json
import socket
import struct
import subprocess  # nosec B404
import sys
import threading
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from app.modules.media.domain import IMAGE_MIME_TYPES

_INSPECTION_SLOT = threading.BoundedSemaphore(1)


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
        if len(content) > 15 * 1024 * 1024:
            raise MediaValidationError("MEDIA_IMAGE_LIMIT_EXCEEDED")
        result = self._inspect(content, "image", str(self._max_image_pixels))
        errors = {
            2: "MEDIA_IMAGE_INVALID",
            3: "MEDIA_IMAGE_FORMAT_NOT_ALLOWED",
            4: "MEDIA_IMAGE_LIMIT_EXCEEDED",
            5: "MEDIA_IMAGE_DIMENSIONS_INVALID",
        }
        if result.returncode != 0:
            raise MediaValidationError(errors.get(result.returncode, "MEDIA_IMAGE_LIMIT_EXCEEDED"))
        try:
            detected, width, height = json.loads(result.stdout)
            if (
                detected not in IMAGE_MIME_TYPES
                or type(width) is not int
                or type(height) is not int
                or width < 1
                or height < 1
                or width * height > min(self._max_image_pixels, 64 * 1024 * 1024 // 4)
            ):
                raise ValueError("Invalid worker result")
            return str(detected), width, height
        except (ValueError, TypeError) as exc:
            raise MediaValidationError("MEDIA_IMAGE_INVALID") from exc

    @staticmethod
    def _inspect(content: bytes, kind: str, *args: str) -> subprocess.CompletedProcess[bytes]:
        if not _INSPECTION_SLOT.acquire(blocking=False):
            raise MalwareScanError("MEDIA_VALIDATOR_BUSY")
        try:
            # Fixed isolated worker/argv, bounded runtime, no shell; content enters stdin only.
            result = subprocess.run(  # nosec B603
                [
                    sys.executable,
                    "-I",
                    str(Path(__file__).with_name("media_worker.py")),
                    kind,
                    *args,
                ],
                input=content,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                timeout=10,
                check=False,
            )
        except (subprocess.TimeoutExpired, OSError) as error:
            code = "MEDIA_IMAGE_LIMIT_EXCEEDED" if kind == "image" else "MEDIA_PDF_LIMIT_EXCEEDED"
            raise MediaValidationError(code) from error
        finally:
            _INSPECTION_SLOT.release()
        if result.returncode == 6:
            raise MalwareScanError("MEDIA_VALIDATOR_UNAVAILABLE")
        return result

    def _validate_pdf(self, content: bytes) -> str:
        if not content.startswith(b"%PDF-") or b"%%EOF" not in content[-2048:]:
            raise MediaValidationError("MEDIA_PDF_INVALID")
        if len(content) > 25 * 1024 * 1024:
            raise MediaValidationError("MEDIA_PDF_LIMIT_EXCEEDED")
        result = self._inspect(content, "pdf")
        if result.returncode == 3:
            raise MediaValidationError("MEDIA_PDF_ACTIVE_CONTENT_REJECTED")
        if result.returncode == 4:
            raise MediaValidationError("MEDIA_PDF_LIMIT_EXCEEDED")
        if result.returncode == 5:
            raise MediaValidationError("MEDIA_PDF_ENCRYPTED")
        if result.returncode != 0:
            raise MediaValidationError("MEDIA_PDF_INVALID")
        return "application/pdf"
