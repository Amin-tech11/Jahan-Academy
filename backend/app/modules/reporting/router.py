from __future__ import annotations

from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.modules.reporting.repository import ReportingRepository
from app.modules.reporting.schemas import DashboardMetrics
from app.modules.reporting.service import ReportingService

router = APIRouter(prefix="/reporting", tags=["reporting"])


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
