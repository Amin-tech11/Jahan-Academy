from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.core.config import Settings, get_settings
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions
from app.modules.integrations.adapter import HttpNouraLeadAdapter
from app.modules.integrations.repository import NouraRepository
from app.modules.integrations.schemas import NouraRetryEnvelope, NouraRetryRequest
from app.modules.integrations.service import NouraSyncService

router = APIRouter(tags=["integrations"])


def noura_service(
    session: Annotated[AsyncSession, Depends(database_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> NouraSyncService:
    return NouraSyncService(
        NouraRepository(session),
        HttpNouraLeadAdapter(
            base_url=settings.noura_base_url,
            timeout_seconds=settings.noura_timeout_seconds,
            mock_outcome=settings.noura_mock_outcome,
        ),
    )


@router.post(
    "/admin/leads/{lead_id}/noura-retry",
    response_model=NouraRetryEnvelope,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Retry failed Noura lead synchronization",
)
async def retry_noura_sync(
    lead_id: UUID,
    service: Annotated[NouraSyncService, Depends(noura_service)],
    actor: Annotated[
        AuthorizationContext,
        Depends(require_permissions("lead.sync.retry")),
    ],
    payload: NouraRetryRequest | None = None,
) -> NouraRetryEnvelope:
    receipt = await service.request_manual_retry(
        lead_id,
        actor,
        note=payload.note if payload else None,
    )
    return NouraRetryEnvelope(data=receipt)
