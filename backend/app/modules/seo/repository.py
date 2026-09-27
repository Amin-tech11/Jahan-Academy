from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class SeoRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_entity(self, resource: str, slug: str, locale: str) -> dict[str, Any] | None:
        queries = {
            "country": """
                SELECT gt.title AS name, gt.seo_title, gt.seo_description, g.updated_at,
                       NULL::text AS article_type, NULL::text AS page_kind
                FROM country_guides g
                JOIN countries c ON c.id = g.country_id
                JOIN country_guide_translations gt
                  ON gt.country_guide_id = g.id AND gt.locale = :locale
                WHERE c.slug = :slug AND c.status = 'published' AND c.deleted_at IS NULL
                  AND g.status = 'published' AND g.deleted_at IS NULL AND g.published_at <= now()
            """,
            "university": """
                SELECT ut.name, ut.seo_title, ut.seo_description, u.updated_at,
                       NULL::text AS article_type, NULL::text AS page_kind
                FROM universities u JOIN university_translations ut
                  ON ut.university_id = u.id AND ut.locale = :locale
                WHERE u.slug = :slug AND u.status = 'published' AND u.deleted_at IS NULL
            """,
            "article": """
                SELECT at.title AS name, at.seo_title, at.seo_description, a.updated_at,
                       a.article_type, NULL::text AS page_kind
                FROM articles a JOIN article_translations at
                  ON at.article_id = a.id AND at.locale = :locale
                WHERE a.slug = :slug AND a.status = 'published' AND a.deleted_at IS NULL
            """,
            "page": """
                SELECT pt.title AS name, pt.seo_title, pt.seo_description, p.updated_at,
                       NULL::text AS article_type, p.page_kind
                FROM public_pages p JOIN public_page_translations pt
                  ON pt.page_id = p.id AND pt.locale = :locale
                WHERE p.slug = :slug AND p.status = 'published' AND p.deleted_at IS NULL
                  AND p.published_at <= now()
            """,
        }
        result = await self.session.execute(
            text(queries[resource]), {"slug": slug, "locale": locale}
        )
        row = result.mappings().one_or_none()
        return dict(row) if row else None

    async def sitemap_entries(self) -> list[dict[str, Any]]:
        result = await self.session.execute(
            text(
                """
                SELECT 'country' AS resource, c.slug, gt.locale, g.updated_at,
                       NULL::text AS page_kind
                FROM country_guides g JOIN countries c ON c.id = g.country_id
                JOIN country_guide_translations gt ON gt.country_guide_id = g.id
                WHERE g.status = 'published' AND g.deleted_at IS NULL AND g.published_at <= now()
                  AND c.status = 'published' AND c.deleted_at IS NULL
                UNION ALL
                SELECT 'university', u.slug, ut.locale, u.updated_at, NULL::text
                FROM universities u JOIN university_translations ut ON ut.university_id = u.id
                WHERE u.status = 'published' AND u.deleted_at IS NULL
                UNION ALL
                SELECT 'article', a.slug, at.locale, a.updated_at, NULL::text
                FROM articles a JOIN article_translations at ON at.article_id = a.id
                WHERE a.status = 'published' AND a.deleted_at IS NULL
                UNION ALL
                SELECT 'page', p.slug, pt.locale, p.updated_at, p.page_kind
                FROM public_pages p JOIN public_page_translations pt ON pt.page_id = p.id
                WHERE p.status = 'published' AND p.deleted_at IS NULL AND p.published_at <= now()
                """
            )
        )
        return [dict(row) for row in result.mappings().all()]
