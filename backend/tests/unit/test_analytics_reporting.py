from __future__ import annotations

import json
from pathlib import Path
from typing import Any, cast
from unittest.mock import AsyncMock, Mock
from urllib.parse import parse_qs

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.modules.reporting.analytics_service import GOOGLE_OAUTH_ENDPOINT, METRICS, AnalyticsService
from app.shared.exceptions import ApplicationError


def report(metrics: list[str], dimensions: list[str], rows: list[list[str]]) -> dict[str, Any]:
    return {
        "metricHeaders": [{"name": name} for name in metrics],
        "dimensionHeaders": [{"name": name} for name in dimensions],
        "rows": [
            {
                "dimensionValues": [{"value": value} for value in row[: len(dimensions)]],
                "metricValues": [{"value": value} for value in row[len(dimensions) :]],
            }
            for row in rows
        ],
        "metadata": {"timeZone": "Asia/Tehran"},
    }


@pytest.fixture
def analytics(tmp_path: Path) -> tuple[AnalyticsService, Mock, list[httpx.Request]]:
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    pem = key.private_bytes(
        serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()
    ).decode()
    credentials = tmp_path / "ga4.json"
    credentials.write_text(
        json.dumps(
            {
                "type": "service_account",
                "client_email": "synthetic@example.iam.gserviceaccount.com",
                "private_key": pem,
                "token_uri": "https://attacker.invalid/not-used",
            }
        )
    )
    settings = Settings(
        _env_file=None,
        environment="test",
        analytics_enabled=True,
        analytics_credentials_file=str(credentials),
    )
    storage: dict[str, str] = {}
    redis = Mock(spec=Redis)
    redis.get = AsyncMock(side_effect=lambda name: storage.get(name))

    async def store(name: str, value: str, **options: Any) -> bool:
        if options.get("nx") and name in storage:
            return False
        storage[name] = value
        return True

    redis.set = AsyncMock(side_effect=store)

    async def unlock(_script: str, _count: int, name: str, owner: str) -> int:
        if storage.get(name) == owner:
            del storage[name]
            return 1
        return 0

    redis.eval = AsyncMock(side_effect=unlock)
    calls: list[httpx.Request] = []

    def handler(request: httpx.Request) -> httpx.Response:
        calls.append(request)
        if str(request.url) == GOOGLE_OAUTH_ENDPOINT:
            assertion = parse_qs(request.content.decode())["assertion"][0]
            claims = jwt.decode(
                assertion, key.public_key(), algorithms=["RS256"], audience=GOOGLE_OAUTH_ENDPOINT
            )
            assert claims["scope"] == "https://www.googleapis.com/auth/analytics.readonly"
            assert claims["iss"] == "synthetic@example.iam.gserviceaccount.com"
            return httpx.Response(200, json={"access_token": "synthetic-token"})
        assert request.url.host == "analyticsdata.googleapis.com"
        assert request.url.path.startswith("/v1beta/properties/558971968:")
        assert request.headers["authorization"] == "Bearer synthetic-token"
        if request.url.path.endswith(":batchRunReports"):
            payload = json.loads(request.content)
            assert len(payload["requests"]) == 5
            assert payload["requests"][0]["dateRanges"] == [
                {"startDate": "28daysAgo", "endDate": "yesterday"}
            ]
            assert payload["requests"][1]["dateRanges"] == [
                {"startDate": "56daysAgo", "endDate": "29daysAgo"}
            ]
            return httpx.Response(
                200,
                json={
                    "reports": [
                        report(METRICS, [], [["10", "4", "20", "50", ".75"]]),
                        report(METRICS, [], [["8", "3", "16", "40", ".5"]]),
                        report(
                            METRICS,
                            ["date"],
                            [
                                ["20261018", "6", "2", "8", "20", ".5"],
                                ["20261019", "7", "2", "12", "30", ".9166667"],
                            ],
                        ),
                        report(
                            ["sessions"], ["sessionDefaultChannelGroup"], [["Organic Search", "12"]]
                        ),
                        report(
                            ["sessions"], ["deviceCategory"], [["mobile", "15"], ["desktop", "5"]]
                        ),
                    ]
                },
            )
        if request.url.path.endswith(":runReport"):
            payload = json.loads(request.content)
            assert payload["dimensions"] == [{"name": "pagePath"}]
            return httpx.Response(
                200, json=report(["screenPageViews"], ["pagePath"], [["/fa", "30"]])
            )
        if request.url.path.endswith(":runRealtimeReport"):
            assert json.loads(request.content)["minuteRanges"] == [
                {"startMinutesAgo": 29, "endMinutesAgo": 0}
            ]
            return httpx.Response(200, json=report(["activeUsers"], [], [["3"]]))
        raise AssertionError(f"Unexpected operation: {request.url}")

    service = AnalyticsService(settings, cast(Redis, redis), httpx.MockTransport(handler))
    return service, redis, calls


