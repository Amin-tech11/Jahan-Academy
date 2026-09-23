from __future__ import annotations

from math import ceil
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.modules.content.domain import ContentResource, StaleContentError
from app.modules.content.repository import ContentRepository
from app.modules.content.schemas import (
    ArticlePage,
    ArticleView,
    ContentReferencePage,
    ContentReferenceView,
    PageMeta,
    ReferenceSummary,
)
from app.shared.exceptions import ApplicationError


class ContentService:
    def __init__(self, repository: ContentRepository) -> None:
        self._repository = repository

    async def list_references(self, **filters: Any) -> ContentReferencePage:
        rows, total = await self._repository.list_references(**filters)
        return ContentReferencePage(
            data=[self._reference_view(row, admin=False) for row in rows],
            meta=self._page_meta(filters["page"], filters["limit"], total),
        )

    async def get_reference(
        self, resource: ContentResource, slug: str, locale: str
    ) -> ContentReferenceView:
        row = await self._repository.get_reference(
            resource=resource, locale=locale, slug=slug, public_only=True
        )
        if row is None:
            raise self._not_found(resource.value)
        return self._reference_view(row, admin=False)

    async def get_reference_admin(
        self, resource: ContentResource, item_id: UUID, locale: str
    ) -> ContentReferenceView:
        row = await self._repository.get_reference(
            resource=resource, locale=locale, item_id=item_id
        )
        if row is None:
            raise self._not_found(resource.value)
        return self._reference_view(row, admin=True)

    async def create_reference(
        self, payload: dict[str, Any], actor_id: UUID, locale: str
    ) -> ContentReferenceView:
        resource = ContentResource(payload.pop("resource"))
        base, translations = self._prepare_reference(resource, payload)
        if resource is ContentResource.AUTHOR:
            await self._validate_author_media(base.get("avatar_media_id"))
        try:
            item_id = await self._repository.create_reference(resource, base)
            await self._repository.replace_reference_translations(resource, item_id, translations)
            row = await self._require_reference(resource, item_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action=f"content.{resource.value}.created",
                entity_type=f"content_{resource.value}",
                entity_id=item_id,
                before=None,
                after=row,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict() from exc
        return self._reference_view(row, admin=True)

    async def update_reference(
        self,
        resource: ContentResource,
        item_id: UUID,
        payload: dict[str, Any],
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ContentReferenceView:
        before = await self._require_reference(resource, item_id, locale)
        payload.pop("resource", None)
        base, translations = self._prepare_reference(resource, payload)
        if resource is ContentResource.AUTHOR:
            await self._validate_author_media(base.get("avatar_media_id"))
        try:
            await self._repository.update_reference(resource, item_id, base, expected_version)
            await self._repository.replace_reference_translations(resource, item_id, translations)
            row = await self._require_reference(resource, item_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action=f"content.{resource.value}.updated",
                entity_type=f"content_{resource.value}",
                entity_id=item_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleContentError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict() from exc
        return self._reference_view(row, admin=True)

    async def publish_reference(
        self,
        resource: ContentResource,
        item_id: UUID,
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ContentReferenceView:
        before = await self._require_reference(resource, item_id, locale)
        if set(before["translations"]) != {"fa", "en"}:
            raise ApplicationError(
                "CONTENT_INCOMPLETE", "Both Persian and English translations are required.", 422
            )
        if resource is ContentResource.AUTHOR:
            await self._validate_author_media(before.get("avatar_media_id"))
        return await self._change_reference_status(
            resource, item_id, "published", None, actor_id, expected_version, locale, before
        )

    async def archive_reference(
        self,
        resource: ContentResource,
        item_id: UUID,
        reason: str,
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ContentReferenceView:
        before = await self._require_reference(resource, item_id, locale)
        return await self._change_reference_status(
            resource, item_id, "archived", reason, actor_id, expected_version, locale, before
        )

    async def _change_reference_status(
        self,
        resource: ContentResource,
        item_id: UUID,
        status: str,
        reason: str | None,
        actor_id: UUID,
        expected_version: int,
        locale: str,
        before: dict[str, Any],
    ) -> ContentReferenceView:
        try:
            await self._repository.set_reference_status(
                resource, item_id, status, expected_version, actor_id, reason
            )
            row = await self._require_reference(resource, item_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action=f"content.{resource.value}.{status}",
                entity_type=f"content_{resource.value}",
                entity_id=item_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleContentError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._reference_view(row, admin=True)

    async def delete_reference(
        self,
        resource: ContentResource,
        item_id: UUID,
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> None:
        before = await self._require_reference(resource, item_id, locale)
        try:
            result = await self._repository.delete_reference_draft(
                resource, item_id, expected_version
            )
            if result == "not_draft":
                raise ApplicationError(
                    "CONTENT_DELETE_FORBIDDEN", "Only unused drafts can be deleted.", 409
                )
            if result == "dependent":
                raise ApplicationError(
                    "RESOURCE_HAS_DEPENDENCIES", "Content is referenced by an article.", 409
                )
            await self._repository.audit(
                actor_id=actor_id,
                action=f"content.{resource.value}.deleted",
                entity_type=f"content_{resource.value}",
                entity_id=item_id,
                before=before,
                after=None,
            )
            await self._repository.session.commit()
        except StaleContentError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc

    async def list_articles(self, **filters: Any) -> ArticlePage:
        rows, total = await self._repository.list_articles(**filters)
        rows = await self._repository.hydrate_articles(rows, filters["locale"])
        return ArticlePage(
            data=[self._article_view(row, admin=False) for row in rows],
            meta=self._page_meta(filters["page"], filters["limit"], total),
        )

    async def get_article_public(self, slug: str, locale: str) -> ArticleView:
        row = await self._repository.get_article(locale=locale, slug=slug, public_only=True)
        if row is None:
            raise self._not_found("article")
        return self._article_view(row, admin=False)

    async def get_article_admin(self, article_id: UUID, locale: str) -> ArticleView:
        row = await self._require_article(article_id, locale)
        return self._article_view(row, admin=True)

    async def create_article(
        self, payload: dict[str, Any], actor_id: UUID, locale: str
    ) -> ArticleView:
        base, translations, categories, primary, tags = await self._prepare_article(payload)
        try:
            article_id = await self._repository.create_article(base)
            await self._repository.replace_article_children(
                article_id, translations, categories, primary, tags
            )
            row = await self._require_article(article_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action="content.article.created",
                entity_type="article",
                entity_id=article_id,
                before=None,
                after=row,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict() from exc
        return self._article_view(row, admin=True)

    async def update_article(
        self,
        article_id: UUID,
        payload: dict[str, Any],
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ArticleView:
        before = await self._require_article(article_id, locale)
        base, translations, categories, primary, tags = await self._prepare_article(payload)
        if before["status"] == "published":
            await self._ensure_article_publishable(base, translations, categories, tags)
        try:
            await self._repository.update_article(article_id, base, expected_version)
            await self._repository.replace_article_children(
                article_id, translations, categories, primary, tags
            )
            row = await self._require_article(article_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action="content.article.updated",
                entity_type="article",
                entity_id=article_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleContentError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict() from exc
        return self._article_view(row, admin=True)

    async def publish_article(
        self,
        article_id: UUID,
        published_at: Any,
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ArticleView:
        before = await self._require_article(article_id, locale)
        await self._ensure_article_publishable(
            {
                "author_id": before.get("author_id"),
                "featured_media_id": before.get("featured_media_id"),
            },
            before["translations"],
            [item["id"] for item in before["categories"]],
            [item["id"] for item in before["tags"]],
        )
        return await self._change_article_status(
            article_id,
            "published",
            None,
            published_at,
            actor_id,
            expected_version,
            locale,
            before,
        )

    async def archive_article(
        self,
        article_id: UUID,
        reason: str,
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ArticleView:
        before = await self._require_article(article_id, locale)
        return await self._change_article_status(
            article_id,
            "archived",
            reason,
            None,
            actor_id,
            expected_version,
            locale,
            before,
        )

    async def _change_article_status(
        self,
        article_id: UUID,
        status: str,
        reason: str | None,
        published_at: Any,
        actor_id: UUID,
        expected_version: int,
        locale: str,
        before: dict[str, Any],
    ) -> ArticleView:
        try:
            await self._repository.set_article_status(
                article_id,
                status,
                expected_version,
                actor_id,
                reason,
                published_at,
            )
            row = await self._require_article(article_id, locale)
            await self._repository.audit(
                actor_id=actor_id,
                action=f"content.article.{status}",
                entity_type="article",
                entity_id=article_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleContentError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._article_view(row, admin=True)

    async def delete_article(
        self,
        article_id: UUID,
        actor_id: UUID,
        expected_version: int,
        locale: str,
    ) -> None:
        before = await self._require_article(article_id, locale)
        try:
            result = await self._repository.delete_article_draft(article_id, expected_version)
            if result == "not_draft":
                raise ApplicationError(
                    "CONTENT_DELETE_FORBIDDEN", "Only draft articles can be deleted.", 409
                )
            await self._repository.audit(
                actor_id=actor_id,
                action="content.article.deleted",
                entity_type="article",
                entity_id=article_id,
                before=before,
                after=None,
            )
            await self._repository.session.commit()
        except StaleContentError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc

    async def _prepare_article(
        self, payload: dict[str, Any]
    ) -> tuple[dict[str, Any], dict[str, dict[str, Any]], list[UUID], UUID | None, list[UUID]]:
        translations = payload.pop("translations")
        categories = payload.pop("category_ids")
        primary = payload.pop("primary_category_id")
        tags = payload.pop("tag_ids")
        await self._validate_article_context(payload, categories, tags)
        return payload, translations, categories, primary, tags

    async def _ensure_article_publishable(
        self,
        base: dict[str, Any],
        translations: dict[str, dict[str, Any]],
        categories: list[UUID],
        tags: list[UUID],
    ) -> None:
        if set(translations) != {"fa", "en"} or not all(
            item.get("title") and item.get("body") and item.get("excerpt")
            for item in translations.values()
        ):
            raise ApplicationError(
                "CONTENT_INCOMPLETE",
                "Published content requires complete Persian and English title, excerpt, and body.",
                422,
            )
        if not base.get("author_id") or not categories:
            raise ApplicationError(
                "CONTENT_INCOMPLETE",
                "Published content requires a published author and at least one category.",
                422,
            )
        await self._validate_article_context(base, categories, tags, publishing=True)

    async def _validate_article_context(
        self,
        base: dict[str, Any],
        categories: list[UUID],
        tags: list[UUID],
        *,
        publishing: bool = False,
    ) -> None:
        context = await self._repository.article_context(
            author_id=base.get("author_id"),
            media_id=base.get("featured_media_id"),
            category_ids=categories,
            tag_ids=tags,
        )
        if base.get("author_id") and context["author"] is None:
            raise ApplicationError("INVALID_AUTHOR", "Author was not found.", 422)
        media = context["media"]
        if media and (media["purpose"] != "article_image" or media["upload_status"] != "ready"):
            raise ApplicationError(
                "INVALID_FEATURED_MEDIA", "Featured media must be a ready article image.", 422
            )
        if base.get("featured_media_id") and media is None:
            raise ApplicationError("INVALID_FEATURED_MEDIA", "Featured media was not found.", 422)
        if set(context["categories"]) != set(categories):
            raise ApplicationError(
                "INVALID_CATEGORY", "One or more categories were not found.", 422
            )
        if set(context["tags"]) != set(tags):
            raise ApplicationError("INVALID_TAG", "One or more tags were not found.", 422)
        if publishing and context["author"]["status"] != "published":
            raise ApplicationError("INVALID_AUTHOR", "Author must be published first.", 422)
        if publishing and any(value != "published" for value in context["categories"].values()):
            raise ApplicationError(
                "INVALID_CATEGORY", "All article categories must be published first.", 422
            )
        if publishing and any(value != "published" for value in context["tags"].values()):
            raise ApplicationError("INVALID_TAG", "All article tags must be published first.", 422)

    async def _validate_author_media(self, media_id: UUID | None) -> None:
        if media_id is None:
            return
        context = await self._repository.article_context(
            author_id=None, media_id=media_id, category_ids=[], tag_ids=[]
        )
        media = context["media"]
        if (
            media is None
            or media["purpose"] != "article_image"
            or media["upload_status"] != "ready"
        ):
            raise ApplicationError(
                "INVALID_AUTHOR_MEDIA", "Author avatar must be a ready article image.", 422
            )

    @staticmethod
    def _prepare_reference(
        resource: ContentResource, payload: dict[str, Any]
    ) -> tuple[dict[str, Any], dict[str, dict[str, Any]]]:
        translations = payload.pop("translations")
        if resource is ContentResource.CATEGORY:
            base = {"slug": payload["slug"], "display_order": payload["display_order"]}
        elif resource is ContentResource.TAG:
            base = {"slug": payload["slug"]}
            translations = {
                locale: {"name": item["name"], "description": item.get("description")}
                for locale, item in translations.items()
            }
        else:
            base = {
                "slug": payload["slug"],
                "user_id": payload.get("user_id"),
                "avatar_media_id": payload.get("avatar_media_id"),
            }
            translations = {
                locale: {
                    "name": item["name"],
                    "title": item.get("title"),
                    "biography": item.get("biography"),
                }
                for locale, item in translations.items()
            }
        return base, translations

    async def _require_reference(
        self, resource: ContentResource, item_id: UUID, locale: str
    ) -> dict[str, Any]:
        row = await self._repository.get_reference(
            resource=resource, locale=locale, item_id=item_id
        )
        if row is None:
            raise self._not_found(resource.value)
        return row

    async def _require_article(self, article_id: UUID, locale: str) -> dict[str, Any]:
        row = await self._repository.get_article(locale=locale, article_id=article_id)
        if row is None:
            raise self._not_found("article")
        return row

    @staticmethod
    def _reference_view(row: dict[str, Any], *, admin: bool) -> ContentReferenceView:
        return ContentReferenceView(
            id=row["id"],
            resource=row["resource"],
            slug=row["slug"],
            name=row["name"],
            description=row.get("description"),
            title=row.get("title"),
            biography=row.get("biography"),
            display_order=row.get("display_order", 0),
            user_id=row.get("user_id"),
            avatar_media_id=row.get("avatar_media_id"),
            status=row["status"],
            translations=row.get("translations") if admin else None,
            published_at=row.get("published_at"),
            archived_at=row.get("archived_at"),
            archive_reason=row.get("archive_reason"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["row_version"],
        )

    @staticmethod
    def _article_view(row: dict[str, Any], *, admin: bool) -> ArticleView:
        author = None
        if row.get("author_id") and row.get("author_name"):
            author = ReferenceSummary(
                id=row["author_id"], slug=row["author_slug"], name=row["author_name"]
            )
        categories = [
            ReferenceSummary(id=item["id"], slug=item["slug"], name=item["name"])
            for item in row["categories"]
        ]
        tags = [
            ReferenceSummary(id=item["id"], slug=item["slug"], name=item["name"])
            for item in row["tags"]
        ]
        primary = next((item["id"] for item in row["categories"] if item.get("is_primary")), None)
        return ArticleView(
            id=row["id"],
            slug=row["slug"],
            article_type=row["article_type"],
            title=row["title"],
            excerpt=row.get("excerpt"),
            body=row["body"],
            seo_title=row.get("seo_title"),
            seo_description=row.get("seo_description"),
            author=author,
            featured_media_id=row.get("featured_media_id"),
            categories=categories,
            primary_category_id=primary,
            tags=tags,
            status=row["status"],
            featured=row["featured"],
            translations=row.get("translations") if admin else None,
            published_at=row.get("published_at"),
            archived_at=row.get("archived_at"),
            archive_reason=row.get("archive_reason"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["row_version"],
        )

    @staticmethod
    def _page_meta(page: int, limit: int, total: int) -> PageMeta:
        return PageMeta(
            page=page,
            limit=limit,
            total=total,
            total_pages=ceil(total / limit) if total else 0,
        )

    @staticmethod
    def _not_found(entity: str) -> ApplicationError:
        return ApplicationError("CONTENT_NOT_FOUND", f"{entity.title()} was not found.", 404)

    @staticmethod
    def _conflict() -> ApplicationError:
        return ApplicationError("CONTENT_CONFLICT", "Slug or linked user already exists.", 409)

    @staticmethod
    def _stale() -> ApplicationError:
        return ApplicationError("STALE_CONTENT", "Content was changed by another request.", 412)
