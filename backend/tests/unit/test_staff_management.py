from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.modules.identity.schemas import (
    StaffCreateRequest,
    StaffRolesUpdateRequest,
    StaffUpdateRequest,
)


def test_staff_creation_accepts_only_unique_supported_roles() -> None:
    payload = StaffCreateRequest.model_validate(
        {
            "email": "consultant@jahanacademy.dev",
            "firstName": "  Sara  ",
            "lastName": "Ahmadi ",
            "roleCodes": ["consultant", "content_editor"],
        }
    )

    assert payload.first_name == "Sara"
    assert payload.last_name == "Ahmadi"
    assert [role.value for role in payload.role_codes] == ["consultant", "content_editor"]

    with pytest.raises(ValidationError):
        StaffCreateRequest.model_validate(
            {
                "email": "duplicate@jahanacademy.dev",
                "firstName": "Nima",
                "lastName": "Karimi",
                "roleCodes": ["support", "support"],
            }
        )


def test_staff_updates_require_an_actual_change_and_roles_are_not_empty() -> None:
    with pytest.raises(ValidationError):
        StaffUpdateRequest.model_validate({})

    with pytest.raises(ValidationError):
        StaffUpdateRequest.model_validate({"firstName": "   "})

    with pytest.raises(ValidationError):
        StaffRolesUpdateRequest.model_validate({"roleCodes": []})