async def test_reports_use_ga_totals_not_summed_daily_distinct_users_and_cache(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
) -> None:
    service, redis, calls = analytics
    result = await service.overview(28)
    assert result.status == "ready" and not result.cached
    assert result.totals and result.totals.active_users == 10
    assert sum(day.active_users for day in result.daily) == 13
    assert result.totals.engagement_rate == 0.75
    assert result.previous and result.previous.engagement_rate == 0.5
    assert result.time_zone == "Asia/Tehran"
    assert result.daily[0].date == "2026-10-18"
    assert result.pages[0].path == "/fa" and result.pages[0].views == 30
    again = await service.overview(28)
    assert again.cached and again.fetched_at == result.fetched_at
    assert len(calls) == 3
    assert any(call.kwargs.get("ex") == 300 for call in redis.set.call_args_list)
    assert "synthetic-token" not in result.model_dump_json()
    assert "private_key" not in result.model_dump_json()


async def test_realtime_is_independent_and_cached_for_one_minute(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
) -> None:
    service, redis, calls = analytics
    result = await service.realtime()
    assert result.active_users == 3
    assert (await service.realtime()).cached
    assert len(calls) == 2
    assert any(call.kwargs.get("ex") == 60 for call in redis.set.call_args_list)


async def test_unconfigured_is_not_fake_zero_and_does_not_call_google_or_cache(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
) -> None:
    service, redis, calls = analytics
    service.settings.analytics_enabled = False
    assert (await service.overview(7)).totals is None
    assert (await service.realtime()).active_users is None
    assert not calls
    redis.get.assert_not_called()


async def test_missing_credentials_is_a_sanitized_error_and_releases_lock(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
) -> None:
    service, redis, calls = analytics
    service.settings.analytics_credentials_file = "missing-private-key.json"
    with pytest.raises(ApplicationError) as error:
        await service.overview(28)
    assert error.value.code == "ANALYTICS_CREDENTIALS_INVALID"
    assert "missing-private-key" not in str(error.value)
    assert not calls
    redis.eval.assert_awaited_once()


@pytest.mark.parametrize(
    "status,code",
    [
        (403, "ANALYTICS_ACCESS_DENIED"),
        (429, "ANALYTICS_QUOTA_EXCEEDED"),
        (500, "ANALYTICS_UPSTREAM_FAILED"),
    ],
)
async def test_google_failures_are_never_returned_as_zero_activity(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
    status: int,
    code: str,
) -> None:
    service, _, _ = analytics

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == GOOGLE_OAUTH_ENDPOINT:
            return httpx.Response(200, json={"access_token": "synthetic"})
        return httpx.Response(status, json={"error": "private-upstream-error-not-for-browser"})

    service.transport = httpx.MockTransport(handler)
    with pytest.raises(ApplicationError) as error:
        await service.realtime()
    assert error.value.code == code
    assert "private-upstream" not in str(error.value)


async def test_busy_refresh_and_broken_cache_do_not_spend_google_quota(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
) -> None:
    service, redis, calls = analytics
    redis.set = AsyncMock(return_value=False)
    with pytest.raises(ApplicationError) as busy:
        await service.realtime()
    assert busy.value.code == "ANALYTICS_REFRESH_BUSY"
    redis.get = AsyncMock(side_effect=RedisError("private-cache-error"))
    with pytest.raises(ApplicationError) as offline:
        await service.realtime()
    assert offline.value.code == "ANALYTICS_CACHE_UNAVAILABLE"
    assert not calls


async def test_empty_google_report_is_legitimate_zero_activity(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
) -> None:
    service, _, _ = analytics

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == GOOGLE_OAUTH_ENDPOINT:
            return httpx.Response(200, json={"access_token": "synthetic"})
        return httpx.Response(200, json=report(["activeUsers"], [], []))

    service.transport = httpx.MockTransport(handler)
    assert (await service.realtime()).active_users == 0


async def test_changed_metric_headers_are_an_error_not_incorrectly_labeled_values(
    analytics: tuple[AnalyticsService, Mock, list[httpx.Request]],
) -> None:
    service, _, _ = analytics

    def handler(request: httpx.Request) -> httpx.Response:
        if str(request.url) == GOOGLE_OAUTH_ENDPOINT:
            return httpx.Response(200, json={"access_token": "synthetic"})
        return httpx.Response(200, json=report(["sessions"], [], [["99"]]))

    service.transport = httpx.MockTransport(handler)
    with pytest.raises(ApplicationError) as error:
        await service.realtime()
    assert error.value.code == "ANALYTICS_INVALID_REPORT"
    assert error.value.status_code == 502
