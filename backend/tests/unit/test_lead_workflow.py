from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.modules.consultations.domain import LEAD_STATUS_TRANSITIONS, LeadStatus
from app.modules.consultations.lead_schemas import (
    LeadAssignmentRequest,
    LeadStatusTransitionRequest,
)
from app.modules.consultations.lead_service import LeadService
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.shared.exceptions import ApplicationError


def test_lead_transition_matrix_reaches_closed_and_allows_reopening() -> None:
    assert LeadStatus.ASSIGNED in LEAD_STATUS_TRANSITIONS[LeadStatus.NEW]
    assert LeadStatus.CONTACTED in LEAD_STATUS_TRANSITIONS[LeadStatus.ASSIGNED]
    assert LeadStatus.CONVERTED not in LEAD_STATUS_TRANSITIONS[LeadStatus.CONTACTED]
    assert LeadStatus.CONVERTED in LEAD_STATUS_TRANSITIONS[LeadStatus.QUALIFIED]
    assert LEAD_STATUS_TRANSITIONS[LeadStatus.CLOSED] == frozenset(
        {
            LeadStatus.NEW,
            LeadStatus.ASSIGNED,
            LeadStatus.CONTACTED,
            LeadStatus.QUALIFIED,
            LeadStatus.NOT_QUALIFIED,
            LeadStatus.CONVERTED,
        }
    )


def test_workflow_requests_normalize_and_validate_reasons() -> None:
    consultant_id = uuid4()
    assignment = LeadAssignmentRequest.model_validate(
        {"consultantId": str(consultant_id), "reason": "  Better country fit  "}
    )
    transition = LeadStatusTransitionRequest.model_validate(
        {"toStatus": "CONTACTED", "reason": "  Initial call completed  "}
    )
    assert assignment.consultant_id == consultant_id
    assert assignment.reason == "Better country fit"
    assert transition.to_status == "contacted"
    assert transition.reason == "Initial call completed"

    with pytest.raises(ValidationError):
        LeadStatusTransitionRequest.model_validate({"toStatus": "closed", "reason": " x "})


def test_assigned_writer_can_change_only_own_lead() -> None:
    actor_id = uuid4()
    actor = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="consultant",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"lead.write.assigned"}),
            ),
        ),
    )
    service = LeadService(repository=None)  # type: ignore[arg-type]
    service._require_status_write(actor, actor_id)  # noqa: SLF001
    with pytest.raises(ApplicationError) as caught:
        service._require_status_write(actor, uuid4())  # noqa: SLF001
    assert caught.value.status_code == 403
