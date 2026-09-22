from uuid import uuid4

import pytest

from app.modules.identity.authorization import (
    AuthorizationContext,
    AuthorizationService,
    PermissionMode,
    ResourceScope,
    RoleGrant,
    validate_permission_codes,
)
from app.shared.exceptions import ApplicationError


def _context(*grants: RoleGrant) -> AuthorizationContext:
    return AuthorizationContext(user_id=uuid4(), grants=grants)


def test_global_grant_applies_with_and_without_resource_scope() -> None:
    context = _context(
        RoleGrant(
            role="editor",
            scope_type="global",
            scope_id=None,
            permissions=frozenset({"content.read", "content.write"}),
        )
    )

    assert context.allows(frozenset({"content.read"}))
    assert context.allows(
        frozenset({"content.write"}),
        scope=ResourceScope(type="country", id=uuid4()),
    )


def test_scoped_grant_requires_exact_scope_match() -> None:
    country_id = uuid4()
    context = _context(
        RoleGrant(
            role="country_editor",
            scope_type="country",
            scope_id=country_id,
            permissions=frozenset({"catalog.write"}),
        )
    )

    assert context.allows(
        frozenset({"catalog.write"}),
        scope=ResourceScope(type="country", id=country_id),
    )
    assert not context.allows(frozenset({"catalog.write"}))
    assert not context.allows(
        frozenset({"catalog.write"}),
        scope=ResourceScope(type="country", id=uuid4()),
    )


def test_all_and_any_permission_modes_are_distinct() -> None:
    context = _context(
        RoleGrant(
            role="support",
            scope_type="global",
            scope_id=None,
            permissions=frozenset({"lead.read.assigned"}),
        )
    )
    required = frozenset({"lead.read.assigned", "lead.read.all"})

    assert not context.allows(required, mode=PermissionMode.ALL)
    assert context.allows(required, mode=PermissionMode.ANY)


def test_missing_permission_is_denied_with_stable_error() -> None:
    context = _context()

    with pytest.raises(ApplicationError) as caught:
        AuthorizationService.require(context, frozenset({"identity.manage"}))

    assert caught.value.code == "PERMISSION_DENIED"
    assert caught.value.status_code == 403


def test_permission_codes_are_validated_at_dependency_boundary() -> None:
    validate_permission_codes(frozenset({"application.read.assigned", "course.progress.own"}))

    with pytest.raises(ValueError, match="Invalid permission codes"):
        validate_permission_codes(frozenset({"Not Valid"}))

    with pytest.raises(ValueError, match="At least one"):
        validate_permission_codes(frozenset())
