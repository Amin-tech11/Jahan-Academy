from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ApiModel(BaseModel):
    model_config = ConfigDict(
        alias_generator=_to_camel,
        populate_by_name=True,
        extra="forbid",
    )


class TranslationWrite(ApiModel):
    name: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return value.strip()


class LocalizedWrite(ApiModel):
    translations: dict[Literal["fa", "en"], TranslationWrite]

    @model_validator(mode="after")
    def require_complete_translations(self) -> LocalizedWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("Both fa and en translations are required")
        return self


class CountryWrite(LocalizedWrite):
    iso2: str = Field(pattern=r"^[A-Za-z]{2}$")
    iso3: str | None = Field(default=None, pattern=r"^[A-Za-z]{3}$")
    slug: str = Field(min_length=2, max_length=120, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    status: Literal["draft", "published", "archived"] = "draft"
    featured: bool = False
    display_order: int = Field(default=0, ge=0, le=1_000_000)

    @model_validator(mode="after")
    def normalize_country_codes(self) -> CountryWrite:
        self.iso2 = self.iso2.upper()
        if self.iso3:
            self.iso3 = self.iso3.upper()
        return self


class CityWrite(LocalizedWrite):
    country_id: UUID
    slug: str = Field(min_length=1, max_length=160, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    active: bool = True
    display_order: int = Field(default=0, ge=0, le=1_000_000)


class AcademicLevelWrite(LocalizedWrite):
    code: str = Field(min_length=2, max_length=40, pattern=r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
    active: bool = True
    display_order: int = Field(default=0, ge=0, le=1_000_000)


class FieldOfStudyWrite(LocalizedWrite):
    code: str = Field(min_length=2, max_length=80, pattern=r"^[a-z0-9]+(?:_[a-z0-9]+)*$")
    slug: str = Field(min_length=2, max_length=160, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    parent_id: UUID | None = None
    active: bool = True
    display_order: int = Field(default=0, ge=0, le=1_000_000)


class IntakeWrite(LocalizedWrite):
    code: Literal["spring", "summer", "fall", "winter", "unknown"]
    active: bool = True
    display_order: int = Field(default=0, ge=0, le=1_000_000)


class CurrencyWrite(LocalizedWrite):
    code: str = Field(pattern=r"^[A-Za-z]{3}$")
    numeric_code: str | None = Field(default=None, pattern=r"^\d{3}$")
    symbol: str = Field(min_length=1, max_length=12)
    decimal_places: int = Field(default=2, ge=0, le=4)
    active: bool = True
    display_order: int = Field(default=0, ge=0, le=1_000_000)

    @model_validator(mode="after")
    def normalize_currency_code(self) -> CurrencyWrite:
        self.code = self.code.upper()
        return self


class TranslationView(ApiModel):
    name: str
    description: str | None = None


class ReferenceItemView(ApiModel):
    id: UUID
    type: str
    code: str
    name: str
    description: str | None = None
    active: bool
    display_order: int
    version: int
    slug: str | None = None
    country_id: UUID | None = None
    parent_id: UUID | None = None
    iso2: str | None = None
    iso3: str | None = None
    status: str | None = None
    featured: bool | None = None
    numeric_code: str | None = None
    symbol: str | None = None
    decimal_places: int | None = None
    translations: dict[str, TranslationView] | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class ReferenceItemEnvelope(ApiModel):
    data: ReferenceItemView


class ReferencePage(ApiModel):
    data: list[ReferenceItemView]
    page: int
    limit: int
    total: int
