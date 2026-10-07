from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum
from typing import Protocol
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity.domain import STAFF_ROLE_CODES
from app.modules.identity.panel_access import ALL_SECTIONS, DEFAULT_SECTIONS, SECTION_PERMISSIONS
from app.shared.exceptions import ApplicationError

PERMISSION_CODE_PATTERN = re.compile(r"^[a-z][a-z0-9_.:-]{1,99}$")


class PermissionMode(StrEnum):
    ALL = "all"
    ANY = "any"


@dataclass(frozen=True, slots=True)
class ResourceScope:
    type: str
    id: UUID


@dataclass(frozen=True, slots=True)
class RoleGrant:
    role: str
    scope_type: str
    scope_id: UUID | None
    permissions: frozenset[str]

    def applies_to(self, scope: ResourceScope | None) -> bool:
        if self.scope_type == "global":
            return True
        return scope is not None and self.scope_type == scope.type and self.scope_id == scope.id


@dataclass(frozen=True, slots=True)
class AuthorizationContext:
    user_id: UUID
    grants: tuple[RoleGrant, ...]
    panel_sections: frozenset[str] | None = None

    @property
    def is_super_admin(self) -> bool:
        return any(g.role == "super_admin" and g.scope_type == "global" for g in self.grants)

    @property
    def roles(self) -> frozenset[str]:
        return frozenset(grant.role for grant in self.grants)

    def permissions_for(self, scope: ResourceScope | None = None) -> frozenset[str]:
        permissions = frozenset(
            permission
            for grant in self.grants
            if grant.applies_to(scope)
            for permission in grant.permissions
        )
        return permissions | frozenset(
            permission
            for section in (self.panel_sections or ())
            for permission in SECTION_PERMISSIONS.get(section, ())
        )

    def allows(
        self,
        required: frozenset[str],
        *,
        mode: PermissionMode = PermissionMode.ALL,
        scope: ResourceScope | None = None,
    ) -> bool:
        if not required:
            return False
        effective = self.permissions_for(scope)
        if mode is PermissionMode.ALL:
            return required <= effective
        return bool(required & effective)


class ResourcePolicy(Protocol):
    """Implemented by the domain that owns the protected resource."""

    async def authorize(
        self,
        *,
        action: str,
        actor: AuthorizationContext,
        resource_id: UUID,
    ) -> bool: ...


class AuthorizationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def context_for(self, user_id: UUID) -> AuthorizationContext:
        result = await self._session.execute(
            text(
                """
                SELECT
                    r.code AS role,
                    ur.scope_type,
                    ur.scope_id,
                    COALESCE(
                        array_agg(p.code) FILTER (WHERE p.code IS NOT NULL),
                        ARRAY[]::varchar[]
                    ) AS permissions
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                LEFT JOIN role_permissions rp ON rp.role_id = r.id
                LEFT JOIN permissions p ON p.id = rp.permission_id
                WHERE ur.user_id = :user_id
                  AND ur.revoked_at IS NULL
                GROUP BY r.code, ur.scope_type, ur.scope_id
                ORDER BY r.code, ur.scope_type, ur.scope_id NULLS FIRST
                """
            ),
            {"user_id": user_id},
        )
        grants = tuple(
            RoleGrant(
                role=row.role,
                scope_type=row.scope_type,
                scope_id=row.scope_id,
                permissions=frozenset(row.permissions),
            )
            for row in result
        )
        context = AuthorizationContext(user_id=user_id, grants=grants)
        if context.is_super_admin:
            sections = ALL_SECTIONS
        elif any(g.role in STAFF_ROLE_CODES and g.scope_type == "global" for g in grants):
            saved = await self._session.scalar(
                text("SELECT sections FROM staff_panel_access WHERE user_id = :id"),
                {"id": user_id},
            )
            sections = frozenset(saved) if saved is not None else DEFAULT_SECTIONS
        else:
            sections = frozenset()
        return AuthorizationContext(user_id=user_id, grants=grants, panel_sections=sections)


class AuthorizationService:
    def __init__(self, repository: AuthorizationRepository) -> None:
        self._repository = repository

    async def context_for(self, user_id: UUID) -> AuthorizationContext:
        return await self._repository.context_for(user_id)

    @staticmethod
    def require(
        context: AuthorizationContext,
        permissions: frozenset[str],
        *,
        mode: PermissionMode = PermissionMode.ALL,
        scope: ResourceScope | None = None,
    ) -> None:
        validate_permission_codes(permissions)
        if not context.allows(permissions, mode=mode, scope=scope):
            raise ApplicationError(
                code="PERMISSION_DENIED",
                message="You do not have permission to perform this action.",
                status_code=403,
            )

    @staticmethod
    async def require_resource(
        context: AuthorizationContext,
        *,
        action: str,
        resource_id: UUID,
        policy: ResourcePolicy,
    ) -> None:
        if not await policy.authorize(
            action=action,
            actor=context,
            resource_id=resource_id,
        ):
            raise ApplicationError(
                code="PERMISSION_DENIED",
                message="You do not have permission to perform this action.",
                status_code=403,
            )


def validate_permission_codes(permissions: frozenset[str]) -> None:
    if not permissions:
        raise ValueError("At least one permission code is required")
    invalid = sorted(code for code in permissions if not PERMISSION_CODE_PATTERN.fullmatch(code))
    if invalid:
        raise ValueError(f"Invalid permission codes: {', '.join(invalid)}")
