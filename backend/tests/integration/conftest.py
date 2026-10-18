"""Keep older staff lifecycle tests scoped to lifecycle/authorization behavior.

The new session-security flow tests exercise the real step-up dependency separately.
"""

from collections.abc import Iterator

import pytest

from app.main import app
from app.modules.identity.dependencies import require_fresh_auth


@pytest.fixture(autouse=True)
def legacy_staff_lifecycle_scope(request: pytest.FixtureRequest) -> Iterator[None]:
    if request.module.__name__.rsplit(".", 1)[-1] not in {
        "test_admin_user_management_flow",
        "test_panel_access_flow",
    }:
        yield
        return
    app.dependency_overrides[require_fresh_auth] = lambda: None
    try:
        yield
    finally:
        app.dependency_overrides.pop(require_fresh_auth, None)
