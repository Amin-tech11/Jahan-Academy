from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.modules.programs.domain import ProgramSort, ProgramStatus
from app.modules.programs.repository import ProgramRepository
from app.modules.programs.schemas import (
    ArchiveProgramRequest,
    ProgramEnvelope,
    ProgramPage,
    ProgramWrite,
)
from app.modules.programs.service import ProgramService
from app.shared.exceptions import ApplicationError

router = APIRouter(tags=["programs"])
admin_router = APIRouter(prefix="/admin/programs", tags=["program-administration"])


def program_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> ProgramService:
    return ProgramService(ProgramRepository(session))


@admin_router.get("", response_model=ProgramPage, summary="Search all academic programs")
async def list_admin_programs(
    service: Annotated[ProgramService, Depends(program_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("catalog.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    university_id: Annotated[UUID | None, Query(alias="universityId")] = None,
    country_id: Annotated[UUID | None, Query(alias="countryId")] = None,
    academic_level_id: Annotated[UUID | None, Query(alias="academicLevelId")] = None,
    field_id: Annotated[UUID | None, Query(alias="fieldId")] = None,
    intake_id: Annotated[UUID | None, Query(alias="intakeId")] = None,
    intake_year: Annotated[int | None, Query(alias="intakeYear", ge=2020, le=2200)] = None,
    teaching_language_code: Annotated[
        str | None, Query(alias="teachingLanguage", min_length=2, max_length=20)
    ] = None,
    tuition_maximum_minor: Annotated[int | None, Query(alias="tuitionMaximumMinor", ge=0)] = None,
    tuition_currency: Annotated[
        str | None, Query(alias="currency", pattern=r"^[A-Za-z]{3}$")
    ] = None,
    program_status: Annotated[ProgramStatus | None, Query(alias="status")] = None,
    sort: ProgramSort = ProgramSort.UPDATED_DESC,
) -> ProgramPage:
    return await service.list_admin(
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        university_id=university_id,
        country_id=country_id,
        academic_level_id=academic_level_id,
        field_id=field_id,
        intake_id=intake_id,
        intake_year=intake_year,
        teaching_language_code=(
            teaching_language_code.casefold() if teaching_language_code else None
        ),
        tuition_maximum_minor=tuition_maximum_minor,
        tuition_currency=tuition_currency.upper() if tuition_currency else None,
        status=program_status.value if program_status else None,
        sort=sort,
    )


@admin_router.post(
    "",
    response_model=ProgramEnvelope,
    status_code=status.HTTP_201_CREATED,
    summary="Create a bilingual academic program draft",
)
async def create_program(
    payload: ProgramWrite,
    response: Response,
    service: Annotated[ProgramService, Depends(program_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ProgramEnvelope:
    item = await service.create(payload.model_dump(mode="python"), actor.user_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return ProgramEnvelope(data=item)


@admin_router.get(
    "/{program_id}", response_model=ProgramEnvelope, summary="View one academic program"
)
async def get_admin_program(
    program_id: UUID,
    response: Response,
    service: Annotated[ProgramService, Depends(program_service)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("catalog.read"))],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ProgramEnvelope:
    item = await service.get_admin(program_id, locale)
    response.headers["ETag"] = _etag(item.version)
    return ProgramEnvelope(data=item)


@admin_router.put(
    "/{program_id}", response_model=ProgramEnvelope, summary="Replace an academic program"
)
async def update_program(
    program_id: UUID,
    payload: ProgramWrite,
    response: Response,
    service: Annotated[ProgramService, Depends(program_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ProgramEnvelope:
    item = await service.update(
        program_id,
        payload.model_dump(mode="python"),
        actor.user_id,
        _parse_if_match(if_match),
        locale,
    )
    response.headers["ETag"] = _etag(item.version)
    return ProgramEnvelope(data=item)


@admin_router.post(
    "/{program_id}/publish", response_model=ProgramEnvelope, summary="Publish a complete program"
)
async def publish_program(
    program_id: UUID,
    response: Response,
    service: Annotated[ProgramService, Depends(program_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ProgramEnvelope:
    item = await service.publish(program_id, actor.user_id, _parse_if_match(if_match), locale)
    response.headers["ETag"] = _etag(item.version)
    return ProgramEnvelope(data=item)


@admin_router.post(
    "/{program_id}/archive", response_model=ProgramEnvelope, summary="Archive a program"
)
async def archive_program(
    program_id: UUID,
    payload: ArchiveProgramRequest,
    response: Response,
    service: Annotated[ProgramService, Depends(program_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> ProgramEnvelope:
    item = await service.archive(
        program_id, payload.reason, actor.user_id, _parse_if_match(if_match), locale
    )
    response.headers["ETag"] = _etag(item.version)
    return ProgramEnvelope(data=item)


@admin_router.delete(
    "/{program_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete an unused draft"
)
async def delete_program(
    program_id: UUID,
    service: Annotated[ProgramService, Depends(program_service)],
    actor: Annotated[AuthorizationContext, Depends(require_permissions("catalog.write"))],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> Response:
    await service.delete_draft(program_id, actor.user_id, _parse_if_match(if_match), locale)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def _etag(version: int) -> str:
    return f'"{version}"'


def _parse_if_match(value: str | None) -> int:
    if value is None:
        raise ApplicationError(
            "PRECONDITION_REQUIRED", "If-Match is required for this operation.", 428
        )
    normalized = value.strip().removeprefix("W/").strip('"')
    if not normalized.isdigit() or int(normalized) < 1:
        raise ApplicationError("INVALID_IF_MATCH", "If-Match must contain a valid version.", 400)
    return int(normalized)


router.include_router(admin_router)
