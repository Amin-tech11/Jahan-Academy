from __future__ import annotations

from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.discovery.domain import DiscoveryEntityType


class DiscoveryRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def suggestions(
        self,
        *,
        query: str,
        locale: str,
        entity_type: DiscoveryEntityType | None,
        limit: int,
    ) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "WITH search AS (SELECT websearch_to_tsquery('simple', :query) AS term), "
                "suggestions AS ("
                "SELECT 'university' AS entity_type, u.id, u.slug, ut.name AS title, "
                "ct.name AS subtitle, "
                "(ts_rank_cd(ut.search_vector, search.term) * 10 + "
                "CASE WHEN ut.name ILIKE :prefix THEN 4 ELSE 0 END + "
                "CASE WHEN u.featured THEN 1 ELSE 0 END)::float AS score "
                "FROM universities u "
                "JOIN university_translations ut ON ut.university_id = u.id "
                "AND ut.locale = :locale "
                "JOIN country_translations ct ON ct.country_id = u.country_id "
                "AND ct.locale = :locale CROSS JOIN search "
                "WHERE u.status = 'published' AND u.deleted_at IS NULL "
                "AND :include_universities "
                "AND (ut.search_vector @@ search.term OR ut.name ILIKE :contains "
                "OR u.slug ILIKE :contains) "
                "UNION ALL "
                "SELECT 'program' AS entity_type, p.id, p.slug, pt.title, ut.name AS subtitle, "
                "(ts_rank_cd(pt.search_vector, search.term) * 10 + "
                "CASE WHEN pt.title ILIKE :prefix THEN 4 ELSE 0 END + "
                "CASE WHEN p.featured THEN 1 ELSE 0 END)::float AS score "
                "FROM programs p "
                "JOIN program_translations pt ON pt.program_id = p.id AND pt.locale = :locale "
                "JOIN universities u ON u.id = p.university_id "
                "JOIN university_translations ut ON ut.university_id = u.id "
                "AND ut.locale = :locale CROSS JOIN search "
                "WHERE p.status = 'published' AND p.deleted_at IS NULL "
                "AND u.status = 'published' AND u.deleted_at IS NULL AND :include_programs "
                "AND (pt.search_vector @@ search.term OR pt.title ILIKE :contains "
                "OR p.slug ILIKE :contains)) "
                "SELECT * FROM suggestions ORDER BY score DESC, title ASC LIMIT :limit"
            ),
            {
                "query": query,
                "prefix": f"{query}%",
                "contains": f"%{query}%",
                "locale": locale,
                "include_universities": entity_type in (None, DiscoveryEntityType.UNIVERSITY),
                "include_programs": entity_type in (None, DiscoveryEntityType.PROGRAM),
                "limit": limit,
            },
        )
        return [dict(row._mapping) for row in rows]

    async def related_universities(
        self, *, slug: str, locale: str, limit: int
    ) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "WITH target AS ("
                "SELECT id, country_id, city_id, institution_type FROM universities "
                "WHERE slug = :slug AND status = 'published' AND deleted_at IS NULL), "
                "candidates AS ("
                "SELECT 'university' AS entity_type, u.id, u.slug, ut.name AS title, "
                "ct.name AS subtitle, "
                "u.country_id = t.country_id AS same_country, "
                "u.city_id IS NOT NULL AND u.city_id = t.city_id AS same_city, "
                "u.institution_type IS NOT NULL "
                "AND u.institution_type = t.institution_type AS same_type, "
                "(SELECT count(DISTINCT p1.primary_field_id) FROM programs p1 "
                "JOIN programs p2 ON p2.primary_field_id = p1.primary_field_id "
                "WHERE p1.university_id = t.id AND p2.university_id = u.id "
                "AND p1.status = 'published' AND p1.deleted_at IS NULL "
                "AND p2.status = 'published' AND p2.deleted_at IS NULL) AS shared_fields, "
                "u.featured FROM universities u CROSS JOIN target t "
                "JOIN university_translations ut ON ut.university_id = u.id "
                "AND ut.locale = :locale "
                "JOIN country_translations ct ON ct.country_id = u.country_id "
                "AND ct.locale = :locale "
                "WHERE u.id <> t.id AND u.status = 'published' AND u.deleted_at IS NULL) "
                "SELECT *, (CASE WHEN same_country THEN 5 ELSE 0 END + "
                "CASE WHEN same_city THEN 2 ELSE 0 END + "
                "CASE WHEN same_type THEN 1 ELSE 0 END + shared_fields * 2 + "
                "CASE WHEN featured THEN 0.5 ELSE 0 END)::float AS score "
                "FROM candidates WHERE same_country OR same_city OR same_type OR shared_fields > 0 "
                "ORDER BY score DESC, title ASC LIMIT :limit"
            ),
            {"slug": slug, "locale": locale, "limit": limit},
        )
        return [dict(row._mapping) for row in rows]

    async def related_programs(self, *, slug: str, locale: str, limit: int) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "WITH target AS ("
                "SELECT id, university_id, academic_level_id, primary_field_id, "
                "teaching_language_code, tuition_currency FROM programs "
                "WHERE slug = :slug AND status = 'published' AND deleted_at IS NULL), "
                "candidates AS ("
                "SELECT 'program' AS entity_type, p.id, p.slug, pt.title, "
                "ut.name AS subtitle, "
                "p.university_id = t.university_id AS same_university, "
                "p.academic_level_id = t.academic_level_id AS same_level, "
                "p.teaching_language_code IS NOT NULL "
                "AND p.teaching_language_code = t.teaching_language_code AS same_language, "
                "p.tuition_currency IS NOT NULL "
                "AND p.tuition_currency = t.tuition_currency AS same_currency, "
                "(SELECT count(*) FROM program_fields pf1 JOIN program_fields pf2 "
                "ON pf2.field_of_study_id = pf1.field_of_study_id "
                "WHERE pf1.program_id = t.id AND pf2.program_id = p.id) AS shared_fields, "
                "p.featured FROM programs p CROSS JOIN target t "
                "JOIN program_translations pt ON pt.program_id = p.id AND pt.locale = :locale "
                "JOIN universities u ON u.id = p.university_id "
                "JOIN university_translations ut ON ut.university_id = u.id "
                "AND ut.locale = :locale "
                "WHERE p.id <> t.id AND p.status = 'published' AND p.deleted_at IS NULL "
                "AND u.status = 'published' AND u.deleted_at IS NULL) "
                "SELECT *, (CASE WHEN same_university THEN 5 ELSE 0 END + "
                "CASE WHEN same_level THEN 3 ELSE 0 END + shared_fields * 2 + "
                "CASE WHEN same_language THEN 1 ELSE 0 END + "
                "CASE WHEN same_currency THEN 0.5 ELSE 0 END + "
                "CASE WHEN featured THEN 0.5 ELSE 0 END)::float AS score "
                "FROM candidates WHERE same_university OR same_level OR shared_fields > 0 "
                "OR same_language ORDER BY score DESC, title ASC LIMIT :limit"
            ),
            {"slug": slug, "locale": locale, "limit": limit},
        )
        return [dict(row._mapping) for row in rows]

    async def published_slug_exists(self, *, entity: DiscoveryEntityType, slug: str) -> bool:
        if entity is DiscoveryEntityType.UNIVERSITY:
            query = text(
                "SELECT EXISTS (SELECT 1 FROM universities WHERE slug = :slug "
                "AND status = 'published' AND deleted_at IS NULL)"
            )
        else:
            query = text(
                "SELECT EXISTS (SELECT 1 FROM programs p "
                "JOIN universities u ON u.id = p.university_id "
                "WHERE p.slug = :slug AND p.status = 'published' "
                "AND p.deleted_at IS NULL AND u.status = 'published' "
                "AND u.deleted_at IS NULL)"
            )
        return bool(
            await self.session.scalar(
                query,
                {"slug": slug},
            )
        )
