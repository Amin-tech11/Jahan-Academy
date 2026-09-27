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
                SELECT ct.name, ct.seo_title, ct.seo_description, c.updated_at,
                       NULL::text AS article_type, NULL::text AS university_name
                FROM countries c JOIN country_translations ct
                  ON ct.country_id = c.id AND ct.locale = :locale
                WHERE c.slug = :slug AND c.status = 'published' AND c.deleted_at IS NULL
            """,
            "university": """
                SELECT ut.name, ut.seo_title, ut.seo_description, u.updated_at,
                       NULL::text AS article_type, NULL::text AS university_name
                FROM universities u JOIN university_translations ut
                  ON ut.university_id = u.id AND ut.locale = :locale
                WHERE u.slug = :slug AND u.status = 'published' AND u.deleted_at IS NULL
            """,
            "program": """
                SELECT pt.title AS name, pt.seo_title, pt.seo_description, p.updated_at,
                       NULL::text AS article_type, ut.name AS university_name
                FROM programs p JOIN program_translations pt
                  ON pt.program_id = p.id AND pt.locale = :locale
                  JOIN universities u ON u.id = p.university_id
                  JOIN university_translations ut ON ut.university_id = u.id AND ut.locale = :locale
                WHERE p.slug = :slug AND p.status = 'published' AND p.deleted_at IS NULL
                  AND u.status = 'published' AND u.deleted_at IS NULL
            """,
            "article": """
                SELECT at.title AS name, at.seo_title, at.seo_description, a.updated_at,
                       a.article_type, NULL::text AS university_name
                FROM articles a JOIN article_translations at
                  ON at.article_id = a.id AND at.locale = :locale
                WHERE a.slug = :slug AND a.status = 'published' AND a.deleted_at IS NULL
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
                SELECT 'country' AS resource, c.slug, ct.locale, c.updated_at
                FROM countries c JOIN country_translations ct ON ct.country_id = c.id
                WHERE c.status = 'published' AND c.deleted_at IS NULL
                UNION ALL
                SELECT 'university', u.slug, ut.locale, u.updated_at
                FROM universities u JOIN university_translations ut ON ut.university_id = u.id
                WHERE u.status = 'published' AND u.deleted_at IS NULL
                UNION ALL
                SELECT 'program', p.slug, pt.locale, p.updated_at
                FROM programs p JOIN program_translations pt ON pt.program_id = p.id
                  JOIN universities u ON u.id = p.university_id
                WHERE p.status = 'published' AND p.deleted_at IS NULL
                  AND u.status = 'published' AND u.deleted_at IS NULL
                UNION ALL
                SELECT 'article', a.slug, at.locale, a.updated_at
                FROM articles a JOIN article_translations at ON at.article_id = a.id
                WHERE a.status = 'published' AND a.deleted_at IS NULL
                """
            )
        )
        return [dict(row) for row in result.mappings().all()]
