from typing import cast
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api.errors import install_exception_handlers
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import auth_service, authorization_context
from app.modules.identity.schemas import PanelAccessUpdate
from app.modules.reporting.analytics_schemas import AnalyticsOverview, AnalyticsRealtime
from app.modules.reporting.analytics_service import AnalyticsService
from app.modules.reporting.router import analytics_service, router


def client_for(actor: AuthorizationContext | None) -> tuple[TestClient, Mock]:
    app = FastAPI()
    install_exception_handlers(app)
    app.include_router(router, prefix="/api/v1")
    service = Mock(spec=AnalyticsService)
    service.overview = AsyncMock(
        return_value=AnalyticsOverview(
            status="not_configured",
            property_id="558971968",
            range_days=28,
        )
    )
    service.realtime = AsyncMock(
        return_value=AnalyticsRealtime(
            status="not_configured",
            property_id="558971968",
        )
    )

    def service_override() -> AnalyticsService:
        return cast(AnalyticsService, service)

    app.dependency_overrides[analytics_service] = service_override
    app.dependency_overrides[auth_service] = lambda: Mock()
    if actor is not None:

        def context_override() -> AuthorizationContext:
            return actor

        app.dependency_overrides[authorization_context] = context_override
    return TestClient(app), service


@pytest.mark.parametrize("path", ["/analytics", "/analytics/realtime"])
def test_analytics_requires_authentication(path: str) -> None:
    client, service = client_for(None)
    with client:
        assert client.get("/api/v1/reporting" + path).status_code == 401
    service.overview.assert_not_called()
    service.realtime.assert_not_called()


@pytest.mark.parametrize("role", ["support", "consultant", "content_editor"])
def test_staff_cannot_read_analytics_even_with_forged_panel_section(role: str) -> None:
    actor = AuthorizationContext(
        uuid4(),
        (RoleGrant(role, "global", None, frozenset()),),
        panel_sections=frozenset({"analytics", "dashboard", "leads"}),
    )
    client, service = client_for(actor)
    with client:
        for path in ("/analytics", "/analytics/realtime"):
            assert client.get("/api/v1/reporting" + path).status_code == 403
    service.overview.assert_not_called()
    service.realtime.assert_not_called()


def test_super_admin_can_read_but_periods_are_bounded() -> None:
    actor = AuthorizationContext(uuid4(), (RoleGrant("super_admin", "global", None, frozenset()),))
    client, service = client_for(actor)
    with client:
        result = client.get("/api/v1/reporting/analytics?days=28")
        assert result.status_code == 200
        assert result.headers["cache-control"] == "no-store"
        assert result.json()["totals"] is None
        assert client.get("/api/v1/reporting/analytics/realtime").status_code == 200
        assert client.get("/api/v1/reporting/analytics?days=365").status_code == 422
    service.overview.assert_awaited_once_with(28)


def test_analytics_access_cannot_be_delegated_by_panel_update() -> None:
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        PanelAccessUpdate(sections=["analytics"])
