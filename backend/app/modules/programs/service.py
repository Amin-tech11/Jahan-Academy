from __future__ import annotations

import json
from math import ceil
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.modules.programs.domain import ApplicationFeeMode, StaleProgramError
from app.modules.programs.repository import ProgramRepository
from app.modules.programs.schemas import (
    ApplicationFeeView,
    ProgramIntakeView,
    ProgramPage,
    ProgramPageMeta,
    ProgramRequirementView,
    ProgramTranslationView,
    ProgramView,
    ReferenceSummary,
    TuitionView,
    UniversitySummary,
)
from app.shared.exceptions import ApplicationError


class ProgramService:
    def __init__(self, repository: ProgramRepository) -> None:
        self._repository = repository

    async def list_public(self, **filters: Any) -> ProgramPage:
        return await self._list(public_only=True, status=None, **filters)

    async def list_admin(self, **filters: Any) -> ProgramPage:
        return await self._list(public_only=False, **filters)

    async def _list(self, **filters: Any) -> ProgramPage:
        rows, total = await self._repository.list_items(**filters)
        rows = await self._repository.hydrate_list(rows, filters["locale"])
        return ProgramPage(
            data=[self._view(row, admin=False) for row in rows],
            meta=ProgramPageMeta(
                page=filters["page"],
                limit=filters["limit"],
                total=total,
                total_pages=ceil(total / filters["limit"]) if total else 0,
            ),
        )

    async def get_public(self, slug: str, locale: str) -> ProgramView:
        row = await self._repository.get(locale=locale, slug=slug, public_only=True)
        if row is None:
            raise self._not_found()
        return self._view(row, admin=False)

    async def get_admin(self, program_id: UUID, locale: str) -> ProgramView:
        row = await self._repository.get(locale=locale, program_id=program_id)
        if row is None:
            raise self._not_found()
        return self._view(row, admin=True)

    async def create(
        self, payload: dict[str, Any], actor_user_id: UUID, locale: str
    ) -> ProgramView:
        prepared = await self._prepare(payload)
        base, translations, fields, intakes, requirements, _ = prepared
        try:
            program_id = await self._repository.create(base)
            await self._repository.replace_children(
                program_id,
                translations,
                fields,
                base["primary_field_id"],
                intakes,
                requirements,
            )
            row = await self._require(program_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="program.created",
                program_id=program_id,
                before=None,
                after=row,
            )
            await self._repository.session.commit()
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict(exc) from exc
        return self._view(row, admin=True)

    async def update(
        self,
        program_id: UUID,
        payload: dict[str, Any],
        actor_user_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ProgramView:
        before = await self._repository.get(locale=locale, program_id=program_id)
        if before is None:
            raise self._not_found()
        base, translations, fields, intakes, requirements, university_status = await self._prepare(
            payload
        )
        if before["status"] == "published":
            self._ensure_publishable(base, translations, intakes, university_status)
        try:
            await self._repository.update_base(program_id, base, expected_version)
            await self._repository.replace_children(
                program_id,
                translations,
                fields,
                base["primary_field_id"],
                intakes,
                requirements,
            )
            row = await self._require(program_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="program.updated",
                program_id=program_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleProgramError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        except IntegrityError as exc:
            await self._repository.session.rollback()
            raise self._conflict(exc) from exc
        return self._view(row, admin=True)

    async def publish(
        self, program_id: UUID, actor_user_id: UUID, expected_version: int, locale: str
    ) -> ProgramView:
        before = await self._repository.get(locale=locale, program_id=program_id)
        if before is None:
            raise self._not_found()
        refs = await self._repository.reference_context(
            before["university_id"],
            before["academic_level_id"],
            [item["id"] for item in before["fields"]],
            [item["intake_id"] for item in before["intakes"]],
            [
                currency
                for currency in (
                    before.get("tuition_currency"),
                    before.get("application_fee_currency"),
                )
                if currency
            ],
        )
        self._ensure_publishable(
            before,
            before["translations"],
            [
                {
                    "status": item["status"],
                    "application_deadline": item["application_deadline"],
                }
                for item in before["intakes"]
            ],
            refs["university"]["status"] if refs["university"] else None,
        )
        try:
            await self._repository.publish(program_id, expected_version)
            row = await self._require(program_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="program.published",
                program_id=program_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleProgramError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._view(row, admin=True)

    async def archive(
        self,
        program_id: UUID,
        reason: str,
        actor_user_id: UUID,
        expected_version: int,
        locale: str,
    ) -> ProgramView:
        before = await self._repository.get(locale=locale, program_id=program_id)
        if before is None:
            raise self._not_found()
        try:
            await self._repository.archive(program_id, actor_user_id, reason, expected_version)
            row = await self._require(program_id, locale)
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="program.archived",
                program_id=program_id,
                before=before,
                after=row,
            )
            await self._repository.session.commit()
        except StaleProgramError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc
        return self._view(row, admin=True)

    async def delete_draft(
        self, program_id: UUID, actor_user_id: UUID, expected_version: int, locale: str
    ) -> None:
        before = await self._repository.get(locale=locale, program_id=program_id)
        if before is None:
            raise self._not_found()
        try:
            outcome = await self._repository.hard_delete_draft(program_id, expected_version)
            if outcome == "not_draft":
                raise ApplicationError(
                    "PROGRAM_DELETE_FORBIDDEN",
                    "Only a draft program can be permanently deleted; archive it instead.",
                    409,
                )
            if outcome == "dependent":
                raise ApplicationError(
                    "PROGRAM_HAS_DEPENDENCIES",
                    "This program has applications and cannot be permanently deleted.",
                    409,
                )
            await self._repository.audit(
                actor_user_id=actor_user_id,
                action="program.deleted",
                program_id=program_id,
                before=before,
                after=None,
            )
            await self._repository.session.commit()
        except StaleProgramError as exc:
            await self._repository.session.rollback()
            raise self._stale() from exc

    async def _prepare(
        self, payload: dict[str, Any]
    ) -> tuple[
        dict[str, Any],
        dict[str, dict[str, Any]],
        list[UUID],
        list[dict[str, Any]],
        list[dict[str, Any]],
        str | None,
    ]:
        values = dict(payload)
        translations = values.pop("translations")
        field_ids = values.pop("field_ids")
        intakes_payload = values.pop("intakes")
        requirements_payload = values.pop("requirements")
        tuition = values.pop("tuition")
        application_fee = values.pop("application_fee")
        currencies = [
            currency
            for currency in (tuition.get("currency"), application_fee.get("currency"))
            if currency
        ]
        refs = await self._repository.reference_context(
            values["university_id"],
            values["academic_level_id"],
            field_ids,
            [item["intake_id"] for item in intakes_payload],
            currencies,
        )
        errors: dict[str, list[str]] = {}
        if refs["university"] is None:
            errors["universityId"] = ["REFERENCE_NOT_FOUND"]
        if not refs["level"]:
            errors["academicLevelId"] = ["REFERENCE_NOT_FOUND"]
        if refs["missing_fields"]:
            errors["fieldIds"] = ["REFERENCE_NOT_FOUND"]
        if refs["missing_intakes"]:
            errors["intakes"] = ["REFERENCE_NOT_FOUND"]
        if refs["missing_currencies"]:
            errors["currency"] = ["REFERENCE_NOT_FOUND"]
        if errors:
            raise ApplicationError(
                "PROGRAM_VALIDATION_FAILED",
                "One or more program references are invalid.",
                422,
                errors,
            )
        fee_mode = application_fee["mode"]
        base = {
            **values,
            "duration_unit": values["duration_unit"].value if values.get("duration_unit") else None,
            "tuition_mode": tuition["mode"].value,
            "tuition_min_minor": tuition.get("minimum_minor"),
            "tuition_max_minor": tuition.get("maximum_minor"),
            "tuition_currency": tuition.get("currency"),
            "application_fee_mode": fee_mode.value,
            "application_fee_minor": (
                0 if fee_mode is ApplicationFeeMode.FREE else application_fee.get("amount_minor")
            ),
            "application_fee_currency": application_fee.get("currency"),
        }
        intakes = [
            {
                "intake_id": item["intake_id"],
                "intake_year": item["year"],
                "application_deadline": item["application_deadline"],
                "status": item["status"].value,
                "notes_fa": item.get("notes_fa"),
                "notes_en": item.get("notes_en"),
            }
            for item in intakes_payload
        ]
        requirements = [
            {
                "requirement_type": item["requirement_type"],
                "code": item.get("code"),
                "required": item["required"],
                "value_json": json.dumps(item["value"], default=str),
                "description_fa": item.get("description_fa"),
                "description_en": item.get("description_en"),
                "display_order": item["display_order"],
            }
            for item in requirements_payload
        ]
        university_status = refs["university"]["status"] if refs["university"] else None
        return base, translations, field_ids, intakes, requirements, university_status

    @staticmethod
    def _ensure_publishable(
        base: dict[str, Any],
        translations: dict[str, dict[str, Any]],
        intakes: list[dict[str, Any]],
        university_status: str | None,
    ) -> None:
        errors: dict[str, list[str]] = {}
        if university_status != "published":
            errors["universityId"] = ["UNIVERSITY_NOT_PUBLISHED"]
        if not base.get("official_url"):
            errors["officialUrl"] = ["REQUIRED_FOR_PUBLICATION"]
        if not base.get("teaching_language_code"):
            errors["teachingLanguageCode"] = ["REQUIRED_FOR_PUBLICATION"]
        if not intakes or not any(item["status"] != "cancelled" for item in intakes):
            errors["intakes"] = ["ACTIVE_INTAKE_REQUIRED"]
        for locale in ("fa", "en"):
            if not translations.get(locale, {}).get("admission_requirements"):
                errors[f"translations.{locale}.admissionRequirements"] = [
                    "REQUIRED_FOR_PUBLICATION"
                ]
        if errors:
            raise ApplicationError(
                "PROGRAM_INCOMPLETE",
                "The program is not complete enough to publish.",
                422,
                errors,
            )

    async def _require(self, program_id: UUID, locale: str) -> dict[str, Any]:
        row = await self._repository.get(locale=locale, program_id=program_id)
        if row is None:
            raise RuntimeError("Program unexpectedly disappeared")
        return row

    @staticmethod
    def _view(row: dict[str, Any], *, admin: bool) -> ProgramView:
        translations = None
        if admin:
            translations = {
                locale: ProgramTranslationView(**translation)
                for locale, translation in row.get("translations", {}).items()
            }
        intakes = [
            ProgramIntakeView(
                id=item["id"],
                intake=ReferenceSummary(
                    id=item["intake_id"], name=item["intake_name"], code=item["intake_code"]
                ),
                year=item["year"],
                application_deadline=item["application_deadline"],
                status=item["status"],
                notes_fa=item.get("notes_fa"),
                notes_en=item.get("notes_en"),
            )
            for item in row.get("intakes", [])
        ]
        requirements = [ProgramRequirementView(**item) for item in row.get("requirements", [])]
        return ProgramView(
            id=row["id"],
            slug=row["slug"],
            title=row["title"],
            short_description=row.get("short_description"),
            body=row.get("body"),
            admission_requirements=row.get("admission_requirements"),
            seo_title=row.get("seo_title"),
            seo_description=row.get("seo_description"),
            university=UniversitySummary(
                id=row["university_id"], slug=row["university_slug"], name=row["university_name"]
            ),
            academic_level=ReferenceSummary(
                id=row["academic_level_id"], name=row["level_name"], code=row["level_code"]
            ),
            primary_field=ReferenceSummary(
                id=row["primary_field_id"],
                name=row["primary_field_name"],
                code=row["primary_field_code"],
            ),
            fields=[ReferenceSummary(**item) for item in row.get("fields", [])],
            duration_value=row.get("duration_value"),
            duration_unit=row.get("duration_unit"),
            tuition=TuitionView(
                mode=row["tuition_mode"],
                minimum_minor=row.get("tuition_min_minor"),
                maximum_minor=row.get("tuition_max_minor"),
                currency=row.get("tuition_currency"),
            ),
            application_fee=ApplicationFeeView(
                mode=row["application_fee_mode"],
                amount_minor=row.get("application_fee_minor"),
                currency=row.get("application_fee_currency"),
            ),
            teaching_language_code=row.get("teaching_language_code"),
            official_url=row.get("official_url"),
            status=row["status"],
            featured=row["featured"],
            intakes=intakes,
            requirements=requirements,
            translations=translations,
            published_at=row.get("published_at"),
            archived_at=row.get("archived_at"),
            archived_by_user_id=row.get("archived_by_user_id"),
            archive_reason=row.get("archive_reason"),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            version=row["row_version"],
        )

    @staticmethod
    def _not_found() -> ApplicationError:
        return ApplicationError("PROGRAM_NOT_FOUND", "The program was not found.", 404)

    @staticmethod
    def _stale() -> ApplicationError:
        return ApplicationError(
            "STALE_WRITE", "The program changed after it was loaded. Reload and try again.", 412
        )

    @staticmethod
    def _conflict(exc: IntegrityError) -> ApplicationError:
        sqlstate = getattr(exc.orig, "sqlstate", None)
        if sqlstate == "23505":
            return ApplicationError(
                "PROGRAM_ALREADY_EXISTS",
                "A program with the same slug or intake already exists.",
                409,
            )
        if sqlstate == "23503":
            return ApplicationError(
                "REFERENCE_NOT_FOUND",
                "A referenced university, taxonomy, intake, or currency is missing.",
                422,
            )
        return ApplicationError(
            "PROGRAM_CONFLICT", "The program data conflicts with existing data.", 409
        )
