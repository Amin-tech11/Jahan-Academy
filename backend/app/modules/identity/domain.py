from dataclasses import dataclass
from enum import StrEnum
from uuid import UUID


class UserStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    LOCKED = "locked"
    DISABLED = "disabled"
    ANONYMIZED = "anonymized"


@dataclass(frozen=True, slots=True)
class User:
    id: UUID
    status: UserStatus
    preferred_locale: str

    def can_authenticate(self) -> bool:
        return self.status is UserStatus.ACTIVE
