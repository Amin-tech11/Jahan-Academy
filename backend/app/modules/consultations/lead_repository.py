from __future__ import annotations

import json
import re
from collections.abc import Sequence
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.consultations.domain import (
    DIGIT_TRANSLATION,
    LeadArchiveFilter,
    LeadSearchField,
    LeadSort,
    LeadStatus,
    SyncStatus,
)


class StaleLeadError(Exception):
    pass


class LeadRepository:
    SORT_SQL = {
        LeadSort.CREATED_DESC: "l.created_at DESC, l.id DESC",
        LeadSort.CREATED_ASC: "l.created_at ASC, l.id ASC",
        LeadSort.UPDATED_DESC: "l.updated_at DESC, l.id DESC",
    }

    EDITABLE_COLUMNS = frozenset(
        {
            "first_name",
            "last_name",
            "mobile_raw",
            "mobile_normalized",
            "email",
            "desired_country_id",
            "desired_country_text",
            "intake_code",
            "start_year",
            "age",
            "gender_code",
            "gender_self_description",
            "occupation",
            "marital_status_code",
            "investment_range_code",
            "investment_currency",
            "message",
            "locale",
            "deduplication_key",
        }
    )

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def list(
        self,
        *,
        locale: str,
        page: int,
        limit: int,
        query: str | None,
        status: LeadStatus | None,
        sync_status: SyncStatus | None,
        assignee_id: UUID | None,
        country_id: UUID | None,
        created_from: datetime | None,
        created_to: datetime | None,
        archive: LeadArchiveFilter,
        sort: LeadSort,
        assigned_scope_user_id: UUID | None,
        search_field: LeadSearchField | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        where, params = self._filters(
            query=query,
            search_field=search_field,
            status=status,
            sync_status=sync_status,
            assignee_id=assignee_id,
            country_id=country_id,
            created_from=created_from,
            created_to=created_to,
            archive=archive,
            assigned_scope_user_id=assigned_scope_user_id,
        )
        params.update({"locale": locale, "limit": limit, "offset": (page - 1) * limit})
        joins = self._joins()
        total = await self.session.scalar(
            text(f"SELECT count(*) FROM leads l {joins} WHERE {where}"),  # nosec B608
            params,
        )
        rows = await self.session.execute(
            text(
                f"SELECT {self._columns()} FROM leads l {joins} WHERE {where} "  # nosec B608
                f"ORDER BY {self.SORT_SQL[sort]} LIMIT :limit OFFSET :offset"  # nosec B608
            ),
            params,
        )
        return [dict(row._mapping) for row in rows], int(total or 0)

    async def get(
        self,
        lead_id: UUID,
        *,
        locale: str,
        assigned_scope_user_id: UUID | None = None,
    ) -> dict[str, Any] | None:
        predicate = "l.id = :id"
        params: dict[str, Any] = {"id": lead_id, "locale": locale}
        if assigned_scope_user_id is not None:
            predicate += " AND l.assigned_consultant_id = :scope_user_id"
            params["scope_user_id"] = assigned_scope_user_id
        row = (
            (
                await self.session.execute(
                    text(
                        f"SELECT {self._columns()} FROM leads l {self._joins()} "  # nosec B608
                        f"WHERE {predicate}"  # nosec B608
                    ),
                    params,
                )
            )
            .mappings()
            .one_or_none()
        )
        return dict(row) if row else None

    async def update(
        self,
        lead_id: UUID,
        values: dict[str, Any],
        *,
        expected_version: int,
    ) -> None:
        invalid = values.keys() - self.EDITABLE_COLUMNS
        if invalid:
            raise ValueError(f"Unsupported lead columns: {', '.join(sorted(invalid))}")
        assignments = ", ".join(f"{column} = :{column}" for column in values)
        updated = await self.session.scalar(
            text(
                f"UPDATE leads SET {assignments}, updated_at = now(), "  # nosec B608
                "row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :expected_version RETURNING id"
            ),
            {"id": lead_id, "expected_version": expected_version, **values},
        )
        if updated is None:
            raise StaleLeadError

    async def archive(
        self,
        lead_id: UUID,
        *,
        actor_user_id: UUID,
        reason: str,
        expected_version: int,
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE leads SET archived_at = now(), archived_by_user_id = :actor, "
                "archive_reason = :reason, updated_at = now(), row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :expected_version "
                "AND archived_at IS NULL RETURNING id"
            ),
            {
                "id": lead_id,
                "actor": actor_user_id,
                "reason": reason,
                "expected_version": expected_version,
            },
        )
        if updated is None:
            raise StaleLeadError

    async def consultant_is_available(self, consultant_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                text(
                    "SELECT EXISTS("
                    "SELECT 1 FROM users u "
                    "JOIN user_roles ur ON ur.user_id = u.id AND ur.revoked_at IS NULL "
                    "JOIN roles r ON r.id = ur.role_id "
                    "WHERE u.id = :id AND u.status = 'active' AND u.deleted_at IS NULL "
                    "AND r.code = 'consultant' AND ur.scope_type = 'global'"
                    ")"
                ),
                {"id": consultant_id},
            )
        )

    async def assign(
        self,
        lead_id: UUID,
        *,
        consultant_id: UUID,
        actor_user_id: UUID,
        reason: str | None,
        current_status: LeadStatus,
        expected_version: int,
    ) -> None:
        next_status = LeadStatus.ASSIGNED if current_status is LeadStatus.NEW else current_status
        updated = await self.session.scalar(
            text(
                "UPDATE leads SET assigned_consultant_id = :consultant_id, "
                "status = :next_status, updated_at = now(), row_version = row_version + 1 "
                "WHERE id = :id AND row_version = :expected_version "
                "AND archived_at IS NULL AND status <> 'closed' RETURNING id"
            ),
            {
                "id": lead_id,
                "consultant_id": consultant_id,
                "next_status": next_status.value,
                "expected_version": expected_version,
            },
        )
        if updated is None:
            raise StaleLeadError
        await self.session.execute(
            text(
                "UPDATE lead_assignments SET unassigned_at = now(), "
                "ended_by_user_id = :actor "
                "WHERE lead_id = :lead_id AND unassigned_at IS NULL"
            ),
            {"lead_id": lead_id, "actor": actor_user_id},
        )
        await self.session.execute(
            text(
                "INSERT INTO lead_assignments "
                "(lead_id, assignee_user_id, assigned_by_user_id, reason) "
                "VALUES (:lead_id, :consultant_id, :actor, :reason)"
            ),
            {
                "lead_id": lead_id,
                "consultant_id": consultant_id,
                "actor": actor_user_id,
                "reason": reason,
            },
        )
        if next_status is not current_status:
            await self._insert_status_history(
                lead_id=lead_id,
                old_status=current_status,
                new_status=next_status,
                actor_user_id=actor_user_id,
                reason=reason or "Assigned to a consultant",
            )

    async def transition_status(
        self,
        lead_id: UUID,
        *,
        old_status: LeadStatus,
        new_status: LeadStatus,
        actor_user_id: UUID,
        reason: str | None,
        expected_version: int,
    ) -> None:
        updated = await self.session.scalar(
            text(
                "UPDATE leads SET status = :new_status, updated_at = now(), "
                "row_version = row_version + 1 "
                "WHERE id = :id AND status = :old_status "
                "AND row_version = :expected_version AND archived_at IS NULL RETURNING id"
            ),
            {
                "id": lead_id,
                "old_status": old_status.value,
                "new_status": new_status.value,
                "expected_version": expected_version,
            },
        )
        if updated is None:
            raise StaleLeadError
        await self._insert_status_history(
            lead_id=lead_id,
            old_status=old_status,
            new_status=new_status,
            actor_user_id=actor_user_id,
            reason=reason,
        )

    async def history(
        self, lead_id: UUID
    ) -> tuple[Sequence[dict[str, Any]], Sequence[dict[str, Any]]]:
        assignments = await self.session.execute(
            text(
                "SELECT id, assignee_user_id AS consultant_id, assigned_by_user_id, "
                "assigned_at, unassigned_at, ended_by_user_id, reason "
                "FROM lead_assignments WHERE lead_id = :lead_id "
                "ORDER BY assigned_at DESC, id DESC"
            ),
            {"lead_id": lead_id},
        )
        statuses = await self.session.execute(
            text(
                "SELECT id, old_status, new_status, actor_user_id, reason, created_at "
                "FROM lead_status_history WHERE lead_id = :lead_id "
                "ORDER BY created_at DESC, id DESC"
            ),
            {"lead_id": lead_id},
        )
        return (
            [dict(row._mapping) for row in assignments],
            [dict(row._mapping) for row in statuses],
        )

    async def _insert_status_history(
        self,
        *,
        lead_id: UUID,
        old_status: LeadStatus,
        new_status: LeadStatus,
        actor_user_id: UUID,
        reason: str | None,
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO lead_status_history "
                "(lead_id, old_status, new_status, actor_user_id, reason) "
                "VALUES (:lead_id, :old_status, :new_status, :actor, :reason)"
            ),
            {
                "lead_id": lead_id,
                "old_status": old_status.value,
                "new_status": new_status.value,
                "actor": actor_user_id,
                "reason": reason,
            },
        )

    async def country_is_public(self, country_id: UUID) -> bool:
        return bool(
            await self.session.scalar(
                text(
                    "SELECT EXISTS(SELECT 1 FROM countries WHERE id = :id "
                    "AND status = 'published' AND deleted_at IS NULL)"
                ),
                {"id": country_id},
            )
        )

    async def currency_is_active(self, currency: str) -> bool:
        return bool(
            await self.session.scalar(
                text("SELECT EXISTS(SELECT 1 FROM currencies WHERE code = :code AND active)"),
                {"code": currency},
            )
        )

    async def audit(
        self,
        *,
        actor_user_id: UUID,
        action: str,
        lead_id: UUID,
        before_safe: dict[str, Any],
        after_safe: dict[str, Any],
    ) -> None:
        await self.session.execute(
            text(
                "INSERT INTO audit_logs "
                "(actor_user_id, action, entity_type, entity_id, before_safe, after_safe) "
                "VALUES (:actor, :action, 'lead', :lead_id, "
                "CAST(:before AS jsonb), CAST(:after AS jsonb))"
            ),
            {
                "actor": actor_user_id,
                "action": action,
                "lead_id": lead_id,
                "before": json.dumps(before_safe),
                "after": json.dumps(after_safe),
            },
        )

    @classmethod
    def _filters(
        cls,
        *,
        query: str | None,
        status: LeadStatus | None,
        sync_status: SyncStatus | None,
        assignee_id: UUID | None,
        country_id: UUID | None,
        created_from: datetime | None,
        created_to: datetime | None,
        archive: LeadArchiveFilter,
        assigned_scope_user_id: UUID | None,
        search_field: LeadSearchField | None = None,
    ) -> tuple[str, dict[str, Any]]:
        predicates = ["1 = 1"]
        params: dict[str, Any] = {}
        if query:
            if search_field is LeadSearchField.MOBILE:
                query = re.sub(r"\D", "", query.translate(DIGIT_TRANSLATION))
                if query.startswith("00"):
                    query = query[2:]
                elif len(query) <= 11 and query.startswith("09"):
                    query = "98" + query[1:]
                elif len(query) == 10 and query.startswith("9"):
                    query = "98" + query
            elif search_field is LeadSearchField.FULL_NAME:
                query = " ".join(query.split())
            escaped = query.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
            params["query"] = f"%{escaped}%"
            if not query:
                predicates.append("1 = 0")
            elif search_field is LeadSearchField.REFERENCE:
                predicates.append("l.public_reference ILIKE :query ESCAPE '\\'")
            elif search_field is LeadSearchField.FULL_NAME:
                predicates.append(
                    "concat_ws(' ', l.first_name, l.last_name) ILIKE :query ESCAPE '\\'"
                )
            elif search_field is LeadSearchField.MOBILE:
                predicates.append(
                    "(regexp_replace(l.mobile_raw, '[^0-9]', '', 'g') ILIKE :query "
                    "OR regexp_replace(l.mobile_normalized, '[^0-9]', '', 'g') ILIKE :query)"
                )
            else:
                predicates.append(
                    "(l.public_reference ILIKE :query ESCAPE '\\' "
                    "OR l.first_name ILIKE :query ESCAPE '\\' "
                    "OR l.last_name ILIKE :query ESCAPE '\\' "
                    "OR concat_ws(' ', l.first_name, l.last_name) ILIKE :query ESCAPE '\\' "
                    "OR l.mobile_raw ILIKE :query ESCAPE '\\' "
                    "OR l.mobile_normalized ILIKE :query ESCAPE '\\' "
                    "OR l.email ILIKE :query ESCAPE '\\' "
                    "OR l.desired_country_text ILIKE :query ESCAPE '\\')"
                )
        if status:
            predicates.append("l.status = :status")
            params["status"] = status.value
        if sync_status:
            predicates.append("COALESCE(sync.status, 'pending') = :sync_status")
            params["sync_status"] = sync_status.value
        if assignee_id:
            predicates.append("l.assigned_consultant_id = :assignee_id")
            params["assignee_id"] = assignee_id
        if country_id:
            predicates.append("l.desired_country_id = :country_id")
            params["country_id"] = country_id
        if created_from:
            predicates.append("l.created_at >= :created_from")
            params["created_from"] = created_from
        if created_to:
            predicates.append("l.created_at <= :created_to")
            params["created_to"] = created_to
        if archive is LeadArchiveFilter.ACTIVE:
            predicates.append("l.archived_at IS NULL")
        elif archive is LeadArchiveFilter.ARCHIVED:
            predicates.append("l.archived_at IS NOT NULL")
        if assigned_scope_user_id:
            predicates.append("l.assigned_consultant_id = :scope_user_id")
            params["scope_user_id"] = assigned_scope_user_id
        return " AND ".join(predicates), params

    @staticmethod
    def _joins() -> str:
        return (
            "LEFT JOIN country_translations country "
            "ON country.country_id = l.desired_country_id AND country.locale = :locale "
            "LEFT JOIN integration_sync_records sync "
            "ON sync.provider = 'noura' AND sync.entity_type = 'lead' "
            "AND sync.entity_id = l.id "
            "LEFT JOIN user_profiles assignee_profile "
            "ON assignee_profile.user_id = l.assigned_consultant_id "
            "LEFT JOIN LATERAL ("
            "SELECT normalized_value AS email FROM user_identities "
            "WHERE user_id = l.assigned_consultant_id AND provider = 'email' "
            "ORDER BY verified_at DESC NULLS LAST, created_at LIMIT 1"
            ") assignee_identity ON true"
        )

    @staticmethod
    def _columns() -> str:
        return (
            "l.id, l.public_reference AS reference, l.first_name, l.last_name, "
            "l.mobile_normalized AS mobile, l.mobile_raw, l.email, l.desired_country_id, "
            "country.name AS desired_country_name, l.desired_country_text, "
            "l.intake_code AS intake_term, l.start_year, l.age, l.gender_code AS gender, "
            "l.gender_self_description, l.occupation, "
            "l.marital_status_code AS marital_status, l.investment_range_code, "
            "l.investment_currency, l.message, l.locale, l.source_url, "
            "l.source_university_id, l.source_program_id, l.status, "
            "COALESCE(sync.status, 'pending') AS sync_status, "
            "sync.external_id AS sync_external_id, "
            "COALESCE(sync.attempt_count, 0) AS sync_attempt_count, "
            "sync.last_attempt_at AS sync_last_attempt_at, sync.synced_at AS sync_synced_at, "
            "l.assigned_consultant_id AS assignee_id, "
            "assignee_profile.first_name AS assignee_first_name, "
            "assignee_profile.last_name AS assignee_last_name, "
            "assignee_identity.email AS assignee_email, l.archived_at IS NOT NULL AS archived, "
            "l.row_version AS version, l.duplicate_count, l.last_duplicate_at, l.archived_at, "
            "l.archived_by_user_id, l.archive_reason, l.created_at, l.updated_at"
        )
