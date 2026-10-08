from uuid import uuid4

import pytest

from app.modules.consultations.domain import LeadArchiveFilter, LeadSearchField
from app.modules.consultations.lead_repository import LeadRepository


@pytest.mark.parametrize(
    ("field", "query", "expected", "column"),
    [
        (LeadSearchField.REFERENCE, "JA_%", r"%JA\_\%%", "l.public_reference"),
        (LeadSearchField.FULL_NAME, "  Mina   Ahmadi ", "%Mina Ahmadi%", "concat_ws"),
        (LeadSearchField.MOBILE, "+98 912 345 6789", "%989123456789%", "mobile_normalized"),
        (LeadSearchField.MOBILE, "۰۹۱۲۳۴۵۶۷۸۹", "%989123456789%", "mobile_normalized"),
        (LeadSearchField.MOBILE, "۰۹۱۲", "%98912%", "mobile_normalized"),
        (LeadSearchField.MOBILE, "0098-912-345-6789", "%989123456789%", "mobile_normalized"),
    ],
)
def test_selected_search_is_bound_and_retains_visibility_scope(
    field: LeadSearchField, query: str, expected: str, column: str
) -> None:
    actor_id = uuid4()
    where, params = LeadRepository._filters(  # noqa: SLF001
        query=query,
        search_field=field,
        status=None,
        sync_status=None,
        assignee_id=None,
        country_id=None,
        created_from=None,
        created_to=None,
        archive=LeadArchiveFilter.ACTIVE,
        assigned_scope_user_id=actor_id,
    )
    assert params["query"] == expected
    assert params["scope_user_id"] == actor_id
    assert column in where
    assert "l.archived_at IS NULL" in where
    assert "l.email" not in where
    assert "desired_country_text" not in where
    if field is not LeadSearchField.REFERENCE:
        assert "public_reference" not in where
