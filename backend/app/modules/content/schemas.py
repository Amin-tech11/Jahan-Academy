from __future__ import annotations

from datetime import datetime
from uuid import UUID

import nh3
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.modules.content.domain import (
    ArticleSort,
    ArticleType,
    ContentResource,
    ContentStatus,
    FaqSort,
    FaqTargetType,
)


def _to_camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class ContentModel(BaseModel):
    model_config = ConfigDict(alias_generator=_to_camel, populate_by_name=True, extra="forbid")


class NameTranslationWrite(ContentModel):
    name: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=10_000)
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("description", "seo_title", "seo_description")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class AuthorTranslationWrite(ContentModel):
    name: str = Field(min_length=1, max_length=180)
    title: str | None = Field(default=None, max_length=180)
    biography: str | None = Field(default=None, max_length=20_000)

    @field_validator("name")
    @classmethod
    def strip_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("title", "biography")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class ContentReferenceWrite(ContentModel):
    resource: ContentResource
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=160)
    display_order: int = Field(default=0, ge=0, le=100_000)
    user_id: UUID | None = None
    avatar_media_id: UUID | None = None
    translations: dict[str, NameTranslationWrite | AuthorTranslationWrite]

    @model_validator(mode="after")
    def validate_shape(self) -> ContentReferenceWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("translations must contain exactly fa and en")
        if self.resource is ContentResource.AUTHOR:
            if not all(
                isinstance(item, AuthorTranslationWrite) for item in self.translations.values()
            ):
                raise ValueError("author translations require name, title, and biography fields")
        else:
            if self.user_id or self.avatar_media_id:
                raise ValueError("userId and avatarMediaId are valid only for authors")
            if not all(
                isinstance(item, NameTranslationWrite) for item in self.translations.values()
            ):
                raise ValueError(
                    "category and tag translations require name and description fields"
                )
        return self


class ArticleTranslationWrite(ContentModel):
    title: str = Field(min_length=1, max_length=260)
    excerpt: str | None = Field(default=None, max_length=1200)
    body: str = Field(min_length=1, max_length=500_000)
    seo_title: str | None = Field(default=None, max_length=180)
    seo_description: str | None = Field(default=None, max_length=320)

    @field_validator("title")
    @classmethod
    def strip_required(cls, value: str) -> str:
        return value.strip()

    @field_validator("body")
    @classmethod
    def sanitize_body(cls, value: str) -> str:
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
            raise ValueError("body must contain safe content")
        return sanitized

    @field_validator("excerpt", "seo_title", "seo_description")
    @classmethod
    def strip_optional(cls, value: str | None) -> str | None:
        return value.strip() or None if value is not None else None


class ArticleWrite(ContentModel):
    slug: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=200)
    article_type: ArticleType = ArticleType.ARTICLE
    author_id: UUID | None = None
    featured_media_id: UUID | None = None
    category_ids: list[UUID] = Field(default_factory=list, max_length=10)
    primary_category_id: UUID | None = None
    tag_ids: list[UUID] = Field(default_factory=list, max_length=30)
    featured: bool = False
    translations: dict[str, ArticleTranslationWrite]

    @model_validator(mode="after")
    def validate_relations(self) -> ArticleWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("translations must contain exactly fa and en")
        if len(self.category_ids) != len(set(self.category_ids)):
            raise ValueError("categoryIds must be unique")
        if len(self.tag_ids) != len(set(self.tag_ids)):
            raise ValueError("tagIds must be unique")
        if self.primary_category_id and self.primary_category_id not in self.category_ids:
            raise ValueError("primaryCategoryId must be included in categoryIds")
        return self


class FaqTranslationWrite(ContentModel):
    question: str = Field(min_length=3, max_length=500)
    answer: str = Field(min_length=3, max_length=50_000)

    @field_validator("question")
    @classmethod
    def strip_question(cls, value: str) -> str:
        normalized = value.strip()
        if len(normalized) < 3:
            raise ValueError("question must contain at least three non-whitespace characters")
        return normalized

    @field_validator("answer")
    @classmethod
    def sanitize_answer(cls, value: str) -> str:
        sanitized = nh3.clean(
            value.strip(),
            tags={
                "p",
                "br",
                "strong",
                "em",
                "u",
                "ul",
                "ol",
                "li",
                "a",
                "code",
            },
            attributes={"a": {"href", "title", "target"}},
            url_schemes={"http", "https", "mailto"},
            link_rel="noopener noreferrer nofollow",
        )
        if not sanitized.strip():
            raise ValueError("answer must contain safe content")
        return sanitized


class FaqAssignmentWrite(ContentModel):
    target_type: FaqTargetType
    target_id: UUID | None = None
    display_order: int = Field(default=0, ge=0, le=100_000)

    @model_validator(mode="after")
    def validate_target(self) -> FaqAssignmentWrite:
        if self.target_type is FaqTargetType.GENERAL and self.target_id is not None:
            raise ValueError("targetId must be omitted for general FAQs")
        if self.target_type is not FaqTargetType.GENERAL and self.target_id is None:
            raise ValueError("targetId is required for scoped FAQs")
        return self


