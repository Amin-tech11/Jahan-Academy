from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from typing import cast
from unittest.mock import AsyncMock, Mock
from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.core.config import Settings
from app.modules.identity.repository import AuthRepository, SessionRecord
from app.modules.identity.security import AuthSecurity
from app.modules.identity.service import AuthService


@pytest.mark.parametrize("staff,idle_minutes,hours", [(False, 30, 12), (True, 15, 8)])
async def test_idle_and_absolute_boundaries_do_not_slide(
    staff: bool,
    idle_minutes: int,
    hours: int,
) -> None:
    now = datetime.now(UTC)
    repo = Mock(spec=AuthRepository)
    repo.session = AsyncMock()
    repo.requires_staff_mfa.return_value = staff
    started = now - timedelta(hours=hours) + timedelta(seconds=1)
    repo.session_family_started_at.return_value = started
    service = AuthService(repo, Mock(), Mock(), Settings(_env_file=None, environment="test"))
    record = cast(
        SessionRecord,
        SimpleNamespace(
            user=SimpleNamespace(id=uuid4()),
            session=SimpleNamespace(
                family_id=uuid4(),
                expires_at=now + timedelta(days=30),
                last_seen_at=now - timedelta(minutes=idle_minutes) + timedelta(seconds=1),
            ),
        ),
    )
    assert await service._session_deadline(record, now) == now + timedelta(seconds=1)
    # Neither current activity nor a freshly rotated child resets the root deadline.
    record.session.last_seen_at = now
    assert await service._session_deadline(record, now + timedelta(seconds=1)) is None
    repo.session_family_started_at.return_value = now
    record.session.last_seen_at = now - timedelta(minutes=idle_minutes)
    assert await service._session_deadline(record, now) is None
    repo.session_family_started_at.return_value = None
    record.session.last_seen_at = now
    assert await service._session_deadline(record, now) is None


def test_access_token_never_outlives_session_deadline() -> None:
    security = AuthSecurity(Settings(_env_file=None, environment="test"))
    deadline = datetime.now(UTC) + timedelta(seconds=60)
    token, expiry = security.create_access_token(uuid4(), uuid4(), expires_at_limit=deadline)
    assert expiry == deadline
    assert security.decode_access_token(token).expires_at <= deadline


@pytest.mark.parametrize(
    "overrides",
    [
        {"session_idle_minutes": 1000},
        {"staff_session_idle_minutes": 31},
        {"staff_session_absolute_hours": 13},
        {"staff_session_absolute_hours": 1, "staff_session_idle_minutes": 61},
    ],
)
def test_invalid_or_weaker_staff_policy_is_rejected(overrides: dict[str, int]) -> None:
    with pytest.raises(ValidationError):
        Settings(
            _env_file=None,
            session_idle_minutes=overrides.get("session_idle_minutes", 30),
            session_absolute_hours=overrides.get("session_absolute_hours", 12),
            staff_session_idle_minutes=overrides.get("staff_session_idle_minutes", 15),
            staff_session_absolute_hours=overrides.get("staff_session_absolute_hours", 8),
        )
