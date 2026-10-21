from __future__ import annotations

import json
from typing import Any

from app.shared.exceptions import ApplicationError


def answer(label: str, english: str) -> str:
    # Match the existing three-line assessment representation, without interpreting SQL input.
    # Escape regex colons for SQLAlchemy's text() bind parser; PostgreSQL receives (?:...).
    return f"substring(l.message from '(?\\:^|\\n)(?\\:{label}|{english}):[ \\t]*([^\\r\\n]+)')"


COLUMN_SQL = {
    "reference": "l.public_reference",
    "fullName": "concat_ws(' ', l.first_name, l.last_name)",
    "mobile": "l.mobile_normalized",
    "email": "l.email",
    "age": "l.age::text",
    "occupation": "l.occupation",
    "gender": (
        "CASE WHEN l.gender_code = 'self_described' THEN "
        "coalesce(l.gender_self_description, l.gender_code::text) "
        "ELSE l.gender_code::text END"
    ),
    "education": answer("تحصیلات", "Education"),
    "maritalStatus": "l.marital_status_code::text",
    "investmentBudget": (
        "CASE WHEN l.investment_range_code IS NOT NULL THEN "
        "concat_ws(' · ', l.investment_range_code, l.investment_currency) ELSE "
        f"{answer('سرمایه مهاجرت', 'Migration budget')} END"
    ),
    "englishProficiency": answer("مهارت زبان انگلیسی", "English proficiency"),
    "requestCreatedAt": "l.created_at::text",
    "contactTime": answer("زمان مناسب تماس|زمان ترجیحی تماس", "Preferred contact time"),
    "requestType": (
        "CASE WHEN array_length(string_to_array(trim(l.message), E'\\n'), 1) = 3 "
        f"AND {answer('تحصیلات', 'Education')} IS NOT NULL "
        f"AND {answer('سرمایه مهاجرت', 'Migration budget')} IS NOT NULL "
        f"AND {answer('مهارت زبان انگلیسی', 'English proficiency')} IS NOT NULL "
        "THEN 'assessment' ELSE 'consultation' END"
    ),
    "status": "l.status::text",
}


def column_expression(column: str) -> str:
    if column not in COLUMN_SQL:
        raise ApplicationError(
            code="INVALID_COLUMN", message="Unknown table column.", status_code=422
        )
    return f"coalesce(nullif({COLUMN_SQL[column]}, ''), '—')"


def parse_column_filters(value: str | None) -> dict[str, list[str]]:
    if value is None:
        return {}
    try:
        parsed: Any = json.loads(value)
        if not isinstance(parsed, dict) or len(parsed) > len(COLUMN_SQL):
            raise ValueError
        for column, values in parsed.items():
            if column not in COLUMN_SQL or not isinstance(values, list) or len(values) > 500:
                raise ValueError
            if any(not isinstance(item, str) or len(item) > 500 for item in values):
                raise ValueError
        return parsed
    except (ValueError, TypeError):
        raise ApplicationError(
            code="INVALID_COLUMN_FILTERS", message="Invalid column filters.", status_code=422
        ) from None


def apply_column_filters(
    where: str, params: dict[str, Any], filters: dict[str, list[str]], *, exclude: str | None = None
) -> str:
    for index, (column, values) in enumerate(filters.items()):
        if column == exclude:
            continue
        expression = column_expression(column)
        name = f"column_values_{index}"
        where += f" AND {expression} = ANY(CAST(:{name} AS text[]))"
        params[name] = values
    return where


def column_order(column: str, direction: str) -> str:
    column_expression(column)
    if direction not in {"asc", "desc"}:
        raise ApplicationError(
            code="INVALID_SORT", message="Invalid sort direction.", status_code=422
        )
    expression = {"age": "l.age", "requestCreatedAt": "l.created_at"}.get(
        column, f"nullif({COLUMN_SQL[column]}, '')"
    )
    if column == "reference":
        prefix = "regexp_replace(l.public_reference, '[0-9]+$', '')"
        number = "substring(l.public_reference from '[0-9]+$')::numeric"
        expression = f"{prefix} {direction.upper()}, {number}"
    elif column == "investmentBudget":
        budget = (
            "translate(lower(coalesce("
            + answer("سرمایه مهاجرت", "Migration budget")
            + ", '')), '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩٬,', '01234567890123456789')"
        )
        number = f"substring({budget} from '[0-9]+[.]?[0-9]*')::numeric"
        expression = (
            "CASE l.investment_range_code WHEN 'under_10k' THEN 0 "
            "WHEN '10k_20k' THEN 10000 WHEN '20k_40k' THEN 20000 "
            "WHEN '40k_plus' THEN 40000 ELSE "
            f"CASE WHEN {budget} ~ '(کمتر|under)' THEN 0 ELSE {number} * "
            f"CASE WHEN {budget} ~ '(میلیارد|billion)' THEN 1000000000 "
            f"WHEN {budget} ~ '(میلیون|million)' THEN 1000000 ELSE 1 END END END"
        )
    return f"{expression} {direction.upper()} NULLS LAST, l.created_at DESC, l.id DESC"
