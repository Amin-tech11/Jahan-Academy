from __future__ import annotations

from datetime import date
from typing import cast
from uuid import uuid4

import pytest

from app.modules.reporting.repository import ReportingRepository
from app.modules.reporting.service import ReportingService
from app.shared.exceptions import ApplicationError


class FakeReportingRepository:
    async def dashboard_rows(self, start: date, end: date) -> dict[str, list[dict[str, object]]]:
        assert start == date(2026, 9, 1)
        assert end == date(2026, 9, 30)
        return {
            "leads": [{"total": 4, "converted": 1}],
            "statuses": [{"status": "new", "count": 3}, {"status": "converted", "count": 1}],
            "consultants": [
                {
                    "consultant_id": uuid4(),
                    "name": "Test Consultant",
                    "assigned_leads": 2,
                    "converted_leads": 1,
                }
            ],
            "content": [{"resource": "article", "published_count": 2}],
            "sync_statuses": [{"status": "synced", "count": 3}],
            "sync_errors": [{"code": "NOURA_TIMEOUT", "count": 1, "latest_at": date(2026, 9, 30)}],
        }


@pytest.mark.asyncio
async def test_dashboard_exposes_temporary_safe_operational_metrics() -> None:
    result = await ReportingService(cast(ReportingRepository, FakeReportingRepository())).dashboard(
        date(2026, 9, 1), date(2026, 9, 30)
    )

    assert result.source == "local_temporary"
    assert result.total_leads == 4
    assert result.conversion_rate == 0.25
    assert result.consultants[0].conversion_rate == 0.5
    assert result.sync_errors[0].code == "NOURA_TIMEOUT"


@pytest.mark.asyncio
async def test_dashboard_rejects_ranges_larger_than_one_year() -> None:
    with pytest.raises(ApplicationError) as error:
        await ReportingService(cast(ReportingRepository, FakeReportingRepository())).dashboard(
            date(2025, 1, 1), date(2026, 1, 2)
        )

    assert error.value.code == "INVALID_REPORT_PERIOD"
