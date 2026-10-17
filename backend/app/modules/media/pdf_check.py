"""Isolated PDF policy worker. Never render, execute actions, or fetch external data."""

from __future__ import annotations

import io
import logging
import sys
from urllib.parse import urlsplit

from pypdf import PdfReader
from pypdf.generic import ArrayObject, DictionaryObject, IndirectObject

MAX_INPUT = 25 * 1024 * 1024
FORBIDDEN = {
    "/AA",
    "/OpenAction",
    "/JavaScript",
    "/JS",
    "/Launch",
    "/EmbeddedFile",
    "/EmbeddedFiles",
    "/EF",
    "/AF",
    "/AcroForm",
    "/XFA",
    "/RichMedia",
    "/RichMediaContent",
    "/RichMediaSettings",
    "/Collection",
    "/Movie",
    "/Sound",
}
ACTIVE_SUBTYPES = {"/RichMedia", "/Screen", "/Movie", "/Sound", "/3D", "/FileAttachment"}
ACTIVE_ACTIONS = {
    "/JavaScript",
    "/Launch",
    "/GoToR",
    "/GoToE",
    "/SubmitForm",
    "/ResetForm",
    "/ImportData",
    "/Rendition",
    "/Movie",
    "/Sound",
    "/Hide",
    "/SetOCGState",
    "/Trans",
    "/GoTo3DView",
    "/Named",
    "/Thread",
}


def check(content: bytes) -> int:
    reader = PdfReader(io.BytesIO(content), strict=True, root_object_recovery_limit=0)
    if reader.is_encrypted:
        return 5  # Uninspectable input is never published.
    root = reader.trailer["/Root"]
    if (
        not isinstance(root, DictionaryObject)
        or root.get("/Type") != "/Catalog"
        or "/Pages" not in root
    ):
        return 2
    stack: list[tuple[object, int, bool]] = [(reader.trailer, 0, False)]
    references: set[tuple[int, int]] = set()
    containers: set[int] = set()
    count = 0
    while stack:
        obj, depth, action = stack.pop()
        count += 1
        if depth > 100 or count > 50000:
            return 4
        if isinstance(obj, IndirectObject):
            reference = obj.idnum, obj.generation
            if reference in references:
                continue
            references.add(reference)
            stack.append((obj.get_object(), depth + 1, action))
        elif isinstance(obj, DictionaryObject):
            if id(obj) in containers:
                continue
            containers.add(id(obj))
            # pypdf resolves name escapes and compressed object streams before this check.
            if FORBIDDEN.intersection(obj) or obj.get("/Subtype") in ACTIVE_SUBTYPES:
                return 3
            subtype = obj.get("/S")
            if subtype in ACTIVE_ACTIONS:
                return 3
            if action or obj.get("/Type") == "/Action":
                if subtype not in {"/GoTo", "/URI"}:
                    return 3
            if subtype == "/URI":
                uri = str(obj.get("/URI", ""))
                parsed = urlsplit(uri)
                if (
                    parsed.scheme not in {"http", "https"}
                    or not parsed.hostname
                    or any(ord(char) < 32 for char in uri)
                ):
                    return 3
            stack.extend(
                (
                    value,
                    depth + 1,
                    name == "/A" or (name == "/Next" and (action or obj.get("/Type") == "/Action")),
                )
                for name, value in obj.items()
            )
        elif isinstance(obj, ArrayObject):
            stack.extend((value, depth + 1, action) for value in obj)
    return 0


def main() -> int:
    # Linux production containers additionally enforce hard CPU/address-space limits.
    if sys.platform != "win32":
        import resource

        resource.setrlimit(resource.RLIMIT_AS, (192 * 1024 * 1024, 192 * 1024 * 1024))
        resource.setrlimit(resource.RLIMIT_CPU, (8, 8))
    sys.setrecursionlimit(512)
    logging.disable(logging.CRITICAL)
    content = sys.stdin.buffer.read(MAX_INPUT + 1)
    if len(content) > MAX_INPUT:
        return 4
    try:
        return check(content)
    except (MemoryError, RecursionError):
        return 4
    except Exception:
        return 2


if __name__ == "__main__":
    sys.exit(main())
