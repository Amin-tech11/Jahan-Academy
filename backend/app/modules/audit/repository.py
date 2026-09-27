from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


class AuditLogRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list(
        self,
        *,
        page: int,
        limit: int,
        action: str | None,
        entity_type: str | None,
        actor_user_id: UUID | None,
    ) -> tuple[list[Any], int]:
        params = {
            "action": action,
            "entity_type": entity_type,
            "actor_user_id": actor_user_id,
            "limit": limit,
            "offset": (page - 1) * limit,
        }
        rows = await self._session.execute(
            text(
                """
                SELECT id, actor_user_id, action, entity_type, entity_id,
                       before_safe, after_safe, created_at
                FROM audit_logs
                WHERE (CAST(:action AS text) IS NULL OR action = :action)
                  AND (CAST(:entity_type AS text) IS NULL OR entity_type = :entity_type)
                  AND (CAST(:actor_user_id AS uuid) IS NULL OR actor_user_id = :actor_user_id)
                ORDER BY created_at DESC, id DESC LIMIT :limit OFFSET :offset
                """
            ),
            params,
        )
        total = await self._session.scalar(
            text(
                """
                SELECT count(*) FROM audit_logs
                WHERE (CAST(:action AS text) IS NULL OR action = :action)
                  AND (CAST(:entity_type AS text) IS NULL OR entity_type = :entity_type)
                  AND (CAST(:actor_user_id AS uuid) IS NULL OR actor_user_id = :actor_user_id)
                """
            ),
            params,
        )
        return list(rows.mappings()), int(total or 0)
