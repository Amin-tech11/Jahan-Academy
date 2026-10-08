from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from pydantic import EmailStr, Field, field_validator, model_validator

from app.modules.consultations.domain import (
    GenderCode,
    IntakeTerm,
    LeadStatus,
    MaritalStatusCode,
    SyncStatus,
)
from app.modules.consultations.schemas import ApiModel, InvestmentBudget


class LeadUpdate(ApiModel):
    first_name: str | None = Field(default=None, min_length=1, max_length=100)
    last_name: str | None = Field(default=None, min_length=1, max_length=100)
    mobile: str | None = Field(default=None, min_length=7, max_length=32)
    email: EmailStr | None = Field(default=None, max_length=254)
    desired_country_id: UUID | None = None
    desired_country_text: str | None = Field(default=None, min_length=1, max_length=100)
    intake_term: IntakeTerm | None = None
    start_year: int | None = None
    age: int | None = Field(default=None, ge=18, le=100)
    gender: GenderCode | None = None
    gender_self_description: str | None = Field(default=None, min_length=1, max_length=100)
    occupation: str | None = Field(default=None, max_length=120)
    marital_status: MaritalStatusCode | None = None
    investment_budget: InvestmentBudget | None = None
    message: str | None = Field(default=None, max_length=2000)
    locale: str | None = Field(default=None, pattern=r"^(fa|en)$")

    @field_validator("intake_term", "gender", "marital_status", mode="before")
    @classmethod
    def normalize_enum_case(cls, value: object) -> object:
        return value.casefold() if isinstance(value, str) else value

    @field_validator("first_name", "last_name", "desired_country_text", mode="after")
    @classmethod
    def strip_required_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if not stripped:
            raise ValueError("value must not be blank")
        return stripped

    @field_validator("gender_self_description", "occupation", "message")
    @classmethod
    def strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip() or None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr | None) -> str | None:
        return str(value).strip().casefold() if value is not None else None

    @model_validator(mode="after")
    def validate_patch(self) -> LeadUpdate:
        if not self.model_fields_set:
            raise ValueError("At least one editable field is required")
        for field in ("first_name", "last_name", "mobile", "intake_term", "start_year", "locale"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        year = datetime.now(UTC).year
        if self.start_year is not None and not year <= self.start_year <= year + 10:
            raise ValueError(f"startYear must be between {year} and {year + 10}")
        country_fields = {"desired_country_id", "desired_country_text"} & self.model_fields_set
        if country_fields:
            if (self.desired_country_id is None) == (self.desired_country_text is None):
                raise ValueError("Provide exactly one desired country ID or text value")
        return self


class LeadArchiveRequest(ApiModel):
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        stripped = value.strip()
        if len(stripped) < 3:
            raise ValueError("reason must contain at least three characters")
        return stripped


class LeadAssignmentRequest(ApiModel):
    consultant_id: UUID
    reason: str | None = Field(default=None, min_length=3, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if len(stripped) < 3:
            raise ValueError("reason must contain at least three characters")
        return stripped


class LeadStatusTransitionRequest(ApiModel):
    to_status: LeadStatus
    reason: str | None = Field(default=None, min_length=3, max_length=500)

    @field_validator("to_status", mode="before")
    @classmethod
    def normalize_status_case(cls, value: object) -> object:
        return value.casefold() if isinstance(value, str) else value

    @field_validator("reason")
    @classmethod
    def strip_transition_reason(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        if len(stripped) < 3:
            raise ValueError("reason must contain at least three characters")
        return stripped


class LeadAssignee(ApiModel):
    id: UUID
    first_name: str | None = None
    last_name: str | None = None
    email: str | None = None


class LeadSummary(ApiModel):
    id: UUID
    reference: str
    first_name: str
    last_name: str
    mobile: str
    email: str | None = None
    desired_country_id: UUID | None = None
    desired_country_name: str | None = None
    desired_country_text: str | None = None
    intake_term: IntakeTerm | None = None
    start_year: int | None = None
    status: LeadStatus
    sync_status: SyncStatus
    assignee: LeadAssignee | None = None
    archived: bool
    version: int
    created_at: datetime
    updated_at: datetime
    age: int | None = None
    gender: GenderCode | None = None
    gender_self_description: str | None = None
    occupation: str | None = None
    marital_status: MaritalStatusCode | None = None
    investment_range_code: str | None = None
    investment_currency: str | None = None
    message: str | None = None


class LeadDetail(LeadSummary):
    mobile_raw: str
    locale: str
    source_url: str | None = None
    source_university_id: UUID | None = None
    source_program_id: UUID | None = None
    duplicate_count: int
    last_duplicate_at: datetime | None = None
    sync_external_id: str | None = None
    sync_attempt_count: int
    sync_last_attempt_at: datetime | None = None
    sync_synced_at: datetime | None = None
    archived_at: datetime | None = None
    archived_by_user_id: UUID | None = None
    archive_reason: str | None = None


class LeadEnvelope(ApiModel):
    data: LeadDetail


class LeadAssignmentHistoryItem(ApiModel):
    id: UUID
    consultant_id: UUID
    assigned_by_user_id: UUID | None = None
    assigned_at: datetime
    unassigned_at: datetime | None = None
    ended_by_user_id: UUID | None = None
    reason: str | None = None


class LeadStatusHistoryItem(ApiModel):
    id: UUID
    old_status: LeadStatus | None = None
    new_status: LeadStatus
    actor_user_id: UUID | None = None
    reason: str | None = None
    created_at: datetime


class LeadHistory(ApiModel):
    assignments: list[LeadAssignmentHistoryItem]
    statuses: list[LeadStatusHistoryItem]


class LeadHistoryEnvelope(ApiModel):
    data: LeadHistory


class LeadPageMeta(ApiModel):
    page: int
    limit: int
    total: int
    total_pages: int


class LeadPage(ApiModel):
    data: list[LeadSummary]
    meta: LeadPageMeta
