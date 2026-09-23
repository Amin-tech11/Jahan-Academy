from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.modules.consultations.lead_schemas import LeadArchiveRequest, LeadUpdate
from app.modules.consultations.lead_service import LeadService
from app.modules.consultations.router import _parse_if_match as parse_if_match
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.shared.exceptions import ApplicationError


def test_lead_update_requires_at_least_one_field() -> None:
    with pytest.raises(ValidationError, match="At least one"):
        LeadUpdate.model_validate({})


def test_lead_update_normalizes_values_and_rejects_null_required_fields() -> None:
    update = LeadUpdate.model_validate(
        {
            "firstName": "  Mina  ",
            "intakeTerm": "FALL",
            "investmentBudget": {"rangeCode": "under_20k", "currency": "eur"},
        }
    )
    assert update.first_name == "Mina"
    assert update.intake_term == "fall"
    assert update.investment_budget is not None
    assert update.investment_budget.currency == "EUR"

    with pytest.raises(ValidationError, match="first_name cannot be null"):
        LeadUpdate.model_validate({"firstName": None})


def test_lead_update_country_switch_requires_exactly_one_representation() -> None:
    with pytest.raises(ValidationError, match="exactly one"):
        LeadUpdate.model_validate(
            {
                "desiredCountryId": str(uuid4()),
                "desiredCountryText": "Germany",
            }
        )


def test_archive_reason_is_trimmed_and_validated() -> None:
    archive = LeadArchiveRequest.model_validate({"reason": "  Duplicate business record  "})
    assert archive.reason == "Duplicate business record"
    with pytest.raises(ValidationError):
        LeadArchiveRequest.model_validate({"reason": "  x "})


def test_if_match_parser_supports_strong_and_weak_etags() -> None:
    assert parse_if_match('"3"') == 3
    assert parse_if_match('W/"4"') == 4
    with pytest.raises(ApplicationError) as caught:
        parse_if_match(None)
    assert caught.value.status_code == 428


def test_assigned_reader_is_scoped_to_own_user_id() -> None:
    actor_id = uuid4()
    actor = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="consultant",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"lead.read.assigned"}),
            ),
        ),
    )
    service = LeadService(repository=None)  # type: ignore[arg-type]
    assert service._assigned_scope(actor) == actor_id  # noqa: SLF001
