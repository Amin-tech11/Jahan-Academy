from __future__ import annotations

from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ReportingModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, extra="forbid")


class StatusMetric(ReportingModel):
    status: str
    count: int = Field(ge=0)


class ConsultantMetric(ReportingModel):
    consultant_id: UUID
    name: str
    assigned_leads: int = Field(ge=0)
    converted_leads: int = Field(ge=0)
    conversion_rate: float = Field(ge=0, le=1)


class SyncErrorMetric(ReportingModel):
    code: str
    count: int = Field(ge=0)
    latest_at: date | None = None


class ContentMetric(ReportingModel):
    resource: Literal["university", "program", "article"]
    published_count: int = Field(ge=0)


class DashboardMetrics(ReportingModel):
    source: Literal["local_temporary"] = "local_temporary"
    period_start: date
    period_end: date
    total_leads: int = Field(ge=0)
    converted_leads: int = Field(ge=0)
    conversion_rate: float = Field(ge=0, le=1)
    lead_statuses: list[StatusMetric]
    consultants: list[ConsultantMetric]
    published_content: list[ContentMetric]
    sync_statuses: list[StatusMetric]
    sync_errors: list[SyncErrorMetric]
