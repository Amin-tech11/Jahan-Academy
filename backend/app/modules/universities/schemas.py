from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.universities.domain import (
    InstitutionType,
    TuitionMode,
    UniversityMediaRole,
    UniversityStatus,
)


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class UniversityModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, extra="forbid")


class UniversityTranslationWrite(UniversityModel):
    name: str = Field(min_length=1, max_length=240)
    short_description: str | None = Field(default=None, max_length=1000)
    body: str | None = Field(default=None, max_length=100_000)
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        if not (value := value.strip()):
            raise ValueError("name must not be blank")
        return value

    @field_validator("short_description", "body", "seo_title", "seo_description")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class TuitionWrite(UniversityModel):
    mode: TuitionMode = TuitionMode.CONTACT
    minimum_minor: int | None = Field(default=None, ge=0)
    maximum_minor: int | None = Field(default=None, ge=0)
    currency: str | None = Field(default=None, pattern=r"^[A-Za-z]{3}$")

    @model_validator(mode="after")
    def validate_values(self) -> TuitionWrite:
        if self.currency:
            self.currency = self.currency.upper()
        if self.mode is TuitionMode.CONTACT:
            if any(v is not None for v in (self.minimum_minor, self.maximum_minor, self.currency)):
                raise ValueError("contact tuition must not include amounts or currency")
        elif self.mode is TuitionMode.EXACT:
            if (
                self.minimum_minor is None
                or self.currency is None
                or self.maximum_minor is not None
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


class RankingWrite(UniversityModel):
    organization: str = Field(min_length=1, max_length=120)
    year: int = Field(ge=1900, le=2200)
    rank: int | None = Field(default=None, gt=0)
    band: str | None = Field(default=None, max_length=60)
    source_url: str | None = Field(default=None, max_length=2000)

    @field_validator("organization")
    @classmethod
    def strip_organization(cls, value: str) -> str:
        return value.strip()

    @model_validator(mode="after")
    def require_rank_or_band(self) -> RankingWrite:
        if self.rank is None and not (self.band and self.band.strip()):
            raise ValueError("rank or band is required")
        self.band = self.band.strip() or None if self.band is not None else None
        return self


class UniversityMediaWrite(UniversityModel):
    media_asset_id: UUID
    role: UniversityMediaRole
    display_order: int = Field(default=0, ge=0, le=10_000)


class UniversityWrite(UniversityModel):
    slug: str = Field(min_length=2, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    country_id: UUID
    city_id: UUID | None = None
    institution_type: InstitutionType | None = None
    founded_year: int | None = Field(default=None, ge=1000, le=2200)
    website_url: str | None = Field(default=None, max_length=2000)
    contact_email: str | None = Field(default=None, max_length=320)
    contact_phone: str | None = Field(default=None, max_length=40)
    featured: bool = False
    tuition: TuitionWrite = Field(default_factory=TuitionWrite)
    translations: dict[Literal["fa", "en"], UniversityTranslationWrite]
    rankings: list[RankingWrite] = Field(default_factory=list, max_length=30)
    media: list[UniversityMediaWrite] = Field(default_factory=list, max_length=22)

    @field_validator("website_url")
    @classmethod
    def validate_url(cls, value: str | None) -> str | None:
        value = value.strip() or None if value is not None else None
        if value and not value.casefold().startswith(("https://", "http://")):
            raise ValueError("URL must use http or https")
        return value

    @field_validator("contact_email")
    @classmethod
    def normalize_email(cls, value: str | None) -> str | None:
        value = value.strip().casefold() or None if value is not None else None
        if value and ("@" not in value or value.startswith("@") or value.endswith("@")):
            raise ValueError("invalid email address")
        return value

    @field_validator("contact_phone")
    @classmethod
    def normalize_phone(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None

    @model_validator(mode="after")
    def validate_collections(self) -> UniversityWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("Both fa and en translations are required")
        ranking_keys = [(item.organization.casefold(), item.year) for item in self.rankings]
        if len(ranking_keys) != len(set(ranking_keys)):
            raise ValueError("ranking organization and year must be unique")
        media_keys = [(item.media_asset_id, item.role) for item in self.media]
        if len(media_keys) != len(set(media_keys)):
            raise ValueError("media asset and role must be unique")
        for role in (UniversityMediaRole.LOGO, UniversityMediaRole.HERO):
            if sum(item.role is role for item in self.media) > 1:
                raise ValueError(f"only one {role.value} image is allowed")
        if sum(item.role is UniversityMediaRole.GALLERY for item in self.media) > 20:
            raise ValueError("at most 20 gallery images are allowed")
        return self


class ArchiveUniversityRequest(UniversityModel):
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()


class ReferenceSummary(UniversityModel):
    id: UUID
    name: str


class UniversityTranslationView(UniversityModel):
    name: str
    short_description: str | None = None
    body: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None


class TuitionView(UniversityModel):
    mode: TuitionMode
    minimum_minor: int | None = None
    maximum_minor: int | None = None
    currency: str | None = None


class RankingView(UniversityModel):
    id: UUID
    organization: str
    year: int
    rank: int | None = None
    band: str | None = None
    source_url: str | None = None


class UniversityMediaView(UniversityModel):
    media_asset_id: UUID
    role: UniversityMediaRole
    display_order: int
    mime_type: str
    width: int | None = None
    height: int | None = None
    alt_fa: str | None = None
    alt_en: str | None = None
    public_url: str


class UniversityView(UniversityModel):
    id: UUID
    slug: str
    name: str
    short_description: str | None = None
    body: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    country: ReferenceSummary
    city: ReferenceSummary | None = None
    institution_type: InstitutionType | None = None
    founded_year: int | None = None
    website_url: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    status: UniversityStatus
    featured: bool
    tuition: TuitionView
    rankings: list[RankingView]
    media: list[UniversityMediaView]
    translations: dict[str, UniversityTranslationView] | None = None
    published_at: datetime | None = None
    archived_at: datetime | None = None
    archived_by_user_id: UUID | None = None
    archive_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class UniversityEnvelope(UniversityModel):
    data: UniversityView


class UniversityPageMeta(UniversityModel):
    page: int
    limit: int
    total: int
    total_pages: int


class UniversityPage(UniversityModel):
    data: list[UniversityView]
    meta: UniversityPageMeta
