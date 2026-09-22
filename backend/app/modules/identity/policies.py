from app.modules.identity.domain import User
from app.shared.exceptions import ApplicationError


def require_authenticatable(user: User) -> None:
    if not user.can_authenticate():
        raise ApplicationError(
            code="ACCOUNT_UNAVAILABLE",
            message="Account is unavailable.",
            status_code=403,
        )
