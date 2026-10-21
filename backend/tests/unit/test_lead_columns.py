from __future__ import annotations

import pytest

from app.modules.consultations.lead_columns import (
    apply_column_filters,
    column_order,
    parse_column_filters,
)
from app.shared.exceptions import ApplicationError


def test_table_filters_are_bounded_validated_and_parameterized() -> None:
    values = parse_column_filters('{"fullName":["x\u0027 OR 1=1 --"],"age":[]}')
    params: dict[str, object] = {}
    where = apply_column_filters("l.assigned_consultant_id = :actor", params, values)
    assert "OR 1=1" not in where
    assert "l.assigned_consultant_id = :actor" in where
    assert params["column_values_0"] == ["x' OR 1=1 --"]
    assert params["column_values_1"] == []
    for payload in ("[]", '{"passwordHash":["secret"]}', '{"age":[30]}', '{"age":null}'):
        with pytest.raises(ApplicationError):
            parse_column_filters(payload)


def test_facets_exclude_only_their_own_filter_and_sort_is_whitelisted() -> None:
    params: dict[str, object] = {}
    where = apply_column_filters("1=1", params, {"age": ["30"], "status": ["new"]}, exclude="age")
    assert "l.age" not in where
    assert params == {"column_values_1": ["new"]}
    assert column_order("age", "desc") == "l.age DESC NULLS LAST, l.created_at DESC, l.id DESC"
    with pytest.raises(ApplicationError):
        column_order("age; DROP TABLE users", "asc")
    with pytest.raises(ApplicationError):
        column_order("age", "desc; DROP TABLE users")


def test_contact_time_filters_are_allowed_and_parameterized() -> None:
    filters = parse_column_filters('{"contactTime":["12:30 - 1"]}')
    params: dict[str, object] = {}
    where = apply_column_filters("1=1", params, filters)
    assert "زمان مناسب تماس|زمان ترجیحی تماس|Preferred contact time" in where
    assert "12:30 - 1" not in where
    assert params == {"column_values_0": ["12:30 - 1"]}
    assert "substring(l.message" in column_order("contactTime", "asc")
