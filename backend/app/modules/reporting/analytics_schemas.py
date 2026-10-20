from datetime import datetime
from typing import Literal

from pydantic import Field

from app.modules.reporting.schemas import ReportingModel


class AnalyticsTotals(ReportingModel):
    active_users: int = Field(ge=0)
    new_users: int = Field(ge=0)
    sessions: int = Field(ge=0)
    views: int = Field(ge=0)
    engagement_rate: float = Field(ge=0, le=1, allow_inf_nan=False)


class AnalyticsDay(AnalyticsTotals):
    date: str


class AnalyticsSegment(ReportingModel):
    name: str
    sessions: int = Field(ge=0)


class AnalyticsPage(ReportingModel):
    path: str
    views: int = Field(ge=0)


class AnalyticsOverview(ReportingModel):
    source: Literal["google_analytics_4"] = "google_analytics_4"
    status: Literal["ready", "not_configured"]
    property_id: str
    range_days: Literal[7, 28, 90]
    fetched_at: datetime | None = None
    time_zone: str | None = None
    cached: bool = False
    totals: AnalyticsTotals | None = None
    previous: AnalyticsTotals | None = None
    daily: list[AnalyticsDay] = Field(default_factory=list)
    channels: list[AnalyticsSegment] = Field(default_factory=list)
    devices: list[AnalyticsSegment] = Field(default_factory=list)
    pages: list[AnalyticsPage] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)


class AnalyticsRealtime(ReportingModel):
    source: Literal["google_analytics_4"] = "google_analytics_4"
    status: Literal["ready", "not_configured"]
    property_id: str
    fetched_at: datetime | None = None
    cached: bool = False
    active_users: int | None = Field(default=None, ge=0)
