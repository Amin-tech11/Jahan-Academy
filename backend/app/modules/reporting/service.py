from __future__ import annotations

from datetime import date, timedelta

from app.modules.reporting.repository import ReportingRepository
from app.modules.reporting.schemas import (
    ConsultantMetric,
    ContentMetric,
    DashboardMetrics,
    StatusMetric,
    SyncErrorMetric,
)
from app.shared.exceptions import ApplicationError


class ReportingService:
    def __init__(self, repository: ReportingRepository) -> None:
        self._repository = repository

    async def dashboard(self, start: date | None, end: date | None) -> DashboardMetrics:
        period_end = end or date.today()
        period_start = start or period_end - timedelta(days=29)
        if period_start > period_end or (period_end - period_start).days > 365:
            raise ApplicationError(
                code="INVALID_REPORT_PERIOD",
                message="Choose a date range from zero to 365 days.",
                status_code=422,
                field_errors={"from": ["INVALID_REPORT_PERIOD"]},
            )
        rows = await self._repository.dashboard_rows(period_start, period_end)
        lead = rows["leads"][0]
        total = lead["total"]
        converted = lead["converted"]
        return DashboardMetrics(
            period_start=period_start,
            period_end=period_end,
            total_leads=total,
            converted_leads=converted,
            conversion_rate=converted / total if total else 0,
            lead_statuses=[StatusMetric.model_validate(item) for item in rows["statuses"]],
            consultants=[
                ConsultantMetric.model_validate(
                    {**item, "conversion_rate": item["converted_leads"] / item["assigned_leads"]}
                )
                for item in rows["consultants"]
            ],
            published_content=[ContentMetric.model_validate(item) for item in rows["content"]],
            sync_statuses=[StatusMetric.model_validate(item) for item in rows["sync_statuses"]],
            sync_errors=[SyncErrorMetric.model_validate(item) for item in rows["sync_errors"]],
        )
