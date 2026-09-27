from __future__ import annotations

import os
from uuid import UUID, uuid4

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.identity.authorization import AuthorizationContext, RoleGrant
from app.modules.identity.dependencies import authorization_context

pytestmark = pytest.mark.skipif(
    os.getenv("JAHAN_RUN_INTEGRATION") != "1",
    reason="requires migrated PostgreSQL",
)


def _sync_database_url() -> str:
    return os.environ["JAHAN_DATABASE_URL"].replace("postgresql+asyncpg://", "postgresql://")


def _seed_actor() -> UUID:
    actor_id = uuid4()
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (id, status, preferred_locale) VALUES (%s, 'active', 'fa')",
            (actor_id,),
        )
    return actor_id


def _cleanup(actor_id: UUID, entity_ids: list[UUID]) -> None:
    with psycopg.connect(_sync_database_url()) as connection, connection.cursor() as cursor:
        if entity_ids:
            cursor.execute("DELETE FROM audit_logs WHERE entity_id = ANY(%s)", (entity_ids,))
        cursor.execute("DELETE FROM articles WHERE id = ANY(%s)", (entity_ids,))
        cursor.execute("DELETE FROM content_authors WHERE id = ANY(%s)", (entity_ids,))
        cursor.execute("DELETE FROM content_tags WHERE id = ANY(%s)", (entity_ids,))
        cursor.execute("DELETE FROM content_categories WHERE id = ANY(%s)", (entity_ids,))
        cursor.execute("DELETE FROM users WHERE id = %s", (actor_id,))


def _reference_payload(resource: str, slug: str) -> dict[str, object]:
    if resource == "author":
        translations = {
            "fa": {"name": "تحریریه جهان", "title": "تیم محتوا", "biography": "نویسنده"},
            "en": {"name": "Jahan Editorial", "title": "Content Team", "biography": "Author"},
        }
    else:
        translations = {
            "fa": {"name": f"فارسی {slug}", "description": "توضیحات فارسی"},
            "en": {"name": f"English {slug}", "description": "English description"},
        }
    return {"resource": resource, "slug": slug, "translations": translations}


def test_content_taxonomy_author_article_publish_search_and_archive() -> None:
    actor_id = _seed_actor()
    entity_ids: list[UUID] = []
    actor = AuthorizationContext(
        user_id=actor_id,
        grants=(
            RoleGrant(
                role="content_editor",
                scope_type="global",
                scope_id=None,
                permissions=frozenset({"content.read", "content.write", "content.publish"}),
            ),
        ),
    )

    async def actor_override() -> AuthorizationContext:
        return actor

    app.dependency_overrides[authorization_context] = actor_override
    marker = uuid4().hex[:8]
    resources = {
        "categories": ("category", f"study-abroad-{marker}"),
        "tags": ("tag", f"application-{marker}"),
        "authors": ("author", f"jahan-editorial-{marker}"),
    }
    created: dict[str, dict[str, object]] = {}
    try:
        with TestClient(app) as client:
            for path, (resource, slug) in resources.items():
                draft = client.post(
                    f"/api/v1/admin/content/{path}",
                    json=_reference_payload(resource, slug),
                )
                assert draft.status_code == 201, draft.text
                entity_id = UUID(draft.json()["data"]["id"])
                entity_ids.append(entity_id)
                assert client.get(f"/api/v1/content/{path}/{slug}").status_code == 404
                published = client.post(
                    f"/api/v1/admin/content/{path}/{entity_id}/publish",
                    headers={"If-Match": draft.headers["etag"]},
                )
                assert published.status_code == 200, published.text
                created[path] = published.json()["data"]
                public = client.get(f"/api/v1/content/{path}/{slug}", params={"locale": "en"})
                assert public.status_code == 200, public.text

            article_slug = f"germany-application-news-{marker}"
            article_payload = {
                "slug": article_slug,
                "articleType": "news",
                "authorId": created["authors"]["id"],
                "categoryIds": [created["categories"]["id"]],
                "primaryCategoryId": created["categories"]["id"],
                "tagIds": [created["tags"]["id"]],
                "featured": True,
                "translations": {
                    "fa": {
                        "title": "راهنمای جدید اپلای آلمان",
                        "excerpt": "خبر و راهنمای اپلای دانشگاه",
                        "body": "متن کامل خبر اپلای آلمان",
                        "seoTitle": "اپلای آلمان",
                    },
                    "en": {
                        "title": "New Germany Application Guide",
                        "excerpt": "University application news and guide",
                        "body": "Complete Germany application news",
                        "seoTitle": "Apply to Germany",
                    },
                },
            }
            draft = client.post("/api/v1/admin/articles", json=article_payload)
            assert draft.status_code == 201, draft.text
            article_id = UUID(draft.json()["data"]["id"])
            entity_ids.append(article_id)
            assert draft.json()["data"]["status"] == "draft"
            assert client.get(f"/api/v1/articles/{article_slug}").status_code == 404

            stale = client.put(
                f"/api/v1/admin/articles/{article_id}",
                headers={"If-Match": '"99"'},
                json=article_payload,
            )
            assert stale.status_code == 412

            published = client.post(
                f"/api/v1/admin/articles/{article_id}/publish",
                headers={"If-Match": draft.headers["etag"]},
                json={},
            )
            assert published.status_code == 200, published.text
            public = client.get(f"/api/v1/articles/{article_slug}", params={"locale": "en"})
            assert public.status_code == 200, public.text
            assert public.json()["data"]["articleType"] == "news"
            assert public.json()["data"]["author"]["name"] == "Jahan Editorial"
            assert "translations" not in public.json()["data"]

            listing = client.get(
                "/api/v1/articles",
                params={
                    "locale": "en",
                    "q": "Germany Application",
                    "type": "news",
                    "categoryId": created["categories"]["id"],
                    "tagId": created["tags"]["id"],
                    "authorId": created["authors"]["id"],
                    "featured": True,
                    "sort": "relevance",
                },
            )
            assert listing.status_code == 200, listing.text
            assert listing.json()["meta"]["total"] == 1
            assert listing.json()["data"][0]["id"] == str(article_id)

            archived = client.post(
                f"/api/v1/admin/articles/{article_id}/archive",
                headers={"If-Match": published.headers["etag"]},
                json={"reason": "Editorial update required"},
            )
            assert archived.status_code == 200, archived.text
            assert archived.json()["data"]["status"] == "archived"
            assert client.get(f"/api/v1/articles/{article_slug}").status_code == 404
    finally:
        app.dependency_overrides.pop(authorization_context, None)
        _cleanup(actor_id, entity_ids)
