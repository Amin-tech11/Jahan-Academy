from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.modules.consultations.domain import (
    GenderCode,
    LeadArchiveFilter,
    LeadSort,
    LeadStatus,
    SyncStatus,
    normalize_mobile,
)
from app.modules.consultations.lead_repository import LeadRepository, StaleLeadError
from app.modules.consultations.lead_schemas import (
    LeadAssignee,
    LeadDetail,
    LeadPage,
    LeadPageMeta,
    LeadSummary,
    LeadUpdate,
)
from app.modules.identity.authorization import AuthorizationContext
from app.shared.exceptions import ApplicationError


class LeadService:
    READ_ALL = frozenset({"lead.read.all"})
    READ_ASSIGNED = frozenset({"lead.read.assigned"})
    WRITE_ALL = frozenset({"lead.write.all"})

    def __init__(self, repository: LeadRepository) -> None:
        self._repository = repository

    async def list(
        self,
        actor: AuthorizationContext,
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
    ) -> LeadPage:
        assigned_scope = self._assigned_scope(actor)
        rows, total = await self._repository.list(
            locale=locale,
            page=page,
            limit=limit,
            query=query,
            status=status,
            sync_status=sync_status,
            assignee_id=assignee_id,
            country_id=country_id,
            created_from=created_from,
            created_to=created_to,
            archive=archive,
            sort=sort,
            assigned_scope_user_id=assigned_scope,
        )
        return LeadPage(
            data=[self._summary(row) for row in rows],
            meta=LeadPageMeta(
                page=page,
                limit=limit,
                total=total,
                total_pages=(total + limit - 1) // limit,
            ),
        )

    async def get(
        self,
        lead_id: UUID,
        actor: AuthorizationContext,
        *,
        locale: str,
    ) -> LeadDetail:
        row = await self._repository.get(
            lead_id,
            locale=locale,
            assigned_scope_user_id=self._assigned_scope(actor),
        )
        if row is None:
            raise self._not_found()
        return self._detail(row)

    async def update(
        self,
        lead_id: UUID,
        payload: LeadUpdate,
        actor: AuthorizationContext,
        *,
        locale: str,
        expected_version: int,
    ) -> LeadDetail:
        self._require_write(actor)
        current = await self._repository.get(lead_id, locale=locale)
        if current is None:
            raise self._not_found()
        if current["archived"]:
            raise self._archived()
        values, changed_fields = await self._prepare_update(payload, current)
        try:
            await self._repository.update(
                lead_id,
                values,
                expected_version=expected_version,
            )
            await self._repository.audit(
                actor_user_id=actor.user_id,
                action="lead.updated",
                lead_id=lead_id,
                before_safe={"version": current["version"]},
                after_safe={
                    "version": current["version"] + 1,
                    "changedFields": sorted(changed_fields),
                },
            )
            await self._repository.session.commit()
        except StaleLeadError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise ApplicationError(
                code="LEAD_UPDATE_CONFLICT",
                message="The lead update conflicts with existing data.",
                status_code=409,
            ) from exc
        updated = await self._repository.get(lead_id, locale=locale)
        if updated is None:
            raise RuntimeError("Updated lead could not be reloaded")
        return self._detail(updated)

    async def archive(
        self,
        lead_id: UUID,
        actor: AuthorizationContext,
        *,
        locale: str,
        reason: str,
        expected_version: int,
    ) -> LeadDetail:
        self._require_write(actor)
        current = await self._repository.get(lead_id, locale=locale)
        if current is None:
            raise self._not_found()
        if current["archived"]:
            raise self._archived()
        try:
            await self._repository.archive(
                lead_id,
                actor_user_id=actor.user_id,
                reason=reason,
                expected_version=expected_version,
            )
            await self._repository.audit(
                actor_user_id=actor.user_id,
                action="lead.archived",
                lead_id=lead_id,
                before_safe={"version": current["version"], "archived": False},
                after_safe={"version": current["version"] + 1, "archived": True},
            )
            await self._repository.session.commit()
        except StaleLeadError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        archived = await self._repository.get(lead_id, locale=locale)
        if archived is None:
            raise RuntimeError("Archived lead could not be reloaded")
        return self._detail(archived)

    async def _prepare_update(
        self, payload: LeadUpdate, current: dict[str, Any]
    ) -> tuple[dict[str, Any], set[str]]:
        patch = payload.model_dump(mode="python", exclude_unset=True)
        values: dict[str, Any] = {}
        changed_fields = set(patch)
        simple_mapping = {
            "first_name": "first_name",
            "last_name": "last_name",
            "email": "email",
            "intake_term": "intake_code",
            "start_year": "start_year",
            "age": "age",
            "gender": "gender_code",
            "gender_self_description": "gender_self_description",
            "occupation": "occupation",
            "marital_status": "marital_status_code",
            "message": "message",
            "locale": "locale",
        }
        for source, target in simple_mapping.items():
            if source in patch:
                values[target] = patch[source]

        if "mobile" in patch:
            values["mobile_raw"] = patch["mobile"]
            values["mobile_normalized"] = normalize_mobile(patch["mobile"])

        country_changed = bool(
            {"desired_country_id", "desired_country_text"} & payload.model_fields_set
        )
        if country_changed:
            country_id = patch.get("desired_country_id")
            if country_id is not None and not await self._repository.country_is_public(country_id):
                raise self._invalid_reference("desiredCountryId")
            values["desired_country_id"] = country_id
            values["desired_country_text"] = patch.get("desired_country_text")

        if "investment_budget" in patch:
            budget = patch["investment_budget"]
            if budget is None:
                values["investment_range_code"] = None
                values["investment_currency"] = None
            else:
                currency = budget["currency"]
                if not await self._repository.currency_is_active(currency):
                    raise self._invalid_reference("investmentBudget.currency")
                values["investment_range_code"] = budget["range_code"]
                values["investment_currency"] = currency

        gender = values.get("gender_code", current["gender"])
        description = values.get("gender_self_description", current["gender_self_description"])
        if gender == GenderCode.SELF_DESCRIBED:
            if not description:
                raise ApplicationError(
                    code="INVALID_GENDER_DESCRIPTION",
                    message="A self-described gender requires a description.",
                    status_code=422,
                    field_errors={"genderSelfDescription": ["REQUIRED"]},
                )
        elif description:
            if "gender" in patch and "gender_self_description" not in patch:
                values["gender_self_description"] = None
            else:
                raise ApplicationError(
                    code="INVALID_GENDER_DESCRIPTION",
                    message="Gender description is accepted only for self-described gender.",
                    status_code=422,
                    field_errors={"genderSelfDescription": ["NOT_ALLOWED"]},
                )

        mobile = values.get("mobile_normalized", current["mobile"])
        country_id = values.get("desired_country_id", current["desired_country_id"])
        country_text = values.get("desired_country_text", current["desired_country_text"])
        intake = values.get("intake_code", current["intake_term"])
        year = values.get("start_year", current["start_year"])
        values["deduplication_key"] = self._deduplication_key(
            mobile=mobile,
            country_id=country_id,
            country_text=country_text,
            intake=intake,
            year=year,
        )
        return values, changed_fields

    def _assigned_scope(self, actor: AuthorizationContext) -> UUID | None:
        if actor.allows(self.READ_ALL):
            return None
        if actor.allows(self.READ_ASSIGNED):
            return actor.user_id
        raise ApplicationError(
            code="PERMISSION_DENIED",
            message="You do not have permission to view consultation leads.",
            status_code=403,
        )

    def _require_write(self, actor: AuthorizationContext) -> None:
        if not actor.allows(self.WRITE_ALL):
            raise ApplicationError(
                code="PERMISSION_DENIED",
                message="You do not have permission to edit consultation leads.",
                status_code=403,
            )

    @classmethod
    def _summary(cls, row: dict[str, Any]) -> LeadSummary:
        return LeadSummary(
            id=row["id"],
            reference=row["reference"],
            first_name=row["first_name"],
            last_name=row["last_name"],
            mobile=row["mobile"],
            email=row["email"],
            desired_country_id=row["desired_country_id"],
            desired_country_name=row["desired_country_name"],
            desired_country_text=row["desired_country_text"],
            intake_term=row["intake_term"],
            start_year=row["start_year"],
            status=row["status"],
            sync_status=row["sync_status"],
            assignee=cls._assignee(row),
            archived=row["archived"],
            version=row["version"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    @classmethod
    def _detail(cls, row: dict[str, Any]) -> LeadDetail:
        summary = cls._summary(row)
        return LeadDetail(
            **summary.model_dump(),
            mobile_raw=row["mobile_raw"],
            age=row["age"],
            gender=row["gender"],
            gender_self_description=row["gender_self_description"],
            occupation=row["occupation"],
            marital_status=row["marital_status"],
            investment_range_code=row["investment_range_code"],
            investment_currency=row["investment_currency"],
            message=row["message"],
            locale=row["locale"],
            source_url=row["source_url"],
            source_university_id=row["source_university_id"],
            source_program_id=row["source_program_id"],
            duplicate_count=row["duplicate_count"],
            last_duplicate_at=row["last_duplicate_at"],
            sync_external_id=row["sync_external_id"],
            sync_attempt_count=row["sync_attempt_count"],
            sync_last_attempt_at=row["sync_last_attempt_at"],
            sync_synced_at=row["sync_synced_at"],
            archived_at=row["archived_at"],
            archived_by_user_id=row["archived_by_user_id"],
            archive_reason=row["archive_reason"],
        )

    @staticmethod
    def _assignee(row: dict[str, Any]) -> LeadAssignee | None:
        if row["assignee_id"] is None:
            return None
        return LeadAssignee(
            id=row["assignee_id"],
            first_name=row["assignee_first_name"],
            last_name=row["assignee_last_name"],
            email=row["assignee_email"],
        )

    @staticmethod
    def _deduplication_key(
        *,
        mobile: str,
        country_id: UUID | None,
        country_text: str | None,
        intake: str,
        year: int,
    ) -> str:
        country = (
            str(country_id) if country_id else " ".join((country_text or "").split()).casefold()
        )
        return hashlib.sha256(f"{mobile}|{country}|{intake}|{year}".encode()).hexdigest()

    @staticmethod
    def _not_found() -> ApplicationError:
        return ApplicationError(
            code="LEAD_NOT_FOUND",
            message="The consultation lead was not found.",
            status_code=404,
        )

    @staticmethod
    def _stale() -> ApplicationError:
        return ApplicationError(
            code="STALE_WRITE",
            message="The lead changed after it was loaded. Reload it and try again.",
            status_code=412,
        )

    @staticmethod
    def _archived() -> ApplicationError:
        return ApplicationError(
            code="LEAD_ARCHIVED",
            message="Archived leads are read-only.",
            status_code=409,
        )

    @staticmethod
    def _invalid_reference(field: str) -> ApplicationError:
        return ApplicationError(
            code="REFERENCE_NOT_FOUND",
            message="A selected reference does not exist or is unavailable.",
            status_code=422,
            field_errors={field: ["REFERENCE_NOT_FOUND"]},
        )
