from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import UTC, datetime, timedelta
from math import ceil
from typing import Any
from uuid import UUID

from app.core.config import Settings
from app.modules.identity.authorization import AuthorizationContext
from app.modules.identity.domain import StaffRoleCode
from app.modules.identity.mailer import AuthMailer
from app.modules.identity.schemas import (
    StaffAccessRecoveryRequest,
    StaffCreateRequest,
    StaffPage,
    StaffPageMeta,
    StaffRolesUpdateRequest,
    StaffRoleView,
    StaffUpdateRequest,
    StaffView,
)
from app.modules.identity.security import AuthSecurity
from app.modules.identity.staff_repository import StaffRepository
from app.shared.exceptions import ApplicationError

logger = logging.getLogger(__name__)


class StaffManagementService:
    """Use-cases for privileged lifecycle management of internal accounts."""

    def __init__(
        self,
        *,
        repository: StaffRepository,
        security: AuthSecurity,
        mailer: AuthMailer,
        settings: Settings,
    ) -> None:
        self._repository = repository
        self._security = security
        self._mailer = mailer
        self._settings = settings

    @staticmethod
    def _require_super_admin(actor: AuthorizationContext) -> None:
        if not any(
            grant.role == StaffRoleCode.SUPER_ADMIN.value and grant.scope_type == "global"
            for grant in actor.grants
        ):
            raise ApplicationError(
                code="PERMISSION_DENIED",
                message="Only a super administrator can manage staff accounts.",
                status_code=403,
            )

    @staticmethod
    def _safe_state(staff: StaffView) -> dict[str, object]:
        return {
            "status": str(staff.status),
            "role_codes": sorted(str(role.code) for role in staff.roles),
        }

    @staticmethod
    def _not_found() -> ApplicationError:
        return ApplicationError(
            code="STAFF_NOT_FOUND", message="The staff account was not found.", status_code=404
        )

    @staticmethod
    def _stale() -> ApplicationError:
        return ApplicationError(
            code="STAFF_VERSION_CONFLICT",
            message=(
                "This staff account changed before your request was applied. Refresh and try again."
            ),
            status_code=412,
        )

    async def create(self, actor: AuthorizationContext, payload: StaffCreateRequest) -> StaffView:
        self._require_super_admin(actor)
        email = str(payload.email).strip().casefold()
        if await self._repository.email_exists(email):
            raise ApplicationError(
                code="STAFF_EMAIL_EXISTS",
                message="An account with this email address already exists.",
                status_code=409,
            )
        role_codes = sorted(role.value for role in payload.role_codes)
        if not await self._repository.validate_role_codes(role_codes):
            raise ApplicationError(
                code="STAFF_ROLE_INVALID",
                message="One or more requested staff roles are not configured.",
                status_code=409,
            )

        staff_id = await self._repository.create_staff(
            email=email,
            password_hash=self._security.hash_password(self._security.new_opaque_token()),
            first_name=payload.first_name,
            last_name=payload.last_name,
            preferred_locale=payload.preferred_locale,
            role_codes=role_codes,
            actor_user_id=actor.user_id,
        )
        row = await self._repository.get_staff(staff_id, for_update=True)
        assert row is not None
        reset_token = self._security.new_opaque_token()
        await self._repository.issue_password_reset(
            identity_id=row["identity_id"],
            token_hash=self._security.token_hash(reset_token),
            expires_at=self._password_reset_expiry(),
        )
        staff = self._view(row)
        await self._repository.audit(
            actor_user_id=actor.user_id,
            action="staff.created",
            entity_id=staff_id,
            before=None,
            after=self._safe_state(staff),
        )
        await self._repository.session.commit()
        await self._send_recovery_email(email, reset_token)
        return staff

    async def list(
        self,
        actor: AuthorizationContext,
        *,
        page: int,
        page_size: int,
        query: str | None,
        account_status: str | None,
        role_code: StaffRoleCode | None,
    ) -> StaffPage:
        self._require_super_admin(actor)
        rows, total = await self._repository.list_staff(
            page=page,
            page_size=page_size,
            query=query,
            status=account_status,
            role_code=role_code.value if role_code else None,
        )
        return StaffPage(
            data=[self._view(row) for row in rows],
            meta=StaffPageMeta(
                page=page,
                limit=page_size,
                total=total,
                total_pages=ceil(total / page_size) if total else 0,
            ),
        )

    async def get(self, actor: AuthorizationContext, staff_id: UUID) -> StaffView:
        self._require_super_admin(actor)
        row = await self._repository.get_staff(staff_id)
        if row is None:
            raise self._not_found()
        return self._view(row)

    async def update(
        self,
        actor: AuthorizationContext,
        staff_id: UUID,
        payload: StaffUpdateRequest,
        *,
        expected_version: int,
    ) -> StaffView:
        self._require_super_admin(actor)
        row = await self._repository.get_staff(staff_id, for_update=True)
        if row is None:
            raise self._not_found()
        before = self._view(row)
        if payload.active is False:
            if staff_id == actor.user_id:
                raise ApplicationError(
                    code="SELF_DEACTIVATION_FORBIDDEN",
                    message="You cannot deactivate your own account.",
                    status_code=409,
                )
            await self._ensure_not_last_active_super_admin(before, removing_role=False)
        updated = await self._repository.update_staff(
            staff_id=staff_id,
            expected_version=expected_version,
            first_name=payload.first_name,
            last_name=payload.last_name,
            preferred_locale=payload.preferred_locale,
            active=payload.active,
        )
        if not updated:
            raise self._stale()
        if payload.active is not None:
            await self._repository.revoke_sessions(staff_id)
        refreshed = await self._repository.get_staff(staff_id)
        assert refreshed is not None
        after = self._view(refreshed)
        await self._repository.audit(
            actor_user_id=actor.user_id,
            action="staff.updated",
            entity_id=staff_id,
            before=self._safe_state(before),
            after=self._safe_state(after),
        )
        await self._repository.session.commit()
        return after

    async def replace_roles(
        self,
        actor: AuthorizationContext,
        staff_id: UUID,
        payload: StaffRolesUpdateRequest,
        *,
        expected_version: int,
    ) -> StaffView:
        self._require_super_admin(actor)
        row = await self._repository.get_staff(staff_id, for_update=True)
        if row is None:
            raise self._not_found()
        before = self._view(row)
        role_codes = sorted(role.value for role in payload.role_codes)
        if not await self._repository.validate_role_codes(role_codes):
            raise ApplicationError(
                code="STAFF_ROLE_INVALID",
                message="One or more requested staff roles are not configured.",
                status_code=409,
            )
        removing_super_admin = (
            StaffRoleCode.SUPER_ADMIN in {role.code for role in before.roles}
            and StaffRoleCode.SUPER_ADMIN.value not in role_codes
        )
        if removing_super_admin:
            await self._ensure_not_last_active_super_admin(before, removing_role=True)
        updated = await self._repository.replace_roles(
            staff_id=staff_id,
            expected_version=expected_version,
            role_codes=role_codes,
            actor_user_id=actor.user_id,
        )
        if not updated:
            raise self._stale()
        await self._repository.revoke_sessions(staff_id)
        refreshed = await self._repository.get_staff(staff_id)
        assert refreshed is not None
        after = self._view(refreshed)
        await self._repository.audit(
            actor_user_id=actor.user_id,
            action="staff.roles_replaced",
            entity_id=staff_id,
            before=self._safe_state(before),
            after=self._safe_state(after),
        )
        await self._repository.session.commit()
        return after

    async def recover_access(
        self,
        actor: AuthorizationContext,
        staff_id: UUID,
        payload: StaffAccessRecoveryRequest,
        *,
        expected_version: int,
    ) -> StaffView:
        self._require_super_admin(actor)
        row = await self._repository.get_staff(staff_id, for_update=True)
        if row is None:
            raise self._not_found()
        before = self._view(row)
        if before.status == "disabled" and not payload.reactivate:
            raise ApplicationError(
                code="STAFF_REACTIVATION_REQUIRED",
                message="A disabled staff account must be explicitly reactivated before recovery.",
                status_code=409,
            )
        updated = await self._repository.recover_access(
            staff_id=staff_id,
            expected_version=expected_version,
            reactivate=payload.reactivate,
        )
        if not updated:
            raise self._stale()
        await self._repository.revoke_sessions(staff_id)
        reset_token = self._security.new_opaque_token()
        await self._repository.issue_password_reset(
            identity_id=row["identity_id"],
            token_hash=self._security.token_hash(reset_token),
            expires_at=self._password_reset_expiry(),
        )
        refreshed = await self._repository.get_staff(staff_id)
        assert refreshed is not None
        after = self._view(refreshed)
        await self._repository.audit(
            actor_user_id=actor.user_id,
            action="staff.access_recovery_requested",
            entity_id=staff_id,
            before=self._safe_state(before),
            after=self._safe_state(after),
        )
        await self._repository.session.commit()
        await self._send_recovery_email(after.email, reset_token)
        return after

    async def _ensure_not_last_active_super_admin(
        self, staff: StaffView, *, removing_role: bool
    ) -> None:
        is_super_admin = StaffRoleCode.SUPER_ADMIN in {role.code for role in staff.roles}
        if not is_super_admin or staff.status != "active":
            return
        await self._repository.lock_super_admin_grants()
        if await self._repository.active_super_admin_count() <= 1:
            action = "remove this role" if removing_role else "deactivate this account"
            raise ApplicationError(
                code="LAST_SUPER_ADMIN_PROTECTED",
                message=f"You cannot {action} because it is the last active super administrator.",
                status_code=409,
            )

    def _password_reset_expiry(self) -> datetime:
        return datetime.now(UTC) + timedelta(minutes=self._settings.password_reset_minutes)

    async def _send_recovery_email(self, email: str, token: str) -> None:
        try:
            await self._mailer.send_password_reset(email, token)
        except Exception:
            logger.exception("staff_access_recovery_email_failed")

    @staticmethod
    def _view(values: Mapping[str, Any]) -> StaffView:
        return StaffView(
            id=values["id"],
            email=values["email"],
            first_name=values["first_name"],
            last_name=values["last_name"],
            preferred_locale=values["preferred_locale"],
            status=values["status"],
            roles=[StaffRoleView(code=StaffRoleCode(code)) for code in values["role_codes"]],
            active=values["status"] == "active",
            email_verified=values["verified_at"] is not None,
            locked_until=values["locked_until"],
            created_at=values["created_at"],
            updated_at=values["updated_at"],
            version=values["row_version"],
        )
