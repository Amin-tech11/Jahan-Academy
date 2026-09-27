from __future__ import annotations

from datetime import datetime
from typing import Literal
from urllib.parse import urlsplit
from uuid import UUID

import nh3
from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator, model_validator

from app.modules.experience.domain import ExperienceStatus, PublicPageKind


def _camel(value: str) -> str:
    head, *tail = value.split("_")
    return head + "".join(part.title() for part in tail)


class ExperienceModel(BaseModel):
    model_config = ConfigDict(alias_generator=_camel, populate_by_name=True, extra="forbid")


def _safe_html(value: str) -> str:
    sanitized = nh3.clean(
        value.strip(),
        tags={
            "p",
            "br",
            "h2",
            "h3",
            "h4",
            "strong",
            "em",
            "u",
            "s",
            "blockquote",
            "ul",
            "ol",
            "li",
            "a",
            "code",
            "pre",
            "hr",
        },
        attributes={"a": {"href", "title", "target"}},
        url_schemes={"http", "https", "mailto"},
        link_rel="noopener noreferrer nofollow",
    )
    if not sanitized.strip():
        raise ValueError("content must contain safe text")
    return sanitized


class PageBlock(ExperienceModel):
    type: Literal[
        "hero",
        "benefits",
        "trust",
        "destinations",
        "universities",
        "articles",
        "faqs",
        "cta",
        "rich_text",
    ]
    title: str | None = Field(default=None, max_length=260)
    body: str | None = Field(default=None, max_length=50_000)
    item_ids: list[UUID] = Field(default_factory=list, max_length=24)
    cta_label: str | None = Field(default=None, max_length=120)
    cta_href: str | None = Field(default=None, max_length=300)

    @field_validator("body")
    @classmethod
    def sanitize_body(cls, value: str | None) -> str | None:
        return _safe_html(value) if value is not None else None

    @field_validator("cta_href")
    @classmethod
    def validate_cta_href(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        parsed = urlsplit(normalized)
        if normalized.startswith("/") and not normalized.startswith("//"):
            return normalized
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            return normalized
        raise ValueError("ctaHref must be a same-site path or an HTTP(S) URL")


class PageTranslationWrite(ExperienceModel):
    title: str = Field(min_length=1, max_length=260)
    summary: str | None = Field(default=None, max_length=1200)
    body: str | None = Field(default=None, max_length=100_000)
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    blocks: list[PageBlock] = Field(default_factory=list, max_length=30)

    @field_validator("body")
    @classmethod
    def sanitize_body(cls, value: str | None) -> str | None:
        return _safe_html(value) if value is not None else None


class PublicPageWrite(ExperienceModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=180)
    page_kind: PublicPageKind
    display_order: int = Field(default=0, ge=0, le=100_000)
    translations: dict[Literal["fa", "en"], PageTranslationWrite]

    @model_validator(mode="after")
    def bilingual(self) -> PublicPageWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("translations must contain exactly fa and en")
        if self.page_kind is PublicPageKind.HOME and self.slug != "home":
            raise ValueError("the home page slug must be home")
        return self


class GuideFact(ExperienceModel):
    label: str = Field(min_length=1, max_length=120)
    value: str = Field(min_length=1, max_length=500)


class GuideSection(ExperienceModel):
    title: str = Field(min_length=1, max_length=260)
    body: str = Field(min_length=1, max_length=50_000)

    @field_validator("body")
    @classmethod
    def sanitize_body(cls, value: str) -> str:
        return _safe_html(value)


class GuideSource(ExperienceModel):
    label: str = Field(min_length=1, max_length=200)
    url: HttpUrl


class CountryGuideTranslationWrite(ExperienceModel):
    title: str = Field(min_length=1, max_length=260)
    summary: str = Field(min_length=1, max_length=1200)
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)
    facts: list[GuideFact] = Field(default_factory=list, max_length=24)
    sections: list[GuideSection] = Field(default_factory=list, max_length=24)
    sources: list[GuideSource] = Field(default_factory=list, max_length=30)


class CountryGuideWrite(ExperienceModel):
    country_id: UUID
    translations: dict[Literal["fa", "en"], CountryGuideTranslationWrite]

    @model_validator(mode="after")
    def bilingual(self) -> CountryGuideWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("translations must contain exactly fa and en")
        return self


class ArchiveExperienceRequest(ExperienceModel):
    reason: str = Field(min_length=3, max_length=500)


class PageTranslationView(ExperienceModel):
    title: str
    summary: str | None = None
    body: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    blocks: list[PageBlock]


class PublicPageView(ExperienceModel):
    id: UUID
    slug: str
    page_kind: PublicPageKind
    display_order: int
    status: ExperienceStatus
    title: str
    summary: str | None = None
    body: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    blocks: list[PageBlock]
    translations: dict[str, PageTranslationView] | None = None
    published_at: datetime | None = None
    archived_at: datetime | None = None
    archive_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class CountryGuideView(ExperienceModel):
    id: UUID
    country_id: UUID
    country_slug: str
    country_name: str
    status: ExperienceStatus
    title: str
    summary: str
    seo_title: str | None = None
    seo_description: str | None = None
    facts: list[GuideFact]
    sections: list[GuideSection]
    sources: list[GuideSource]
    translations: dict[str, CountryGuideTranslationWrite] | None = None
    published_at: datetime | None = None
    archived_at: datetime | None = None
    archive_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class PageEnvelope(ExperienceModel):
    data: PublicPageView


class PublicPageList(ExperienceModel):
    data: list[PublicPageView]


class CountryGuideEnvelope(ExperienceModel):
    data: CountryGuideView


class CountryGuidePage(ExperienceModel):
    data: list[CountryGuideView]
