from datetime import UTC, datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi.routing import APIRoute
from redis.exceptions import ConnectionError as RedisConnectionError

from app.modules.identity.dependencies import require_fresh_auth
from app.modules.identity.reauth import consume, issue, key
from app.modules.identity.router import staff_router
from app.modules.identity.security import AccessClaims
from app.shared.exceptions import ApplicationError


def test_every_staff_mutation_has_stepup_dependency() -> None:
    mutations = [
        route
        for route in staff_router.routes
        if isinstance(route, APIRoute)
        and (route.methods or set()) & {"POST", "PUT", "PATCH", "DELETE"}
    ]
    assert len(mutations) == 5
    for route in mutations:
        assert any(
            dependency.call is require_fresh_auth for dependency in route.dependant.dependencies
        )


async def test_proofs_are_hashed_short_lived_and_session_bound() -> None:
    redis = AsyncMock()
    claims = AccessClaims(uuid4(), uuid4(), datetime.now(UTC))
    token = await issue(redis, claims, "POST", "/admin/staff")
    args = redis.set.call_args
    assert token not in args.args[0]
    assert args.kwargs["ex"] == 300
    assert str(claims.session_id) in args.args[1]
    assert key(token) == args.args[0]


@pytest.mark.parametrize("mode", ["missing", "replayed", "outage"])
async def test_missing_replayed_and_outage_proofs_fail_closed(mode: str) -> None:
    redis = AsyncMock()
    redis.eval.return_value = 0
    if mode == "outage":
        redis.eval.side_effect = RedisConnectionError()
    with pytest.raises(ApplicationError) as error:
        await consume(
            redis,
            AccessClaims(uuid4(), uuid4(), datetime.now(UTC)),
            "POST",
            "/admin/staff",
            None if mode == "missing" else "synthetic-proof",
        )
    assert error.value.status_code == (503 if mode == "outage" else 403)
