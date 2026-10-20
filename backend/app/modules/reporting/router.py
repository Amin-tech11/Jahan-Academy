from __future__ import annotations

from datetime import date
from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.core.config import Settings, get_settings
from app.core.redis import get_redis
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import authorization_context, require_permissions
from app.modules.reporting.analytics_schemas import AnalyticsOverview, AnalyticsRealtime
from app.modules.reporting.analytics_service import AnalyticsService
from app.modules.reporting.repository import ReportingRepository
from app.modules.reporting.schemas import DashboardMetrics
from app.modules.reporting.service import ReportingService
from app.shared.exceptions import ApplicationError

router = APIRouter(prefix="/reporting", tags=["reporting"])


def analytics_service(settings: Annotated[Settings, Depends(get_settings)]) -> AnalyticsService:
    return AnalyticsService(settings, get_redis())


def analytics_access(
    response: Response,
    actor: Annotated[AuthorizationContext, Depends(authorization_context)],
) -> None:
    if not actor.is_super_admin:
        raise ApplicationError(
            code="PERMISSION_DENIED",
            message="Analytics requires a super administrator.",
            status_code=403,
        )
    response.headers["Cache-Control"] = "no-store"


@router.get(
    "/analytics", response_model=AnalyticsOverview, dependencies=[Depends(analytics_access)]
)
async def get_analytics(
    service: Annotated[AnalyticsService, Depends(analytics_service)],
    days: Annotated[int, Query(ge=7, le=90, description="7, 28 or 90 complete days")] = 28,
) -> AnalyticsOverview:
    if days not in (7, 28, 90):
        raise ApplicationError(
            code="VALIDATION_ERROR", message="Select 7, 28 or 90 days.", status_code=422
        )
    return await service.overview(cast(Literal[7, 28, 90], days))


@router.get(
    "/analytics/realtime",
    response_model=AnalyticsRealtime,
    dependencies=[Depends(analytics_access)],
)
async def get_analytics_realtime(
    service: Annotated[AnalyticsService, Depends(analytics_service)],
) -> AnalyticsRealtime:
    return await service.realtime()


def reporting_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> ReportingService:
    return ReportingService(ReportingRepository(session))


@router.get("/dashboard", response_model=DashboardMetrics)
async def get_dashboard(
    service: Annotated[ReportingService, Depends(reporting_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("report.read"))],
    start: Annotated[date | None, Query(alias="from")] = None,
    end: Annotated[date | None, Query(alias="to")] = None,
) -> DashboardMetrics:
    """Temporary local dashboard; Noura ERP will replace it as the reporting authority."""
    return await service.dashboard(start, end)
