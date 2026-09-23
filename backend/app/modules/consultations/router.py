from __future__ import annotations

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Request, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.core.config import Settings, get_settings
from app.core.redis import get_redis
from app.modules.consultations.domain import (
    LeadArchiveFilter,
    LeadSort,
    LeadStatus,
    SyncStatus,
)
from app.modules.consultations.lead_repository import LeadRepository
from app.modules.consultations.lead_schemas import (
    LeadArchiveRequest,
    LeadEnvelope,
    LeadPage,
    LeadUpdate,
)
from app.modules.consultations.lead_service import LeadService
from app.modules.consultations.rate_limit import ConsultationRateLimiter
from app.modules.consultations.repository import ConsultationRepository
from app.modules.consultations.schemas import (
    ConsultationCreate,
    ConsultationReceipt,
    ConsultationReceiptEnvelope,
)
from app.modules.consultations.service import ConsultationService
from app.modules.identity.authorization import AuthorizationContext, PermissionMode
from app.modules.identity.dependencies import require_permissions
from app.shared.exceptions import ApplicationError

router = APIRouter(tags=["consultations"])
admin_router = APIRouter(prefix="/admin/leads", tags=["lead-operations"])


def consultation_service(
    session: Annotated[AsyncSession, Depends(database_session)],
    redis: Annotated[Redis, Depends(get_redis)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> ConsultationService:
    limiter = ConsultationRateLimiter(
        redis,
        limit=settings.consultation_rate_limit,
        window_seconds=settings.consultation_rate_window_seconds,
    )
    return ConsultationService(ConsultationRepository(session), limiter, settings)


def lead_service(
    session: Annotated[AsyncSession, Depends(database_session)],
) -> LeadService:
    return LeadService(LeadRepository(session))


@router.post(
    "/consultation-requests",
    response_model=ConsultationReceiptEnvelope,
    status_code=status.HTTP_201_CREATED,
    responses={200: {"description": "A matching recent request already exists"}},
    summary="Submit a public consultation request",
)
async def submit_consultation_request(
    payload: ConsultationCreate,
    request: Request,
    response: Response,
    service: Annotated[ConsultationService, Depends(consultation_service)],
    idempotency_key: Annotated[
        str | None,
        Header(
            alias="Idempotency-Key",
            min_length=16,
            max_length=128,
            pattern=r"^[A-Za-z0-9._:-]+$",
        ),
    ] = None,
) -> ConsultationReceiptEnvelope:
    # Forwarded headers are intentionally ignored until trusted proxies are configured.
    client_ip = request.client.host if request.client else "unknown"
    result = await service.submit(
        payload,
        idempotency_key=idempotency_key,
        client_ip=client_ip,
        user_agent=request.headers.get("user-agent", "")[:500],
    )
    response.status_code = result.status_code
    response.headers["Cache-Control"] = "no-store"
    return ConsultationReceiptEnvelope(
        data=ConsultationReceipt(
            reference=result.receipt.reference,
            duplicate=result.receipt.duplicate,
            received_at=result.receipt.received_at,
            message=result.receipt.message,
        )
    )


@admin_router.get(
    "",
    response_model=LeadPage,
    response_model_exclude_none=True,
    summary="Search and list consultation leads",
)
async def list_leads(
    service: Annotated[LeadService, Depends(lead_service)],
    actor: Annotated[
        AuthorizationContext,
        Depends(
            require_permissions(
                "lead.read.all",
                "lead.read.assigned",
                mode=PermissionMode.ANY,
            )
        ),
    ],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    q: Annotated[str | None, Query(min_length=2, max_length=100)] = None,
    lead_status: Annotated[LeadStatus | None, Query(alias="status")] = None,
    sync_status: Annotated[SyncStatus | None, Query(alias="syncStatus")] = None,
    assignee_id: Annotated[UUID | None, Query(alias="assigneeId")] = None,
    country_id: Annotated[UUID | None, Query(alias="countryId")] = None,
    created_from: Annotated[datetime | None, Query(alias="from")] = None,
    created_to: Annotated[datetime | None, Query(alias="to")] = None,
    archive: LeadArchiveFilter = LeadArchiveFilter.ACTIVE,
    sort: LeadSort = LeadSort.CREATED_DESC,
) -> LeadPage:
    _validate_date_range(created_from, created_to)
    return await service.list(
        actor,
        locale=locale,
        page=page,
        limit=limit,
        query=q,
        status=lead_status,
        sync_status=sync_status,
        assignee_id=assignee_id,
        country_id=country_id,
        created_from=created_from,
        created_to=created_to,
        archive=archive,
        sort=sort,
    )


@admin_router.get(
    "/{lead_id}",
    response_model=LeadEnvelope,
    response_model_exclude_none=True,
    summary="View a consultation lead",
)
async def get_lead(
    lead_id: UUID,
    response: Response,
    service: Annotated[LeadService, Depends(lead_service)],
    actor: Annotated[
        AuthorizationContext,
        Depends(
            require_permissions(
                "lead.read.all",
                "lead.read.assigned",
                mode=PermissionMode.ANY,
            )
        ),
    ],
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> LeadEnvelope:
    lead = await service.get(lead_id, actor, locale=locale)
    response.headers["ETag"] = _etag(lead.version)
    response.headers["Cache-Control"] = "no-store"
    return LeadEnvelope(data=lead)


@admin_router.patch(
    "/{lead_id}",
    response_model=LeadEnvelope,
    response_model_exclude_none=True,
    summary="Edit a consultation lead",
)
async def update_lead(
    lead_id: UUID,
    payload: LeadUpdate,
    response: Response,
    service: Annotated[LeadService, Depends(lead_service)],
    actor: Annotated[
        AuthorizationContext,
        Depends(require_permissions("lead.write.all")),
    ],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> LeadEnvelope:
    lead = await service.update(
        lead_id,
        payload,
        actor,
        locale=locale,
        expected_version=_parse_if_match(if_match),
    )
    response.headers["ETag"] = _etag(lead.version)
    response.headers["Cache-Control"] = "no-store"
    return LeadEnvelope(data=lead)


@admin_router.post(
    "/{lead_id}/archive",
    response_model=LeadEnvelope,
    response_model_exclude_none=True,
    summary="Archive a consultation lead",
)
async def archive_lead(
    lead_id: UUID,
    payload: LeadArchiveRequest,
    response: Response,
    service: Annotated[LeadService, Depends(lead_service)],
    actor: Annotated[
        AuthorizationContext,
        Depends(require_permissions("lead.write.all")),
    ],
    if_match: Annotated[str | None, Header(alias="If-Match")] = None,
    locale: Annotated[str, Query(pattern=r"^(fa|en)$")] = "fa",
) -> LeadEnvelope:
    lead = await service.archive(
        lead_id,
        actor,
        locale=locale,
        reason=payload.reason,
        expected_version=_parse_if_match(if_match),
    )
    response.headers["ETag"] = _etag(lead.version)
    response.headers["Cache-Control"] = "no-store"
    return LeadEnvelope(data=lead)


def _etag(version: int) -> str:
    return f'"{version}"'


def _parse_if_match(value: str | None) -> int:
    if value is None:
        raise ApplicationError(
            code="PRECONDITION_REQUIRED",
            message="If-Match is required for this operation.",
            status_code=428,
        )
    normalized = value.strip()
    if normalized.startswith("W/"):
        normalized = normalized[2:]
    normalized = normalized.strip('"')
    if not normalized.isdigit() or int(normalized) < 1:
        raise ApplicationError(
            code="INVALID_IF_MATCH",
            message="If-Match must contain a valid lead version.",
            status_code=400,
        )
    return int(normalized)


def _validate_date_range(created_from: datetime | None, created_to: datetime | None) -> None:
    if created_from and created_to and created_from > created_to:
        raise ApplicationError(
            code="INVALID_DATE_RANGE",
            message="The from timestamp must not be after the to timestamp.",
            status_code=422,
            field_errors={"from": ["AFTER_TO"]},
        )


router.include_router(admin_router)
