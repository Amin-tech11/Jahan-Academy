from uuid import uuid4

import pytest
from pydantic import ValidationError
from starlette.requests import Request

from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import require_permissions
from app.modules.identity.panel_access import ALL_SECTIONS, section_for_path
from app.modules.identity.schemas import PanelAccessUpdate
from app.shared.exceptions import ApplicationError


@pytest.mark.parametrize(
    "sections", [["staff"], ["audit"], ["access"], ["unknown"], ["leads", "leads"]]
)
def test_reserved_unknown_and_duplicate_sections_are_rejected(sections: list[str]) -> None:
    with pytest.raises(ValidationError):
        PanelAccessUpdate(sections=sections)


def test_empty_access_is_valid_and_does_not_grant_leads() -> None:
    assert PanelAccessUpdate(sections=[]).sections == []
    actor = AuthorizationContext(uuid4(), (), panel_sections=frozenset())
    assert not actor.allows(frozenset({"lead.read.assigned"}))


@pytest.mark.parametrize(
    "path,section",
    [
        ("/api/v1/admin/content/category/abc", "categories"),
        ("/api/v1/admin/reference-data/cities", "cities"),
        ("/api/v1/admin/leads/abc/notes", "leads"),
        ("/api/v1/admin/audit-logs", "audit"),
        ("/api/v1/reporting/dashboard", "dashboard"),
        ("/api/v1/users/me/panel-access", None),
    ],
)
def test_route_sections(path: str, section: str | None) -> None:
    assert section_for_path(path) == section


async def test_same_permission_does_not_enable_neighboring_panel() -> None:
    actor = AuthorizationContext(uuid4(), (), panel_sections=frozenset({"universities"}))
    dependency = require_permissions("catalog.read")
    request = Request({"type": "http", "path": "/api/v1/admin/programs", "headers": []})
    with pytest.raises(ApplicationError) as caught:
        await dependency(request, actor)
    assert caught.value.code == "PANEL_ACCESS_DENIED"
    request = Request({"type": "http", "path": "/api/v1/admin/universities", "headers": []})
    assert await dependency(request, actor) == actor


def test_section_grants_preserve_assigned_lead_scope() -> None:
    actor = AuthorizationContext(uuid4(), (), panel_sections=frozenset({"leads"}))
    assert actor.allows(frozenset({"lead.read.assigned"}))
    assert not actor.allows(frozenset({"lead.read.all", "lead.assign"}))


def test_only_global_super_admin_is_super_admin() -> None:
    grant = RoleGrant("super_admin", "country", uuid4(), frozenset())
    assert not AuthorizationContext(uuid4(), (grant,)).is_super_admin
    assert {"access", "staff", "audit"} <= ALL_SECTIONS
