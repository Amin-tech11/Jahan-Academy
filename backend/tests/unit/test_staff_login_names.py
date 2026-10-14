from unittest.mock import AsyncMock, Mock

import pytest
from pydantic import ValidationError

from app.modules.identity.schemas import LoginRequest
from app.modules.identity.service import AuthService
from app.shared.exceptions import ApplicationError


def test_login_requires_exactly_one_valid_identifier() -> None:
    assert LoginRequest(username="Pouya", password="test").username == "Pouya"
    assert LoginRequest(email="staff@example.com", password="test").email
    for payload in (
        {},
        {"username": "bad name"},
        {"username": "Pouya", "email": "staff@example.com"},
    ):
        with pytest.raises(ValidationError):
            LoginRequest(password="test", **payload)


async def test_unknown_staff_name_uses_dummy_check_and_rejects_login() -> None:
    repository = Mock()
    repository.get_staff_account_by_username = AsyncMock(return_value=None)
    security = Mock()
    service = AuthService.__new__(AuthService)
    service._repository = repository
    service._security = security
    with pytest.raises(ApplicationError) as error:
        await service.login(LoginRequest(username="POUYA", password="test"), None, None)
    assert error.value.status_code == 401
    repository.get_staff_account_by_username.assert_awaited_once_with("pouya")
    security.perform_dummy_password_check.assert_called_once_with("test")
