from __future__ import annotations

import json
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.domain import (
    REFERENCE_DEFINITIONS,
    ReferenceKind,
    StaleReferenceDataError,
)


class ReferenceDataRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(
        self,
        kind: ReferenceKind,
        *,
        locale: str,
        page: int,
        limit: int,
        public_only: bool,
        query: str | None,
        country_id: UUID | None,
        parent_id: UUID | None,
    ) -> tuple[list[dict[str, Any]], int]:
        definition = REFERENCE_DEFINITIONS[kind]
        predicates = ["1 = 1"]
        params: dict[str, Any] = {"locale": locale, "limit": limit, "offset": (page - 1) * limit}
        if public_only:
            predicates.append(definition.public_predicate)
        elif kind is ReferenceKind.COUNTRIES:
            predicates.append("base.deleted_at IS NULL")
        elif kind is ReferenceKind.CITIES:
            predicates.append("base.deleted_at IS NULL")
        if query:
            predicates.append("translation.name ILIKE :query")
            params["query"] = f"%{query}%"
        if kind is ReferenceKind.CITIES and country_id:
            predicates.append("base.country_id = :country_id")
            params["country_id"] = country_id
        if kind is ReferenceKind.FIELDS_OF_STUDY and parent_id:
            predicates.append("base.parent_id = :parent_id")
            params["parent_id"] = parent_id
        where = " AND ".join(predicates)
        join = (
            f"JOIN {definition.translation_table} translation "
            f"ON translation.{definition.translation_fk} = base.id AND translation.locale = :locale"
        )
        count = await self.session.scalar(
            # Identifiers and predicates come only from the closed ReferenceKind mapping.
            text(f"SELECT count(*) FROM {definition.table} base {join} WHERE {where}"),  # nosec B608
            params,
        )
        rows = await self.session.execute(
            text(
                f"SELECT base.*, translation.name, "  # nosec B608
                f"translation.{definition.translation_description_field} AS description "
                f"FROM {definition.table} base {join} WHERE {where} "
                "ORDER BY base.display_order, translation.name, base.id "
                "LIMIT :limit OFFSET :offset"
            ),
            params,
        )
        return [dict(row._mapping) for row in rows], int(count or 0)

    async def get(self, kind: ReferenceKind, item_id: UUID) -> dict[str, Any] | None:
        definition = REFERENCE_DEFINITIONS[kind]
        row = (
            (
                await self.session.execute(
                    # The table identifier comes only from the closed ReferenceKind mapping.
                    text(f"SELECT * FROM {definition.table} WHERE id = :id"),  # nosec B608
                    {"id": item_id},
                )
            )
            .mappings()
            .one_or_none()
        )
        if row is None:
            return None
        translations = await self._translations(kind, item_id)
        result = dict(row)
        result["translations"] = translations
        preferred = translations.get("fa") or translations.get("en") or {}
        result.update(preferred)
        return result

    async def create(
        self, kind: ReferenceKind, values: dict[str, Any], translations: dict[str, Any]
    ) -> dict[str, Any]:
        definition = REFERENCE_DEFINITIONS[kind]
        item_id = uuid4()
        columns = ("id", *definition.writable_fields)
        params = {
            "id": item_id,
            **{field: values.get(field) for field in definition.writable_fields},
        }
        placeholders = ", ".join(f":{column}" for column in columns)
        await self.session.execute(
            # Table and column identifiers are sourced from immutable definitions, never input.
            text(  # nosec B608
                f"INSERT INTO {definition.table} ({', '.join(columns)}) "  # nosec B608
                f"VALUES ({placeholders})"
            ),
            params,
        )
        await self._replace_translations(kind, item_id, translations)
        return (await self.get(kind, item_id)) or {}

    async def update(
        self,
        kind: ReferenceKind,
        item_id: UUID,
        values: dict[str, Any],
        translations: dict[str, Any],
        expected_version: int,
    ) -> dict[str, Any] | None:
        definition = REFERENCE_DEFINITIONS[kind]
        if await self.get(kind, item_id) is None:
            return None
        assignments = ", ".join(f"{field} = :{field}" for field in definition.writable_fields)
        if "updated_at" not in definition.writable_fields:
            assignments += ", updated_at = now()"
        params = {
            "id": item_id,
            **{field: values.get(field) for field in definition.writable_fields},
        }
        assignments += ", row_version = row_version + 1"
        params["expected_version"] = expected_version
        updated_id = await self.session.scalar(
            text(
                f"UPDATE {definition.table} SET {assignments} "  # nosec B608
                "WHERE id = :id AND row_version = :expected_version RETURNING id"
            ),
            params,
        )
        if updated_id is None:
            raise StaleReferenceDataError
        await self._replace_translations(kind, item_id, translations)
        return await self.get(kind, item_id)

    async def archive(
        self, kind: ReferenceKind, item_id: UUID, expected_version: int
    ) -> dict[str, Any] | None:
        definition = REFERENCE_DEFINITIONS[kind]
        before = await self.get(kind, item_id)
        if before is None:
            return None
        assignment = "status = 'archived'" if kind is ReferenceKind.COUNTRIES else "active = false"
        updated_id = await self.session.scalar(
            text(
                f"UPDATE {definition.table} SET {assignment}, updated_at = now(), "  # nosec B608
                "row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :expected_version RETURNING id"
            ),
            {"id": item_id, "expected_version": expected_version},
        )
        if updated_id is None:
            raise StaleReferenceDataError
        return await self.get(kind, item_id)

    async def exists(self, kind: ReferenceKind, item_id: UUID) -> bool:
        definition = REFERENCE_DEFINITIONS[kind]
        return bool(
            await self.session.scalar(
                text(  # nosec B608
                    f"SELECT EXISTS(SELECT 1 FROM {definition.table} "  # nosec B608
                    "WHERE id = :id)"
                ),
                {"id": item_id},
            )
        )

    async def audit(
        self,
        *,
        actor_user_id: UUID,
        action: str,
        kind: ReferenceKind,
        item_id: UUID,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO audit_logs "
                "(actor_user_id, action, entity_type, entity_id, before_safe, after_safe) "
                "VALUES (:actor, :action, :entity_type, :entity_id, "
                "CAST(:before AS jsonb), CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_user_id,
                "action": action,
                "entity_type": kind.value,
                "entity_id": item_id,
                "before": json.dumps(before, default=str) if before is not None else None,
                "after": json.dumps(after, default=str) if after is not None else None,
            },
        )

    async def _translations(self, kind: ReferenceKind, item_id: UUID) -> dict[str, Any]:
        definition = REFERENCE_DEFINITIONS[kind]
        rows = await self.session.execute(
            text(
                f"SELECT locale, name, "  # nosec B608
                f"{definition.translation_description_field} AS description "
                f"FROM {definition.translation_table} "
                f"WHERE {definition.translation_fk} = :id ORDER BY locale"
            ),
            {"id": item_id},
        )
        return {row.locale: {"name": row.name, "description": row.description} for row in rows}

    async def _replace_translations(
        self, kind: ReferenceKind, item_id: UUID, translations: dict[str, Any]
    ) -> None:
        definition = REFERENCE_DEFINITIONS[kind]
        await self.session.execute(
            text(
                f"DELETE FROM {definition.translation_table} "  # nosec B608
                f"WHERE {definition.translation_fk} = :id"
            ),
            {"id": item_id},
        )
        for locale, translation in translations.items():
            await self.session.execute(
                text(
                    f"INSERT INTO {definition.translation_table} "  # nosec B608
                    f"({definition.translation_fk}, locale, name, "
                    f"{definition.translation_description_field}) "
                    "VALUES (:id, :locale, :name, :description)"
                ),
                {
                    "id": item_id,
                    "locale": locale,
                    "name": translation["name"],
                    "description": translation.get("description"),
                },
            )
