"""Isolated PDF policy worker. Never render, execute actions, or fetch external data."""

from __future__ import annotations

import io
from urllib.parse import urlsplit

from pypdf import PdfReader
from pypdf.generic import ArrayObject, DictionaryObject, IndirectObject

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


def resolved(obj: DictionaryObject, key: str) -> object:
    """Resolve scalar references before applying policy, including chained references."""
    value = obj.get(key)
    seen: set[tuple[int, int]] = set()
    while isinstance(value, IndirectObject):
        reference = value.idnum, value.generation
        if reference in seen or len(seen) >= 100:
            raise ValueError("Cyclic or excessive scalar indirection")
        seen.add(reference)
        value = value.get_object()
    return value


def check(content: bytes) -> int:
    reader = PdfReader(io.BytesIO(content), strict=True, root_object_recovery_limit=0)
    if reader.is_encrypted:
        return 5  # Uninspectable input is never published.
    root = reader.trailer["/Root"]
    if (
        not isinstance(root, DictionaryObject)
        or resolved(root, "/Type") != "/Catalog"
        or "/Pages" not in root
    ):
        return 2
    stack: list[tuple[object, int, bool]] = [(reader.trailer, 0, False)]
    references: set[tuple[int, int, bool]] = set()
    containers: set[tuple[int, bool]] = set()
    count = 0
    while stack:
        obj, depth, action = stack.pop()
        count += 1
        if depth > 100 or count > 50000:
            return 4
        if isinstance(obj, IndirectObject):
            reference = obj.idnum, obj.generation, action
            if reference in references:
                continue
            references.add(reference)
            stack.append((obj.get_object(), depth + 1, action))
        elif isinstance(obj, DictionaryObject):
            identity = id(obj), action
            if identity in containers:
                continue
            containers.add(identity)
            # pypdf resolves name escapes and compressed object streams before this check.
            if FORBIDDEN.intersection(obj) or resolved(obj, "/Subtype") in ACTIVE_SUBTYPES:
                return 3
            subtype = resolved(obj, "/S")
            if subtype in ACTIVE_ACTIONS:
                return 3
            is_action = action or resolved(obj, "/Type") == "/Action"
            if is_action:
                if subtype not in {"/GoTo", "/URI"}:
                    return 3
            if subtype == "/URI":
                uri = str(resolved(obj, "/URI") or "")
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
                    name == "/A" or (name == "/Next" and is_action),
                )
                for name, value in obj.items()
            )
        elif isinstance(obj, ArrayObject):
            stack.extend((value, depth + 1, action) for value in obj)
    return 0
