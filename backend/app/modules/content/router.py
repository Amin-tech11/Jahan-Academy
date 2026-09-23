from __future__ import annotations

from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.content.domain import ArticleSort, ArticleType, ContentResource, ContentStatus
from app.modules.content.repository import ContentRepository
from app.modules.content.schemas import (
    ArchiveContentRequest,
    ArticleEnvelope,
    ArticlePage,
    ArticleWrite,
    ContentEnvelope,
    ContentReferencePage,
    ContentReferenceWrite,
    PublishArticleRequest,
)
from app.modules.content.service import ContentService
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.shared.exceptions import ApplicationError

router = APIRouter(tags=["content"])
public_reference_router = APIRouter(prefix="/content")
public_article_router = APIRouter(prefix="/articles")
admin_reference_router = APIRouter(prefix="/admin/content", tags=["content-administration"])
admin_article_router = APIRouter(prefix="/admin/articles", tags=["content-administration"])
ReferencePath = Literal["categories", "tags", "authors"]


def content_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> ContentService:
    return ContentService(ContentRepository(session))


@public_reference_router.get(
    "/{resource}", response_model=ContentReferencePage, response_model_exclude_none=True
)
async def list_public_references(
    resource: ReferencePath,
    service: Annotated[ContentService, Depends(content_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=20)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
) -> ContentReferencePage:
    return await service.list_references(
        resource=_resource(resource),
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        public_only=True,
        status=None,
    )


@public_reference_router.get(
    "/{resource}/{slug}", response_model=ContentEnvelope, response_model_exclude_none=True
)
async def get_public_reference(
    resource: ReferencePath,
    slug: str,
    service: Annotated[ContentService, Depends(content_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ContentEnvelope:
    return ContentEnvelope(data=await service.get_reference(_resource(resource), slug, locale))


@public_article_router.get(
    "",
    response_model=ArticlePage,
    response_model_exclude_none=True,
    summary="Discover published content",
)
async def list_public_articles(
    service: Annotated[ContentService, Depends(content_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=20)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    article_type: Annotated[ArticleType | None, Query(alias="type")] = None,
    category_id: Annotated[UUID | None, Query(alias="categoryId")] = None,
    tag_id: Annotated[UUID | None, Query(alias="tagId")] = None,
    author_id: Annotated[UUID | None, Query(alias="authorId")] = None,
    featured: bool | None = None,
    sort: ArticleSort = ArticleSort.NEWEST,
) -> ArticlePage:
    return await service.list_articles(
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        article_type=article_type.value if article_type else None,
        category_id=category_id,
        tag_id=tag_id,
        author_id=author_id,
        status=None,
        featured=featured,
        sort=sort,
        public_only=True,
    )


@public_article_router.get(
    "/{slug}", response_model=ArticleEnvelope, response_model_exclude_none=True
)
async def get_public_article(
    slug: str,
    service: Annotated[ContentService, Depends(content_service)],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ArticleEnvelope:
    return ArticleEnvelope(data=await service.get_article_public(slug, locale))


@admin_reference_router.get("/{resource}", response_model=ContentReferencePage)
async def list_admin_references(
    resource: ReferencePath,
    service: Annotated[ContentService, Depends(content_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    content_status: Annotated[ContentStatus | None, Query(alias="status")] = None,
) -> ContentReferencePage:
    return await service.list_references(
        resource=_resource(resource),
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        public_only=False,
        status=content_status.value if content_status else None,
    )


@admin_reference_router.post(
    "/{resource}", response_model=ContentEnvelope, status_code=status.HTTP_201_CREATED
)
async def create_reference(
    resource: ReferencePath,
    payload: ContentReferenceWrite,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ContentEnvelope:
    resource_type = _resource(resource)
    _ensure_payload_resource(resource_type, payload.resource)
    item = await service.create_reference(payload.model_dump(mode="python"), actor.user_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return ContentEnvelope(data=item)


@admin_reference_router.get("/{resource}/{item_id}", response_model=ContentEnvelope)
async def get_admin_reference(
    resource: ReferencePath,
    item_id: UUID,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ContentEnvelope:
    item = await service.get_reference_admin(_resource(resource), item_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return ContentEnvelope(data=item)


@admin_reference_router.put("/{resource}/{item_id}", response_model=ContentEnvelope)
async def update_reference(
    resource: ReferencePath,
    item_id: UUID,
    payload: ContentReferenceWrite,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ContentEnvelope:
    resource_type = _resource(resource)
    _ensure_payload_resource(resource_type, payload.resource)
    item = await service.update_reference(
        resource_type,
        item_id,
        payload.model_dump(mode="python"),
        actor.user_id,
        _parse_if_match(if_match),
        locale,
    )
    response.headers["ETag"] = _etag(item.version)
    return ContentEnvelope(data=item)


@admin_reference_router.post("/{resource}/{item_id}/publish", response_model=ContentEnvelope)
async def publish_reference(
    resource: ReferencePath,
    item_id: UUID,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ContentEnvelope:
    item = await service.publish_reference(
        _resource(resource), item_id, actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(item.version)
    return ContentEnvelope(data=item)


@admin_reference_router.post("/{resource}/{item_id}/archive", response_model=ContentEnvelope)
async def archive_reference(
    resource: ReferencePath,
    item_id: UUID,
    payload: ArchiveContentRequest,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ContentEnvelope:
    item = await service.archive_reference(
        _resource(resource),
        item_id,
        payload.reason,
        actor.user_id,
        _parse_if_match(if_match),
        locale,
    )
    response.headers["ETag"] = _etag(item.version)
    return ContentEnvelope(data=item)


@admin_reference_router.delete("/{resource}/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_reference(
    resource: ReferencePath,
    item_id: UUID,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> Response:
    await service.delete_reference(
        _resource(resource), item_id, actor.user_id, _parse_if_match(if_match), locale
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@admin_article_router.get("", response_model=ArticlePage)
async def list_admin_articles(
    service: Annotated[ContentService, Depends(content_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    article_type: Annotated[ArticleType | None, Query(alias="type")] = None,
    category_id: Annotated[UUID | None, Query(alias="categoryId")] = None,
    tag_id: Annotated[UUID | None, Query(alias="tagId")] = None,
    author_id: Annotated[UUID | None, Query(alias="authorId")] = None,
    content_status: Annotated[ContentStatus | None, Query(alias="status")] = None,
    featured: bool | None = None,
    sort: ArticleSort = ArticleSort.UPDATED_DESC,
) -> ArticlePage:
    return await service.list_articles(
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        article_type=article_type.value if article_type else None,
        category_id=category_id,
        tag_id=tag_id,
        author_id=author_id,
        status=content_status.value if content_status else None,
        featured=featured,
        sort=sort,
        public_only=False,
    )


@admin_article_router.post("", response_model=ArticleEnvelope, status_code=status.HTTP_201_CREATED)
async def create_article(
    payload: ArticleWrite,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ArticleEnvelope:
    item = await service.create_article(payload.model_dump(mode="python"), actor.user_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return ArticleEnvelope(data=item)


@admin_article_router.get("/{article_id}", response_model=ArticleEnvelope)
async def get_admin_article(
    article_id: UUID,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("content.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ArticleEnvelope:
    item = await service.get_article_admin(article_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return ArticleEnvelope(data=item)


@admin_article_router.put("/{article_id}", response_model=ArticleEnvelope)
async def update_article(
    article_id: UUID,
    payload: ArticleWrite,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ArticleEnvelope:
    item = await service.update_article(
        article_id,
        payload.model_dump(mode="python"),
        actor.user_id,
        _parse_if_match(if_match),
        locale,
    )
    response.headers["ETag"] = _etag(item.version)
    return ArticleEnvelope(data=item)


@admin_article_router.post("/{article_id}/publish", response_model=ArticleEnvelope)
async def publish_article(
    article_id: UUID,
    payload: PublishArticleRequest,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ArticleEnvelope:
    item = await service.publish_article(
        article_id, payload.published_at, actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(item.version)
    return ArticleEnvelope(data=item)


@admin_article_router.post("/{article_id}/archive", response_model=ArticleEnvelope)
async def archive_article(
    article_id: UUID,
    payload: ArchiveContentRequest,
    response: Response,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.publish"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ArticleEnvelope:
    item = await service.archive_article(
        article_id, payload.reason, actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(item.version)
    return ArticleEnvelope(data=item)


@admin_article_router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_article(
    article_id: UUID,
    service: Annotated[ContentService, Depends(content_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("content.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> Response:
    await service.delete_article(article_id, actor.user_id, _parse_if_match(if_match), locale)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _resource(value: ReferencePath) -> ContentResource:
    return {
        "categories": ContentResource.CATEGORY,
        "tags": ContentResource.TAG,
        "authors": ContentResource.AUTHOR,
    }[value]


def _ensure_payload_resource(expected: ContentResource, actual: ContentResource) -> None:
    if expected is not actual:
        raise ApplicationError(
            "CONTENT_RESOURCE_MISMATCH", "Payload resource does not match the endpoint.", 422
        )


def _etag(version: int) -> str:
    return f'"{version}"'


def _parse_if_match(value: str | None) -> int:
    if value is None:
        raise ApplicationError(
            "PRECONDITION_REQUIRED", "If-Match is required for this operation.", 428
        )
    normalized = value.strip().removeprefix("W/").strip('"')
    if not normalized.isdigit() or int(normalized) < 1:
        raise ApplicationError("INVALID_IF_MATCH", "If-Match must contain a valid version.", 400)
    return int(normalized)


router.include_router(public_reference_router)
router.include_router(public_article_router)
router.include_router(admin_reference_router)
router.include_router(admin_article_router)
