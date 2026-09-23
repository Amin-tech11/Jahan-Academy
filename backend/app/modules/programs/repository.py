from __future__ import annotations

import json
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.programs.domain import ProgramSort, StaleProgramError

SORT_SQL = {
    ProgramSort.FEATURED: "p.featured DESC, p.created_at DESC, p.id DESC",
    ProgramSort.TITLE_ASC: "pt.title ASC, p.id ASC",
    ProgramSort.TITLE_DESC: "pt.title DESC, p.id DESC",
    ProgramSort.TUITION_ASC: "p.tuition_min_minor ASC NULLS LAST, pt.title ASC",
    ProgramSort.DEADLINE_ASC: "next_deadline ASC NULLS LAST, pt.title ASC",
    ProgramSort.NEWEST: "p.created_at DESC, p.id DESC",
    ProgramSort.UPDATED_DESC: "p.updated_at DESC, p.id DESC",
}


class ProgramRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list_items(
        self,
        *,
        locale: str,
        page: int,
        limit: int,
        public_only: bool,
        query: str | None,
        university_id: UUID | None,
        country_id: UUID | None,
        academic_level_id: UUID | None,
        field_id: UUID | None,
        intake_id: UUID | None,
        intake_year: int | None,
        teaching_language_code: str | None,
        tuition_maximum_minor: int | None,
        tuition_currency: str | None,
        status: str | None,
        sort: ProgramSort,
    ) -> tuple[list[dict[str, Any]], int]:
        conditions = ["p.deleted_at IS NULL"]
        params: dict[str, Any] = {
            "locale": locale,
            "limit": limit,
            "offset": (page - 1) * limit,
        }
        if public_only:
            conditions.extend(
                ["p.status = 'published'", "u.status = 'published'", "u.deleted_at IS NULL"]
            )
        elif status:
            conditions.append("p.status = :status")
            params["status"] = status
        if query:
            conditions.append("(pt.title ILIKE :query OR p.slug ILIKE :query)")
            params["query"] = f"%{query}%"
        filters = {
            "university_id": university_id,
            "country_id": country_id,
            "academic_level_id": academic_level_id,
            "teaching_language_code": teaching_language_code,
        }
        for column, value in filters.items():
            if value is not None:
                owner = "u" if column == "country_id" else "p"
                conditions.append(f"{owner}.{column} = :{column}")
                params[column] = value
        if field_id:
            conditions.append(
                "EXISTS (SELECT 1 FROM program_fields pf_filter WHERE pf_filter.program_id = p.id "
                "AND pf_filter.field_of_study_id = :field_id)"
            )
            params["field_id"] = field_id
        if intake_id or intake_year:
            intake_conditions = ["pi_filter.program_id = p.id"]
            if intake_id:
                intake_conditions.append("pi_filter.intake_id = :intake_id")
                params["intake_id"] = intake_id
            if intake_year:
                intake_conditions.append("pi_filter.intake_year = :intake_year")
                params["intake_year"] = intake_year
            conditions.append(
                "EXISTS (SELECT 1 FROM program_intakes pi_filter WHERE "
                + " AND ".join(intake_conditions)
                + ")"
            )
        if tuition_maximum_minor is not None:
            conditions.append(
                "p.tuition_mode <> 'contact' AND p.tuition_min_minor <= :tuition_maximum_minor"
            )
            params["tuition_maximum_minor"] = tuition_maximum_minor
        if tuition_currency:
            conditions.append("p.tuition_currency = :tuition_currency")
            params["tuition_currency"] = tuition_currency
        where = " AND ".join(conditions)
        joins = (
            " JOIN program_translations pt ON pt.program_id = p.id AND pt.locale = :locale "
            " JOIN universities u ON u.id = p.university_id "
            " JOIN university_translations ut ON ut.university_id = u.id AND ut.locale = :locale "
            " JOIN academic_levels al ON al.id = p.academic_level_id "
            " JOIN academic_level_translations alt ON alt.academic_level_id = al.id "
            "AND alt.locale = :locale "
            " JOIN fields_of_study pf ON pf.id = p.primary_field_id "
            " JOIN field_of_study_translations pft ON pft.field_of_study_id = pf.id "
            "AND pft.locale = :locale "
        )
        total = int(
            await self.session.scalar(
                text(f"SELECT count(*) FROM programs p {joins} WHERE {where}"),  # nosec B608
                params,
            )
            or 0
        )
        rows = await self.session.execute(
            text(
                "SELECT p.*, pt.title, pt.short_description, pt.body, "
                "pt.admission_requirements, pt.seo_title, pt.seo_description, "
                "u.slug AS university_slug, ut.name AS university_name, al.code AS level_code, "
                "alt.name AS level_name, pf.code AS primary_field_code, "
                "pft.name AS primary_field_name, "
                "(SELECT min(application_deadline) FROM program_intakes pi "
                "WHERE pi.program_id = p.id AND pi.status IN ('planned','open')) AS next_deadline "
                f"FROM programs p {joins} WHERE {where} "  # nosec B608
                f"ORDER BY {SORT_SQL[sort]} LIMIT :limit OFFSET :offset"  # nosec B608
            ),
            params,
        )
        return [dict(row._mapping) for row in rows], total

    async def get(
        self,
        *,
        locale: str,
        program_id: UUID | None = None,
        slug: str | None = None,
        public_only: bool = False,
    ) -> dict[str, Any] | None:
        selector = "p.id = :selector" if program_id else "p.slug = :selector"
        conditions = [selector, "p.deleted_at IS NULL"]
        if public_only:
            conditions.extend(
                ["p.status = 'published'", "u.status = 'published'", "u.deleted_at IS NULL"]
            )
        row = (
            (
                await self.session.execute(
                    text(
                        "SELECT p.*, pt.title, pt.short_description, pt.body, "
                        "pt.admission_requirements, pt.seo_title, pt.seo_description, "
                        "u.slug AS university_slug, ut.name AS university_name, "
                        "al.code AS level_code, alt.name AS level_name, "
                        "pf.code AS primary_field_code, pft.name AS primary_field_name "
                        "FROM programs p JOIN universities u ON u.id = p.university_id "
                        "JOIN program_translations pt ON pt.program_id = p.id "
                        "AND pt.locale = :locale "
                        "JOIN university_translations ut ON ut.university_id = u.id "
                        "AND ut.locale = :locale "
                        "JOIN academic_levels al ON al.id = p.academic_level_id "
                        "JOIN academic_level_translations alt ON alt.academic_level_id = al.id "
                        "AND alt.locale = :locale "
                        "JOIN fields_of_study pf ON pf.id = p.primary_field_id "
                        "JOIN field_of_study_translations pft ON pft.field_of_study_id = pf.id "
                        "AND pft.locale = :locale "
                        f"WHERE {' AND '.join(conditions)}"  # nosec B608
                    ),
                    {"locale": locale, "selector": program_id or slug},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            return None
        result = dict(row)
        await self._hydrate(result, locale, include_translations=True)
        return result

    async def hydrate_list(self, rows: list[dict[str, Any]], locale: str) -> list[dict[str, Any]]:
        for row in rows:
            await self._hydrate(row, locale, include_translations=False)
        return rows

    async def reference_context(
        self,
        university_id: UUID,
        academic_level_id: UUID,
        field_ids: list[UUID],
        intake_ids: list[UUID],
        currencies: list[str],
    ) -> dict[str, Any]:
        university = (
            (
                await self.session.execute(
                    text(
                        "SELECT id, status FROM universities WHERE id = :id "
                        "AND status <> 'archived' AND deleted_at IS NULL"
                    ),
                    {"id": university_id},
                )
            )
            .mappings()
            .one_or_none()
        )
        level = bool(
            await self.session.scalar(
                text("SELECT EXISTS (SELECT 1 FROM academic_levels WHERE id = :id AND active)"),
                {"id": academic_level_id},
            )
        )
        found_fields = set()
        if field_ids:
            rows = await self.session.execute(
                text("SELECT id FROM fields_of_study WHERE id = ANY(:ids) AND active"),
                {"ids": field_ids},
            )
            found_fields = {UUID(str(row.id)) for row in rows}
        found_intakes = set()
        if intake_ids:
            rows = await self.session.execute(
                text("SELECT id FROM intakes WHERE id = ANY(:ids) AND active"),
                {"ids": intake_ids},
            )
            found_intakes = {UUID(str(row.id)) for row in rows}
        found_currencies = set()
        if currencies:
            rows = await self.session.execute(
                text("SELECT code FROM currencies WHERE code = ANY(:codes) AND active"),
                {"codes": currencies},
            )
            found_currencies = {str(row.code).strip() for row in rows}
        return {
            "university": dict(university) if university else None,
            "level": level,
            "missing_fields": set(field_ids) - found_fields,
            "missing_intakes": set(intake_ids) - found_intakes,
            "missing_currencies": set(currencies) - found_currencies,
        }

    async def create(self, values: dict[str, Any]) -> UUID:
        program_id = uuid4()
        await self.session.execute(
            text(
                "INSERT INTO programs (id, university_id, academic_level_id, primary_field_id, "
                "slug, duration_value, duration_unit, tuition_mode, tuition_min_minor, "
                "tuition_max_minor, tuition_currency, application_fee_mode, application_fee_minor, "
                "application_fee_currency, teaching_language_code, official_url, featured) "
                "VALUES (:id, :university_id, :academic_level_id, :primary_field_id, :slug, "
                ":duration_value, :duration_unit, :tuition_mode, :tuition_min_minor, "
                ":tuition_max_minor, :tuition_currency, :application_fee_mode, "
                ":application_fee_minor, :application_fee_currency, :teaching_language_code, "
                ":official_url, :featured)"
            ),
            {"id": program_id, **values},
        )
        return program_id

    async def update_base(
        self, program_id: UUID, values: dict[str, Any], expected_version: int
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE programs SET university_id = :university_id, "
                "academic_level_id = :academic_level_id, primary_field_id = :primary_field_id, "
                "slug = :slug, duration_value = :duration_value, duration_unit = :duration_unit, "
                "tuition_mode = :tuition_mode, tuition_min_minor = :tuition_min_minor, "
                "tuition_max_minor = :tuition_max_minor, tuition_currency = :tuition_currency, "
                "application_fee_mode = :application_fee_mode, "
                "application_fee_minor = :application_fee_minor, "
                "application_fee_currency = :application_fee_currency, "
                "teaching_language_code = :teaching_language_code, official_url = :official_url, "
                "featured = :featured, updated_at = now(), row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :version AND deleted_at IS NULL RETURNING id"
            ),
            {"id": program_id, "version": expected_version, **values},
        )
        if updated is None:
            raise StaleProgramError

    async def replace_children(
        self,
        program_id: UUID,
        translations: dict[str, dict[str, Any]],
        field_ids: list[UUID],
        primary_field_id: UUID,
        intakes: list[dict[str, Any]],
        requirements: list[dict[str, Any]],
    ) -> None:
        for table in (
            "program_translations",
            "program_fields",
            "program_intakes",
            "program_requirements",
        ):
            await self.session.execute(
                text(f"DELETE FROM {table} WHERE program_id = :id"),  # nosec B608
                {"id": program_id},
            )
        for locale, item in translations.items():
            await self.session.execute(
                text(
                    "INSERT INTO program_translations (program_id, locale, title, "
                    "short_description, body, admission_requirements, seo_title, seo_description) "
                    "VALUES (:program_id, :locale, :title, :short_description, :body, "
                    ":admission_requirements, :seo_title, :seo_description)"
                ),
                {"program_id": program_id, "locale": locale, **item},
            )
        for field_id in field_ids:
            await self.session.execute(
                text(
                    "INSERT INTO program_fields (program_id, field_of_study_id, is_primary) "
                    "VALUES (:program_id, :field_id, :is_primary)"
                ),
                {
                    "program_id": program_id,
                    "field_id": field_id,
                    "is_primary": field_id == primary_field_id,
                },
            )
        for item in intakes:
            await self.session.execute(
                text(
                    "INSERT INTO program_intakes (program_id, intake_id, intake_year, "
                    "application_deadline, status, notes_fa, notes_en) VALUES (:program_id, "
                    ":intake_id, :intake_year, :application_deadline, :status, "
                    ":notes_fa, :notes_en)"
                ),
                {"program_id": program_id, **item},
            )
        for item in requirements:
            await self.session.execute(
                text(
                    "INSERT INTO program_requirements (program_id, requirement_type, code, "
                    "required, value_json, description_fa, description_en, display_order) "
                    "VALUES (:program_id, :requirement_type, :code, :required, "
                    "CAST(:value_json AS jsonb), :description_fa, :description_en, :display_order)"
                ),
                {"program_id": program_id, **item},
            )

    async def publish(self, program_id: UUID, expected_version: int) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE programs SET status = 'published', "
                "published_at = COALESCE(published_at, now()), archived_at = NULL, "
                "archived_by_user_id = NULL, archive_reason = NULL, updated_at = now(), "
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {"id": program_id, "version": expected_version},
        )
        if updated is None:
            raise StaleProgramError

    async def archive(
        self, program_id: UUID, actor_id: UUID, reason: str, expected_version: int
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE programs SET status = 'archived', archived_at = now(), "
                "archived_by_user_id = :actor_id, archive_reason = :reason, updated_at = now(), "
                "row_version = row_version + 1 WHERE id = :id AND row_version = :version "
                "AND deleted_at IS NULL RETURNING id"
            ),
            {"id": program_id, "actor_id": actor_id, "reason": reason, "version": expected_version},
        )
        if updated is None:
            raise StaleProgramError

    async def hard_delete_draft(self, program_id: UUID, expected_version: int) -> str:
        status = await self.session.scalar(
            text("SELECT status FROM programs WHERE id = :id AND deleted_at IS NULL"),
            {"id": program_id},
        )
        if status is None:
            return "missing"
        if status != "draft":
            return "not_draft"
        dependencies = int(
            await self.session.scalar(
                text("SELECT count(*) FROM applications WHERE program_id = :id"),
                {"id": program_id},
            )
            or 0
        )
        if dependencies:
            return "dependent"
        deleted = await self.session.scalar(
            text("DELETE FROM programs WHERE id = :id AND row_version = :version RETURNING id"),
            {"id": program_id, "version": expected_version},
        )
        if deleted is None:
            raise StaleProgramError
        return "deleted"

    async def audit(
        self,
        *,
        actor_user_id: UUID,
        action: str,
        program_id: UUID,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
    ) -> None:
        def safe(value: dict[str, Any] | None) -> str | None:
            if value is None:
                return None
            keys = (
                "id",
                "slug",
                "university_id",
                "academic_level_id",
                "primary_field_id",
                "status",
                "featured",
                "row_version",
            )
            return json.dumps({key: value.get(key) for key in keys}, default=str)

        await self.session.execute(
            text(
                "INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, "
                "before_safe, after_safe) VALUES (:actor, :action, 'program', :id, "
                "CAST(:before AS jsonb), CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_user_id,
                "action": action,
                "id": program_id,
                "before": safe(before),
                "after": safe(after),
            },
        )

    async def _hydrate(
        self, row: dict[str, Any], locale: str, *, include_translations: bool
    ) -> None:
        program_id = row["id"]
        row["translations"] = await self._translations(program_id) if include_translations else {}
        row["fields"] = await self._fields(program_id, locale)
        row["intakes"] = await self._intakes(program_id, locale)
        row["requirements"] = await self._requirements(program_id)

    async def _translations(self, program_id: UUID) -> dict[str, dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT locale, title, short_description, body, admission_requirements, "
                "seo_title, seo_description FROM program_translations WHERE program_id = :id"
            ),
            {"id": program_id},
        )
        return {
            row.locale: {key: value for key, value in dict(row._mapping).items() if key != "locale"}
            for row in rows
        }

    async def _fields(self, program_id: UUID, locale: str) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT f.id, f.code, ft.name FROM program_fields pf "
                "JOIN fields_of_study f ON f.id = pf.field_of_study_id "
                "JOIN field_of_study_translations ft ON ft.field_of_study_id = f.id "
                "AND ft.locale = :locale WHERE pf.program_id = :id "
                "ORDER BY pf.is_primary DESC, f.display_order, ft.name"
            ),
            {"id": program_id, "locale": locale},
        )
        return [dict(item._mapping) for item in rows]

    async def _intakes(self, program_id: UUID, locale: str) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT pi.id, pi.intake_year AS year, pi.application_deadline, pi.status, "
                "pi.notes_fa, pi.notes_en, i.id AS intake_id, i.code AS intake_code, "
                "it.name AS intake_name FROM program_intakes pi "
                "JOIN intakes i ON i.id = pi.intake_id "
                "JOIN intake_translations it ON it.intake_id = i.id AND it.locale = :locale "
                "WHERE pi.program_id = :id ORDER BY pi.intake_year, i.display_order"
            ),
            {"id": program_id, "locale": locale},
        )
        return [dict(item._mapping) for item in rows]

    async def _requirements(self, program_id: UUID) -> list[dict[str, Any]]:
        rows = await self.session.execute(
            text(
                "SELECT id, requirement_type, code, required, value_json AS value, "
                "description_fa, description_en, display_order FROM program_requirements "
                "WHERE program_id = :id ORDER BY display_order, id"
            ),
            {"id": program_id},
        )
        return [dict(item._mapping) for item in rows]
