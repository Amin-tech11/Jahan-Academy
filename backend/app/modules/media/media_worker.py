"""Bounded disposable inspection process; input is never rendered or executed."""

from __future__ import annotations

import io
import json
import logging
import runpy
import sys
import warnings
from pathlib import Path

MEMORY_BYTES = 192 * 1024 * 1024
MAX_IMAGE_BYTES = 15 * 1024 * 1024
MAX_DECODED_BYTES = 64 * 1024 * 1024
_job_handle: object = None


def limit_resources() -> None:
    if sys.platform != "win32":
        import resource

        resource.setrlimit(resource.RLIMIT_AS, (MEMORY_BYTES, MEMORY_BYTES))
        resource.setrlimit(resource.RLIMIT_CPU, (8, 8))
        return
    # A Job Object enforces native decoder allocations as well as Python memory.
    import ctypes
    from ctypes import wintypes

    class BasicLimits(ctypes.Structure):
        _fields_ = [
            ("process_time", ctypes.c_longlong),
            ("job_time", ctypes.c_longlong),
            ("flags", wintypes.DWORD),
            ("min_working_set", ctypes.c_size_t),
            ("max_working_set", ctypes.c_size_t),
            ("active_processes", wintypes.DWORD),
            ("affinity", ctypes.c_size_t),
            ("priority", wintypes.DWORD),
            ("scheduling", wintypes.DWORD),
        ]

    class IoCounters(ctypes.Structure):
        _fields_ = [
            (name, ctypes.c_ulonglong)
            for name in (
                "read_ops",
                "write_ops",
                "other_ops",
                "read_bytes",
                "write_bytes",
                "other_bytes",
            )
        ]

    class ExtendedLimits(ctypes.Structure):
        _fields_ = [
            ("basic", BasicLimits),
            ("io", IoCounters),
            ("process_memory", ctypes.c_size_t),
            ("job_memory", ctypes.c_size_t),
            ("peak_process_memory", ctypes.c_size_t),
            ("peak_job_memory", ctypes.c_size_t),
        ]

    kernel = ctypes.WinDLL("kernel32", use_last_error=True)
    kernel.CreateJobObjectW.argtypes = [ctypes.c_void_p, wintypes.LPCWSTR]
    kernel.CreateJobObjectW.restype = wintypes.HANDLE
    kernel.SetInformationJobObject.argtypes = [
        wintypes.HANDLE,
        ctypes.c_int,
        ctypes.c_void_p,
        wintypes.DWORD,
    ]
    kernel.SetInformationJobObject.restype = wintypes.BOOL
    kernel.AssignProcessToJobObject.argtypes = [wintypes.HANDLE, wintypes.HANDLE]
    kernel.AssignProcessToJobObject.restype = wintypes.BOOL
    kernel.GetCurrentProcess.restype = wintypes.HANDLE
    global _job_handle
    _job_handle = kernel.CreateJobObjectW(None, None)
    limits = ExtendedLimits()
    limits.basic.flags = 0x100 | 0x2 | 0x2000  # process memory, process CPU, kill on close
    limits.basic.process_time = 8 * 10_000_000
    limits.process_memory = MEMORY_BYTES
    if (
        not _job_handle
        or not kernel.SetInformationJobObject(
            _job_handle, 9, ctypes.byref(limits), ctypes.sizeof(limits)
        )
        or not kernel.AssignProcessToJobObject(_job_handle, kernel.GetCurrentProcess())
    ):
        raise OSError(ctypes.get_last_error(), "Cannot enforce inspection limits")


def inspect_image(content: bytes, max_pixels: int) -> int:
    from PIL import Image, UnidentifiedImageError

    Image.MAX_IMAGE_PIXELS = min(max_pixels, MAX_DECODED_BYTES // 4)
    warnings.simplefilter("error", Image.DecompressionBombWarning)
    try:
        with Image.open(io.BytesIO(content)) as image:
            mime = {"JPEG": "image/jpeg", "PNG": "image/png", "WEBP": "image/webp"}.get(
                image.format or ""
            )
            if mime is None:
                return 3
            width, height = image.size
            if width < 1 or height < 1 or width * height > max_pixels:
                return 5
            if width * height * 4 > MAX_DECODED_BYTES:
                return 4
            # Animated/multiframe input cannot hide uninspected later frames.
            if getattr(image, "n_frames", 1) != 1:
                return 2
            image.verify()
        with Image.open(io.BytesIO(content)) as image:
            image.load()
    except (Image.DecompressionBombError, Image.DecompressionBombWarning, MemoryError):
        return 4
    except (UnidentifiedImageError, OSError, ValueError):
        return 2
    print(json.dumps([mime, width, height]))
    return 0


def main() -> int:
    try:
        limit_resources()
    except Exception:
        return 6  # Resource isolation unavailable: retryable, never fail open.
    logging.disable(logging.CRITICAL)
    sys.setrecursionlimit(512)
    kind = sys.argv[1]
    maximum = MAX_IMAGE_BYTES if kind == "image" else 25 * 1024 * 1024
    try:
        content = sys.stdin.buffer.read(maximum + 1)
        if len(content) > maximum:
            return 4
        if kind == "image":
            return inspect_image(content, int(sys.argv[2]))
        if kind == "pdf":
            policy = runpy.run_path(str(Path(__file__).with_name("pdf_check.py")))
            return int(policy["check"](content))
        return 2
    except (MemoryError, RecursionError):
        return 4
    except Exception:
        return 2


if __name__ == "__main__":
    sys.exit(main())
