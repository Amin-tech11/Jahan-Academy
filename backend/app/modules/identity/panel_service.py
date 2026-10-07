from uuid import UUID

from sqlalchemy import text

from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.panel_access import ALL_SECTIONS, DEFAULT_SECTIONS
from app.modules.identity.schemas import PanelAccessView
from app.modules.identity.staff_repository import StaffRepository
from app.modules.identity.staff_service import StaffManagementService
from app.shared.exceptions import ApplicationError


class PanelAccessService:
    def __init__(self, repository: StaffRepository) -> None:
        self.repository = repository

    async def get(self, actor: AuthorizationContext, staff_id: UUID) -> PanelAccessView:
        StaffManagementService._require_super_admin(actor)
        row = await self.repository.get_staff(staff_id)
        if row is None:
            raise StaffManagementService._not_found()
        saved = await self.repository.session.scalar(
            text("SELECT sections FROM staff_panel_access WHERE user_id = :id"), {"id": staff_id}
        )
        super_admin = "super_admin" in row["role_codes"]
        sections = ALL_SECTIONS if super_admin else saved if saved is not None else DEFAULT_SECTIONS
        return PanelAccessView(
            sections=sorted(sections), is_super_admin=super_admin, version=row["row_version"]
        )

    async def replace(
        self,
        actor: AuthorizationContext,
        staff_id: UUID,
        sections: list[str],
        expected_version: int,
    ) -> PanelAccessView:
        StaffManagementService._require_super_admin(actor)
        row = await self.repository.get_staff(staff_id, for_update=True)
        if row is None:
            raise StaffManagementService._not_found()
        if row["row_version"] != expected_version:
            raise StaffManagementService._stale()
        if "super_admin" in row["role_codes"]:
            raise ApplicationError(
                code="SUPER_ADMIN_ACCESS_PROTECTED",
                message="Super administrators always retain full panel access.",
                status_code=409,
            )
        before = await self.get(actor, staff_id)
        await self.repository.session.execute(
            text("""
                INSERT INTO staff_panel_access (user_id, sections, updated_by_user_id)
                VALUES (:id, :sections, :actor)
                ON CONFLICT (user_id) DO UPDATE SET sections = EXCLUDED.sections,
                    updated_by_user_id = EXCLUDED.updated_by_user_id, updated_at = now()
            """),
            {"id": staff_id, "sections": sorted(sections), "actor": actor.user_id},
        )
        await self.repository.session.execute(
            text(
                "UPDATE users SET row_version = row_version + 1, updated_at = now() WHERE id = :id"
            ),
            {"id": staff_id},
        )
        await self.repository.audit(
            actor_user_id=actor.user_id,
            action="staff.panel_access_updated",
            entity_id=staff_id,
            before={"sections": before.sections},
            after={"sections": sorted(sections)},
        )
        await self.repository.session.commit()
        return await self.get(actor, staff_id)
