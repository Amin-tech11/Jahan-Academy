from __future__ import annotations

from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.programs.domain import (
    ApplicationFeeMode,
    DurationUnit,
    IntakeStatus,
    MoneyMode,
    ProgramStatus,
)


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ProgramModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, extra="forbid")


class ProgramTranslationWrite(ProgramModel):
    title: str = Field(min_length=1, max_length=260)
    short_description: str | None = Field(default=None, max_length=1000)
    body: str | None = Field(default=None, max_length=100_000)
    admission_requirements: str | None = Field(default=None, max_length=50_000)
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        if not (value := value.strip()):
            raise ValueError("title must not be blank")
        return value

    @field_validator(
        "short_description", "body", "admission_requirements", "seo_title", "seo_description"
    )
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class TuitionWrite(ProgramModel):
    mode: MoneyMode = MoneyMode.CONTACT
    minimum_minor: int | None = Field(default=None, ge=0)
    maximum_minor: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Za-z]{3}$")

    @model_validator(mode="after")
    def validate_values(self) -> TuitionWrite:
        if self.currency:
            self.currency = self.currency.upper()
        if self.mode is MoneyMode.CONTACT:
            if any(v is not None for v in (self.minimum_minor, self.maximum_minor, self.currency)):
                raise ValueError("contact tuition must not include amounts or currency")
        elif self.mode is MoneyMode.EXACT:
            if (
                self.minimum_minor is None
                or self.maximum_minor is not None
                or self.currency is None
            ):
                raise ValueError("exact tuition requires minimumMinor and currency only")
        elif (
            self.minimum_minor is None
            or self.maximum_minor is None
            or self.currency is None
            or self.maximum_minor < self.minimum_minor
        ):
            raise ValueError("range tuition requires a valid minimum, maximum, and currency")
        return self


class ApplicationFeeWrite(ProgramModel):
    mode: ApplicationFeeMode = ApplicationFeeMode.CONTACT
    amount_minor: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Za-z]{3}$")

    @model_validator(mode="after")
    def validate_values(self) -> ApplicationFeeWrite:
        if self.currency:
            self.currency = self.currency.upper()
        if self.mode is ApplicationFeeMode.EXACT:
            if self.amount_minor is None or self.currency is None:
                raise ValueError("exact application fee requires amountMinor and currency")
        elif self.amount_minor is not None or self.currency is not None:
            raise ValueError("free/contact application fee must not include amount or currency")
        return self


class ProgramIntakeWrite(ProgramModel):
    intake_id: UUID
    year: int = Field(ge=2020, le=2200)
    application_deadline: date
    status: IntakeStatus = IntakeStatus.PLANNED
    notes_fa: str | None = Field(default=None, max_length=5000)
    notes_en: str | None = Field(default=None, max_length=5000)


class ProgramRequirementWrite(ProgramModel):
    requirement_type: str = Field(min_length=1, max_length=40, pattern=r"^[a-z0-9_]+$")
    code: str | None = Field(default=None, max_length=80, pattern=r"^[A-Za-z0-9_.-]+$")
    required: bool = True
    value: dict[str, Any] = Field(default_factory=dict)
    description_fa: str | None = Field(default=None, max_length=5000)
    description_en: str | None = Field(default=None, max_length=5000)
    display_order: int = Field(default=0, ge=0, le=10_000)


class ProgramWrite(ProgramModel):
    university_id: UUID
    academic_level_id: UUID
    primary_field_id: UUID
    field_ids: list[UUID] = Field(min_length=1, max_length=20)
    slug: str = Field(min_length=2, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    duration_value: float | None = Field(default=None, gt=0, le=1000)
    duration_unit: DurationUnit | None = None
    tuition: TuitionWrite = Field(default_factory=TuitionWrite)
    application_fee: ApplicationFeeWrite = Field(default_factory=ApplicationFeeWrite)
    teaching_language_code: str | None = Field(
        default=None, min_length=2, max_length=20, pattern=r"^[A-Za-z-]+$"
    )
    official_url: str | None = Field(default=None, max_length=2000)
    featured: bool = False
    translations: dict[Literal["fa", "en"], ProgramTranslationWrite]
    intakes: list[ProgramIntakeWrite] = Field(default_factory=list, max_length=30)
    requirements: list[ProgramRequirementWrite] = Field(default_factory=list, max_length=100)

    @field_validator("official_url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        value = value.strip() or None if value is not None else None
        if value and not value.casefold().startswith(("https://", "http://")):
            raise ValueError("officialUrl must use http or https")
        return value

    @field_validator("teaching_language_code")
    @classmethod
    def normalize_language(cls, value: str | None) -> str | None:
        return value.strip().casefold() or None if value is not None else None

    @model_validator(mode="after")
    def validate_relations(self) -> ProgramWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("Both fa and en translations are required")
        if (self.duration_value is None) != (self.duration_unit is None):
            raise ValueError("durationValue and durationUnit must be supplied together")
        if len(self.field_ids) != len(set(self.field_ids)):
            raise ValueError("fieldIds must be unique")
        if self.primary_field_id not in self.field_ids:
            raise ValueError("primaryFieldId must be included in fieldIds")
        intake_keys = [(item.intake_id, item.year) for item in self.intakes]
        if len(intake_keys) != len(set(intake_keys)):
            raise ValueError("intake and year must be unique")
        return self


class ArchiveProgramRequest(ProgramModel):
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()


class ReferenceSummary(ProgramModel):
    id: UUID
    name: str
    code: str | None = None


class UniversitySummary(ProgramModel):
    id: UUID
    slug: str
    name: str


class ProgramTranslationView(ProgramTranslationWrite):
    pass


class TuitionView(ProgramModel):
    mode: MoneyMode
    minimum_minor: int | None = None
    maximum_minor: int | None = None
    currency: str | None = None


class ApplicationFeeView(ProgramModel):
    mode: ApplicationFeeMode
    amount_minor: int | None = None
    currency: str | None = None


class ProgramIntakeView(ProgramModel):
    id: UUID
    intake: ReferenceSummary
    year: int
    application_deadline: date
    status: IntakeStatus
    notes_fa: str | None = None
    notes_en: str | None = None


class ProgramRequirementView(ProgramRequirementWrite):
    id: UUID


class ProgramView(ProgramModel):
    id: UUID
    slug: str
    title: str
    short_description: str | None = None
    body: str | None = None
    admission_requirements: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    university: UniversitySummary
    academic_level: ReferenceSummary
    primary_field: ReferenceSummary
    fields: list[ReferenceSummary]
    duration_value: float | None = None
    duration_unit: DurationUnit | None = None
    tuition: TuitionView
    application_fee: ApplicationFeeView
    teaching_language_code: str | None = None
    official_url: str | None = None
    status: ProgramStatus
    featured: bool
    intakes: list[ProgramIntakeView]
    requirements: list[ProgramRequirementView]
    translations: dict[str, ProgramTranslationView] | None = None
    published_at: datetime | None = None
    archived_at: datetime | None = None
    archived_by_user_id: UUID | None = None
    archive_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class ProgramEnvelope(ProgramModel):
    data: ProgramView


class ProgramPageMeta(ProgramModel):
    page: int
    limit: int
    total: int
    total_pages: int


class ProgramPage(ProgramModel):
    data: list[ProgramView]
    meta: ProgramPageMeta
