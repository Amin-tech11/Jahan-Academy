from __future__ import annotations

from collections.abc import Iterator
from pathlib import Path
from typing import Any

import yaml

SPEC_PATH = Path(__file__).resolve().parents[2] / "openapi" / "api-v1.yaml"


def _walk(value: Any) -> Iterator[Any]:
    yield value
    if isinstance(value, dict):
        for child in value.values():
            yield from _walk(child)
    elif isinstance(value, list):
        for child in value:
            yield from _walk(child)


def _resolve_local_ref(document: dict[str, Any], reference: str) -> Any:
    current: Any = document
    for raw_part in reference.removeprefix("#/").split("/"):
        part = raw_part.replace("~1", "/").replace("~0", "~")
        current = current[part]
    return current


def test_openapi_contract_has_valid_local_references_and_unique_operations() -> None:
    document = yaml.safe_load(SPEC_PATH.read_text(encoding="utf-8"))
    assert document["openapi"] == "3.1.0"

    operation_ids: list[str] = []
    for node in _walk(document):
        if isinstance(node, dict) and "$ref" in node:
            reference = node["$ref"]
            assert reference.startswith("#/")
            assert _resolve_local_ref(document, reference) is not None
        if isinstance(node, dict) and "operationId" in node:
            operation_ids.append(node["operationId"])
            assert node["x-phase"] in {"MVP", "Final", "External"}

    assert len(operation_ids) == len(set(operation_ids))
