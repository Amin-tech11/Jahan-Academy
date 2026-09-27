from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


def _camel(value: str) -> str:
    first, *rest = value.split("_")
    return first + "".join(part.capitalize() for part in rest)


class AuditModel(BaseModel):
    model_config = ConfigDict(alias_generator=_camel, populate_by_name=True, extra="forbid")


class AuditLogView(AuditModel):
    id: UUID
    actor_user_id: UUID | None
    action: str
    entity_type: str
    entity_id: UUID | None
    before_safe: dict[str, object] | None
    after_safe: dict[str, object] | None
    created_at: datetime


class AuditLogPageMeta(AuditModel):
    page: int
    limit: int
    total: int


class AuditLogPage(AuditModel):
    data: list[AuditLogView]
    meta: AuditLogPageMeta
