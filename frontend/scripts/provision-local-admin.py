"""One-time local-only admin provisioning. Run in the existing backend container.

Accepts LOCAL_ADMIN_EMAIL, LOCAL_ADMIN_NAME and LOCAL_ADMIN_PASSWORD from process
environment. Never logs credentials, resets an existing account, or runs outside local.
The owner may explicitly choose a short temporary local password without changing
the application's normal registration/reset password policy.
"""

import asyncio
import os
from datetime import UTC, datetime
from uuid import uuid4

from app.core.config import get_settings
from app.core.database import engine, session_factory
from app.modules.identity.models import UserIdentityModel, UserModel, UserProfileModel
from app.modules.identity.security import AuthSecurity
from sqlalchemy import text


async def main():
    settings = get_settings()
    if settings.environment != "local":
        raise SystemExit(
            "Refusing to provision a temporary account outside local environment"
        )
    email = os.environ["LOCAL_ADMIN_EMAIL"].strip().lower()
    name = os.environ["LOCAL_ADMIN_NAME"].strip()
    password = os.environ["LOCAL_ADMIN_PASSWORD"]
    if not name or not password or not email.endswith("@example.com"):
        raise SystemExit(
            "Local name, password and reserved example.com email are required"
        )
    async with session_factory() as session, session.begin():
        await session.execute(text("SELECT pg_advisory_xact_lock(35003500)"))
        existing = await session.scalar(
            text(
                "SELECT user_id FROM user_identities WHERE provider='email' AND normalized_value=:email"
            ),
            {"email": email},
        )
        if existing:
            raise SystemExit(
                "Account already exists; no account or password was modified"
            )
        role = await session.scalar(
            text("SELECT id FROM roles WHERE code='super_admin'")
        )
        if not role:
            raise SystemExit("Super Admin role is missing; no account was created")
        now = datetime.now(UTC)
        user_id = uuid4()
        session.add(
            UserModel(
                id=user_id,
                status="active",
                preferred_locale="fa",
                failed_login_count=0,
                created_at=now,
                updated_at=now,
            )
        )
        await session.flush()
        session.add(
            UserProfileModel(
                user_id=user_id,
                first_name=name,
                last_name="",
                created_at=now,
                updated_at=now,
            )
        )
        session.add(
            UserIdentityModel(
                id=uuid4(),
                user_id=user_id,
                provider="email",
                provider_subject=email,
                normalized_value=email,
                password_hash=AuthSecurity(settings).hash_password(password),
                verified_at=now,
                created_at=now,
                updated_at=now,
            )
        )
        await session.flush()
        await session.execute(
            text(
                "INSERT INTO user_roles (user_id, role_id, scope_type, scope_id, assigned_by_user_id) VALUES (:user_id, :role, 'global', NULL, :user_id)"
            ),
            {"user_id": user_id, "role": role},
        )
        await session.execute(
            text(
                "INSERT INTO audit_logs (id, actor_user_id, action, entity_type, entity_id, after_safe, created_at) VALUES (:id, :user_id, 'staff.local_bootstrap', 'staff_user', :user_id, CAST(:details AS jsonb), :now)"
            ),
            {
                "id": uuid4(),
                "user_id": user_id,
                "details": '{"roleCodes":["super_admin"],"environment":"local"}',
                "now": now,
            },
        )
    await engine.dispose()
    print("Local Super Admin created and audited successfully")


asyncio.run(main())
