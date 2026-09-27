from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any, cast
from uuid import UUID, uuid4

from sqlalchemy import text
from sqlalchemy.engine import CursorResult
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.identity.domain import STAFF_ROLE_CODES

STAFF_BY_ID_FOR_UPDATE_SUFFIX = " FOR UPDATE OF u"

STAFF_BY_ID_SQL = (
    "SELECT u.id, u.status, u.preferred_locale, u.failed_login_count, u.locked_until, "
    "u.row_version, u.created_at, u.updated_at, p.first_name, p.last_name, "
    "i.id AS identity_id, i.normalized_value AS email, i.verified_at, "
    "ARRAY(SELECT r2.code FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id "
    "WHERE ur2.user_id = u.id AND ur2.scope_type = 'global' "
    "AND ur2.revoked_at IS NULL AND r2.code = ANY(:staff_roles) ORDER BY r2.code) AS role_codes "
    "FROM users u JOIN user_profiles p ON p.user_id = u.id "
    "JOIN user_identities i ON i.user_id = u.id AND i.provider = 'email' "
    "WHERE u.id = :staff_id AND u.deleted_at IS NULL "
    "AND EXISTS (SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id "
    "WHERE ur.user_id = u.id AND ur.scope_type = 'global' "
    "AND ur.revoked_at IS NULL AND r.code = ANY(:staff_roles))"
)
STAFF_BY_ID_FOR_UPDATE_SQL = STAFF_BY_ID_SQL + STAFF_BY_ID_FOR_UPDATE_SUFFIX


