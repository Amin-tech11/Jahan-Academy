from datetime import UTC, datetime
from uuid import uuid4

from app.modules.audit.schemas import AuditLogView
from app.modules.identity.authorization import AuthorizationContext, AuthorizationService
from app.shared.exceptions import ApplicationError


def test_audit_event_serializes_only_safe_persisted_fields() -> None:
    event = AuditLogView.model_validate(
        {
            "id": uuid4(),
            "actor_user_id": uuid4(),
            "action": "lead.assigned",
            "entity_type": "lead",
            "entity_id": uuid4(),
            "before_safe": {"assigned_consultant_id": None},
            "after_safe": {"assigned_consultant_id": str(uuid4())},
            "created_at": datetime.now(UTC),
        }
    )

    assert event.action == "lead.assigned"
    assert event.before_safe is not None


def test_audit_log_read_requires_explicit_permission() -> None:
    context = AuthorizationContext(user_id=uuid4(), grants=())

    try:
        AuthorizationService.require(context, frozenset({"audit.read"}))
    except ApplicationError as error:
        assert error.code == "PERMISSION_DENIED"
    else:
        raise AssertionError("Audit-log access must deny callers without audit.read")
