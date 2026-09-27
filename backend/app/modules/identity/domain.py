from dataclasses import dataclass
from enum import StrEnum
from uuid import UUID


class UserStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    LOCKED = "locked"
    DISABLED = "disabled"
    ANONYMIZED = "anonymized"


class StaffRoleCode(StrEnum):
    SUPER_ADMIN = "super_admin"
    SUPPORT = "support"
    CONSULTANT = "consultant"
    CONTENT_EDITOR = "content_editor"


STAFF_ROLE_CODES = frozenset(item.value for item in StaffRoleCode)


@dataclass(frozen=True, slots=True)
class User:
    id: UUID
    status: UserStatus
    preferred_locale: str

    def can_authenticate(self) -> bool:
        return self.status is UserStatus.ACTIVE
