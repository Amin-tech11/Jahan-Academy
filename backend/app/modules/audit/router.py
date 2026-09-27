from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import database_session
from app.modules.audit.repository import AuditLogRepository
from app.modules.audit.schemas import AuditLogPage, AuditLogPageMeta, AuditLogView
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.dependencies import require_permissions

router = APIRouter(prefix="/admin/audit-logs", tags=["audit-logs"])


@router.get("", response_model=AuditLogPage)
async def list_audit_logs(
    session: Annotated[AsyncSession, Depends(database_session)],
    _: Annotated[AuthorizationContext, Depends(require_permissions("audit.read"))],
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    action: str | None = Query(default=None, min_length=1, max_length=100),
    entity_type: str | None = Query(default=None, min_length=1, max_length=60),
    actor_user_id: UUID | None = None,
) -> AuditLogPage:
    rows, total = await AuditLogRepository(session).list(
        page=page,
        limit=limit,
        action=action,
        entity_type=entity_type,
        actor_user_id=actor_user_id,
    )
    return AuditLogPage(
        data=[AuditLogView.model_validate(row) for row in rows],
        meta=AuditLogPageMeta(page=page, limit=limit, total=total),
    )
