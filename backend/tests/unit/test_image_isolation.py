import io
import subprocess
import sys
from pathlib import Path
from unittest.mock import Mock

import pytest
from PIL import Image

from app.modules.media.validation import (
    MalwareScanError,
    MediaContentValidator,
    MediaValidationError,
)


def image_bytes() -> bytes:
    output = io.BytesIO()
    Image.new("RGB", (64, 48)).save(output, format="PNG")
    return output.getvalue()


def test_decode_does_not_run_inside_api_process(monkeypatch: pytest.MonkeyPatch) -> None:
    content = image_bytes()
    monkeypatch.setattr(Image, "open", Mock(side_effect=AssertionError("API must not decode")))
    result = MediaContentValidator(1_000_000).validate(content, "image/png")
    assert (result.width, result.height) == (64, 48)


def test_small_compressed_file_with_excessive_pixels_is_rejected() -> None:
    # A valid tiny PNG whose IHDR advertises a large decoded raster. Rebuild its CRC.
    import struct
    import zlib

    content = bytearray(image_bytes())
    content[16:24] = struct.pack(">II", 6324, 6324)
    content[29:33] = struct.pack(">I", zlib.crc32(content[12:29]))
    with pytest.raises(MediaValidationError) as error:
        MediaContentValidator(40_000_000).validate(bytes(content), "image/png")
    assert error.value.code == "MEDIA_IMAGE_LIMIT_EXCEEDED"


def test_truncated_image_never_passes() -> None:
    with pytest.raises(MediaValidationError):
        MediaContentValidator(1_000_000).validate(image_bytes()[:45], "image/png")


def test_large_static_image_at_decoded_budget_remains_supported() -> None:
    output = io.BytesIO()
    with Image.new("RGB", (4096, 4096)) as image:
        image.save(output, format="PNG")
    result = MediaContentValidator(40_000_000).validate(output.getvalue(), "image/png")
    assert (result.width, result.height) == (4096, 4096)


def test_decode_timeout_fails_closed_and_releases_capacity(monkeypatch: pytest.MonkeyPatch) -> None:
    content = image_bytes()
    with monkeypatch.context() as patch:
        patch.setattr(subprocess, "run", Mock(side_effect=subprocess.TimeoutExpired("image", 10)))
        with pytest.raises(MediaValidationError) as error:
            MediaContentValidator(1_000_000).validate(content, "image/png")
        assert error.value.code == "MEDIA_IMAGE_LIMIT_EXCEEDED"
    assert MediaContentValidator(1_000_000).validate(content, "image/png").width == 64


def test_cannot_publish_when_isolation_is_unavailable(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(subprocess, "run", Mock(return_value=subprocess.CompletedProcess([], 6)))
    with pytest.raises(MalwareScanError, match="MEDIA_VALIDATOR_UNAVAILABLE"):
        MediaContentValidator(1_000_000).validate(image_bytes(), "image/png")


def test_native_allocations_are_limited_in_disposable_process() -> None:
    from app.modules.media import media_worker

    worker = str(Path(media_worker.__file__).resolve())
    probe = (
        f"import runpy; m = runpy.run_path({worker!r}); m['limit_resources']();\n"
        "try:\n bytearray(256 * 1024 * 1024)\n"
        "except MemoryError:\n print('allocation denied')\n"
        "else:\n raise AssertionError('worker memory limit not enforced')\n"
    )
    result = subprocess.run(
        [sys.executable, "-I", "-c", probe],
        capture_output=True,
        timeout=10,
        check=False,
    )
    assert result.returncode == 0, result.stderr.decode(errors="replace")
    assert result.stdout.strip() == b"allocation denied"