class FaqWrite(ContentModel):
    translations: dict[str, FaqTranslationWrite]
    assignments: list[FaqAssignmentWrite] = Field(min_length=1, max_length=50)

    @model_validator(mode="after")
    def validate_faq(self) -> FaqWrite:
        if set(self.translations) != {"fa", "en"}:
            raise ValueError("translations must contain exactly fa and en")
        targets = [(item.target_type, item.target_id) for item in self.assignments]
        if len(targets) != len(set(targets)):
            raise ValueError("assignments must target unique resources")
        return self


class FaqOrderItem(ContentModel):
    faq_id: UUID
    display_order: int = Field(ge=0, le=100_000)


class FaqReorderRequest(ContentModel):
    target_type: FaqTargetType
    target_id: UUID | None = None
    items: list[FaqOrderItem] = Field(min_length=1, max_length=500)

    @model_validator(mode="after")
    def validate_order(self) -> FaqReorderRequest:
        FaqAssignmentWrite(
            target_type=self.target_type,
            target_id=self.target_id,
            display_order=0,
        )
        faq_ids = [item.faq_id for item in self.items]
        if len(faq_ids) != len(set(faq_ids)):
            raise ValueError("items must contain unique faqIds")
        orders = [item.display_order for item in self.items]
        if len(orders) != len(set(orders)):
            raise ValueError("items must contain unique displayOrder values")
        return self


class ArchiveContentRequest(ContentModel):
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("reason")
    @classmethod
    def strip_reason(cls, value: str) -> str:
        return value.strip()


class PublishArticleRequest(ContentModel):
    published_at: datetime | None = None

    @field_validator("published_at")
    @classmethod
    def require_timezone(cls, value: datetime | None) -> datetime | None:
        if value is not None and value.tzinfo is None:
            raise ValueError("publishedAt must include a timezone offset")
        return value


class ReferenceSummary(ContentModel):
    id: UUID
    slug: str
    name: str


class ContentReferenceView(ContentModel):
    id: UUID
    resource: ContentResource
    slug: str
    name: str
    description: str | None = None
    title: str | None = None
    biography: str | None = None
    display_order: int = 0
    user_id: UUID | None = None
    avatar_media_id: UUID | None = None
    status: ContentStatus
    translations: dict[str, NameTranslationWrite | AuthorTranslationWrite] | None = None
    published_at: datetime | None = None
    archived_at: datetime | None = None
    archive_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class ArticleView(ContentModel):
    id: UUID
    slug: str
    article_type: ArticleType
    title: str
    excerpt: str | None = None
    body: str
    seo_title: str | None = None
    seo_description: str | None = None
    author: ReferenceSummary | None = None
    featured_media_id: UUID | None = None
    categories: list[ReferenceSummary]
    primary_category_id: UUID | None = None
    tags: list[ReferenceSummary]
    status: ContentStatus
    featured: bool
    translations: dict[str, ArticleTranslationWrite] | None = None
    published_at: datetime | None = None
    archived_at: datetime | None = None
    archive_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class FaqAssignmentView(ContentModel):
    target_type: FaqTargetType
    target_id: UUID | None = None
    display_order: int


class FaqView(ContentModel):
    id: UUID
    question: str
    answer: str
    assignments: list[FaqAssignmentView]
    status: ContentStatus
    translations: dict[str, FaqTranslationWrite] | None = None
    published_at: datetime | None = None
    archived_at: datetime | None = None
    archive_reason: str | None = None
    created_at: datetime
    updated_at: datetime
    version: int


class ContentEnvelope(ContentModel):
    data: ContentReferenceView


class ArticleEnvelope(ContentModel):
    data: ArticleView


class FaqEnvelope(ContentModel):
    data: FaqView


class PageMeta(ContentModel):
    page: int
    limit: int
    total: int
    total_pages: int


class ContentReferencePage(ContentModel):
    data: list[ContentReferenceView]
    meta: PageMeta


class ArticlePage(ContentModel):
    data: list[ArticleView]
    meta: PageMeta


class FaqPage(ContentModel):
    data: list[FaqView]
    meta: PageMeta


class FaqListFilters(ContentModel):
    locale: str = Field(pattern=r"^(fa|en)$")
    page: int = Field(ge=1)
    limit: int = Field(ge=1, le=100)
    query: str | None = Field(default=None, min_length=2, max_length=100)
    target_type: FaqTargetType | None = None
    target_id: UUID | None = None
    status: ContentStatus | None = None
    sort: FaqSort
    public_only: bool

    @model_validator(mode="after")
    def validate_target_filter(self) -> FaqListFilters:
        if self.target_type is FaqTargetType.GENERAL and self.target_id is not None:
            raise ValueError("targetId must be omitted for general FAQs")
        if self.target_id is not None and self.target_type is None:
            raise ValueError("targetType is required when targetId is provided")
        if (
            self.public_only
            and self.target_type is not None
            and self.target_type is not FaqTargetType.GENERAL
            and self.target_id is None
        ):
            raise ValueError("targetId is required for scoped public FAQs")
        return self


class ArticleListFilters(ContentModel):
    locale: str = Field(pattern=r"^(fa|en)$")
    page: int = Field(ge=1)
    limit: int = Field(ge=1, le=100)
    query: str | None = Field(default=None, min_length=2, max_length=100)
    article_type: ArticleType | None = None
    category_id: UUID | None = None
    tag_id: UUID | None = None
    author_id: UUID | None = None
    status: ContentStatus | None = None
    featured: bool | None = None
    sort: ArticleSort