class StaffRepository:
    """Persistence boundary for globally scoped administrative staff accounts."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    @staticmethod
    def _roles() -> list[str]:
        return sorted(STAFF_ROLE_CODES)

    async def email_exists(self, normalized_email: str) -> bool:
        return (
            await self.session.scalar(
                text(
                    """
                    SELECT EXISTS (
                        SELECT 1 FROM user_identities
                        WHERE provider = 'email' AND normalized_value = :email
                    )
                    """
                ),
                {"email": normalized_email},
            )
        ) is True

    async def validate_role_codes(self, role_codes: list[str]) -> bool:
        result = await self.session.execute(
            text("SELECT code FROM roles WHERE code = ANY(:role_codes)"),
            {"role_codes": role_codes},
        )
        return {row.code for row in result} == set(role_codes)

    async def create_staff(
        self,
        *,
        email: str,
        password_hash: str,
        first_name: str,
        last_name: str,
        preferred_locale: str,
        role_codes: list[str],
        actor_user_id: UUID,
    ) -> UUID:
        now = datetime.now(UTC)
        user_id = uuid4()
        identity_id = uuid4()
        await self.session.execute(
            text(
                """
                INSERT INTO users (
                    id, status, preferred_locale, failed_login_count, locked_until,
                    row_version, created_at, updated_at, deleted_at
                ) VALUES (
                    :id, 'active', :preferred_locale, 0, NULL, 1, :now, :now, NULL
                )
                """
            ),
            {"id": user_id, "preferred_locale": preferred_locale, "now": now},
        )
        await self.session.execute(
            text(
                """
                INSERT INTO user_profiles (user_id, first_name, last_name, created_at, updated_at)
                VALUES (:user_id, :first_name, :last_name, :now, :now)
                """
            ),
            {
                "user_id": user_id,
                "first_name": first_name,
                "last_name": last_name,
                "now": now,
            },
        )
        await self.session.execute(
            text(
                """
                INSERT INTO user_identities (
                    id, user_id, provider, provider_subject, normalized_value,
                    password_hash, verified_at, last_used_at, created_at, updated_at
                ) VALUES (
                    :id, :user_id, 'email', :email, :email, :password_hash,
                    :now, NULL, :now, :now
                )
                """
            ),
            {
                "id": identity_id,
                "user_id": user_id,
                "email": email,
                "password_hash": password_hash,
                "now": now,
            },
        )
        await self.session.execute(
            text(
                """
                INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by_user_id)
                SELECT :user_id, id, 'global', NULL, :actor_user_id
                FROM roles
                WHERE code = ANY(:role_codes)
                """
            ),
            {
                "user_id": user_id,
                "actor_user_id": actor_user_id,
                "role_codes": role_codes,
            },
        )
        return user_id

    async def get_staff(self, staff_id: UUID, *, for_update: bool = False) -> Any | None:
        result = await self.session.execute(
            text(STAFF_BY_ID_FOR_UPDATE_SQL if for_update else STAFF_BY_ID_SQL),
            {"staff_id": staff_id, "staff_roles": self._roles()},
        )
        return result.mappings().one_or_none()

    async def list_staff(
        self,
        *,
        page: int,
        page_size: int,
        query: str | None,
        status: str | None,
        role_code: str | None,
    ) -> tuple[list[Any], int]:
        params: dict[str, Any] = {
            "staff_roles": self._roles(),
            "query": f"%{query.strip()}%" if query else None,
            "status": status,
            "role_code": role_code,
        }
        offset = (page - 1) * page_size
        params.update({"limit": page_size, "offset": offset})
        result = await self.session.execute(
            text(
                """
                SELECT
                    u.id, u.status, u.preferred_locale, u.failed_login_count, u.locked_until,
                    u.row_version, u.created_at, u.updated_at,
                    p.first_name, p.last_name, i.normalized_value AS email, i.verified_at,
                    ARRAY(
                        SELECT r2.code FROM user_roles ur2 JOIN roles r2 ON r2.id = ur2.role_id
                        WHERE ur2.user_id = u.id AND ur2.scope_type = 'global'
                          AND ur2.revoked_at IS NULL AND r2.code = ANY(:staff_roles)
                        ORDER BY r2.code
                    ) AS role_codes
                FROM users u
                JOIN user_profiles p ON p.user_id = u.id
                JOIN user_identities i ON i.user_id = u.id AND i.provider = 'email'
                WHERE u.deleted_at IS NULL
                  AND (CAST(:query AS text) IS NULL OR i.normalized_value ILIKE :query
                       OR p.first_name ILIKE :query OR p.last_name ILIKE :query)
                  AND (CAST(:status AS text) IS NULL OR u.status::text = :status)
                  AND (CAST(:role_code AS text) IS NULL OR EXISTS (
                      SELECT 1 FROM user_roles urf JOIN roles rf ON rf.id = urf.role_id
                      WHERE urf.user_id = u.id AND urf.scope_type = 'global'
                        AND urf.revoked_at IS NULL AND rf.code = :role_code
                  ))
                  AND EXISTS (
                      SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                      WHERE ur.user_id = u.id AND ur.scope_type = 'global'
                        AND ur.revoked_at IS NULL AND r.code = ANY(:staff_roles)
                  )
                ORDER BY u.created_at DESC, u.id DESC
                LIMIT :limit OFFSET :offset
                """
            ),
            params,
        )
        total = await self.session.scalar(
            text(
                """
                SELECT COUNT(*) FROM users u
                JOIN user_profiles p ON p.user_id = u.id
                JOIN user_identities i ON i.user_id = u.id AND i.provider = 'email'
                WHERE u.deleted_at IS NULL
                  AND (CAST(:query AS text) IS NULL OR i.normalized_value ILIKE :query
                       OR p.first_name ILIKE :query OR p.last_name ILIKE :query)
                  AND (CAST(:status AS text) IS NULL OR u.status::text = :status)
                  AND (CAST(:role_code AS text) IS NULL OR EXISTS (
                      SELECT 1 FROM user_roles urf JOIN roles rf ON rf.id = urf.role_id
                      WHERE urf.user_id = u.id AND urf.scope_type = 'global'
                        AND urf.revoked_at IS NULL AND rf.code = :role_code
                  ))
                  AND EXISTS (
                      SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                      WHERE ur.user_id = u.id AND ur.scope_type = 'global'
                        AND ur.revoked_at IS NULL AND r.code = ANY(:staff_roles)
                  )
                """
            ),
            {key: value for key, value in params.items() if key not in {"limit", "offset"}},
        )
        return list(result.mappings()), int(total or 0)

    async def lock_super_admin_grants(self) -> None:
        await self.session.execute(
            text(
                """
                SELECT ur.id FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE r.code = 'super_admin' AND ur.scope_type = 'global' AND ur.revoked_at IS NULL
                FOR UPDATE
                """
            )
        )

    async def active_super_admin_count(self) -> int:
        count = await self.session.scalar(
            text(
                """
                SELECT COUNT(DISTINCT u.id)
                FROM users u
                JOIN user_roles ur ON ur.user_id = u.id
                JOIN roles r ON r.id = ur.role_id
                WHERE u.status = 'active' AND u.deleted_at IS NULL
                  AND ur.scope_type = 'global' AND ur.revoked_at IS NULL
                  AND r.code = 'super_admin'
                """
            )
        )
        return int(count or 0)

    async def update_staff(
        self,
        *,
        staff_id: UUID,
        expected_version: int,
        first_name: str | None,
        last_name: str | None,
        preferred_locale: str | None,
        active: bool | None,
    ) -> bool:
        now = datetime.now(UTC)
        status = None if active is None else ("active" if active else "disabled")
        user_update = cast(
            CursorResult[Any],
            await self.session.execute(
                text(
                    """
                UPDATE users
                SET status = COALESCE(:status, status),
                    preferred_locale = COALESCE(:preferred_locale, preferred_locale),
                    failed_login_count = CASE WHEN :clear_lock THEN 0 ELSE failed_login_count END,
                    locked_until = CASE WHEN :clear_lock THEN NULL ELSE locked_until END,
                    updated_at = :now,
                    row_version = row_version + 1
                WHERE id = :staff_id AND row_version = :expected_version AND deleted_at IS NULL
                """
                ),
                {
                    "staff_id": staff_id,
                    "expected_version": expected_version,
                    "status": status,
                    "preferred_locale": preferred_locale,
                    "clear_lock": active is True,
                    "now": now,
                },
            ),
        )
        if user_update.rowcount != 1:
            return False
        await self.session.execute(
            text(
                """
                UPDATE user_profiles
                SET first_name = COALESCE(:first_name, first_name),
                    last_name = COALESCE(:last_name, last_name), updated_at = :now
                WHERE user_id = :staff_id
                """
            ),
            {"staff_id": staff_id, "first_name": first_name, "last_name": last_name, "now": now},
        )
        return True

    async def replace_roles(
        self, *, staff_id: UUID, expected_version: int, role_codes: list[str], actor_user_id: UUID
    ) -> bool:
        now = datetime.now(UTC)
        update = cast(
            CursorResult[Any],
            await self.session.execute(
                text(
                    """
                UPDATE users SET row_version = row_version + 1, updated_at = :now
                WHERE id = :staff_id AND row_version = :expected_version AND deleted_at IS NULL
                """
                ),
                {"staff_id": staff_id, "expected_version": expected_version, "now": now},
            ),
        )
        if update.rowcount != 1:
            return False
        await self.session.execute(
            text(
                """
                UPDATE user_roles SET revoked_at = :now
                WHERE user_id = :staff_id AND scope_type = 'global' AND revoked_at IS NULL
                  AND role_id IN (SELECT id FROM roles WHERE code = ANY(:staff_roles))
                """
            ),
            {"staff_id": staff_id, "staff_roles": self._roles(), "now": now},
        )
        await self.session.execute(
            text(
                """
                INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by_user_id)
                SELECT :staff_id, id, 'global', NULL, :actor_user_id
                FROM roles WHERE code = ANY(:role_codes)
                """
            ),
            {"staff_id": staff_id, "actor_user_id": actor_user_id, "role_codes": role_codes},
        )
        return True

    async def recover_access(
        self, *, staff_id: UUID, expected_version: int, reactivate: bool
    ) -> bool:
        now = datetime.now(UTC)
        update = cast(
            CursorResult[Any],
            await self.session.execute(
                text(
                    """
                UPDATE users
                SET status = CASE WHEN :reactivate THEN 'active' ELSE status END,
                    failed_login_count = 0, locked_until = NULL, updated_at = :now,
                    row_version = row_version + 1
                WHERE id = :staff_id AND row_version = :expected_version AND deleted_at IS NULL
                """
                ),
                {
                    "staff_id": staff_id,
                    "expected_version": expected_version,
                    "reactivate": reactivate,
                    "now": now,
                },
            ),
        )
        return update.rowcount == 1

    async def revoke_sessions(self, user_id: UUID) -> None:
        await self.session.execute(
            text(
                "UPDATE sessions SET revoked_at = now() "
                "WHERE user_id = :user_id AND revoked_at IS NULL"
            ),
            {"user_id": user_id},
        )

    async def issue_password_reset(
        self, *, identity_id: UUID, token_hash: str, expires_at: datetime
    ) -> None:
        now = datetime.now(UTC)
        await self.session.execute(
            text(
                "UPDATE password_reset_tokens SET used_at = :now "
                "WHERE identity_id = :identity_id AND used_at IS NULL"
            ),
            {"identity_id": identity_id, "now": now},
        )
        await self.session.execute(
            text(
                """
                INSERT INTO password_reset_tokens (
                    id, identity_id, token_hash, expires_at, used_at, created_at
                )
                VALUES (:id, :identity_id, :token_hash, :expires_at, NULL, :now)
                """
            ),
            {
                "id": uuid4(),
                "identity_id": identity_id,
                "token_hash": token_hash,
                "expires_at": expires_at,
                "now": now,
            },
        )

    async def audit(
        self,
        *,
        actor_user_id: UUID,
        action: str,
        entity_id: UUID,
        before: dict[str, Any] | None,
        after: dict[str, Any] | None,
    ) -> None:
        await self.session.execute(
            text(
                """
                INSERT INTO audit_logs (
                    id, actor_user_id, action, entity_type, entity_id,
                    before_safe, after_safe, created_at
                ) VALUES (
                    :id, :actor_user_id, :action, 'staff_user', :entity_id,
                    CAST(:before_safe AS jsonb), CAST(:after_safe AS jsonb), now()
                )
                """
            ),
            {
                "id": uuid4(),
                "actor_user_id": actor_user_id,
                "action": action,
                "entity_id": entity_id,
                "before_safe": json.dumps(before) if before is not None else None,
                "after_safe": json.dumps(after) if after is not None else None,
            },
        )
