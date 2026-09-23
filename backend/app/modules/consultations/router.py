from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, Request, Response, status
from redis.asyncio import Redis
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.core.config import Settings, get_settings
from app.core.redis import get_redis
from app.modules.consultations.rate_limit import ConsultationRateLimiter
from app.modules.consultations.repository import ConsultationRepository
from app.modules.consultations.schemas import (
    ConsultationCreate,
    ConsultationReceipt,
    ConsultationReceiptEnvelope,
)
from app.modules.consultations.service import ConsultationService

router = APIRouter(tags=["consultations"])


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
