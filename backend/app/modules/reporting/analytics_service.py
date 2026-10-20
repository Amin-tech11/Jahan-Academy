"""Read-only, fixed-property GA4 reports. Never forward Google credentials to the UI."""

from __future__ import annotations

import asyncio
import json
import time
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Literal, TypeVar, cast
from uuid import uuid4

import httpx
import jwt
from pydantic import ValidationError
from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.config import Settings
from app.modules.reporting.analytics_schemas import (
    AnalyticsDay,
    AnalyticsOverview,
    AnalyticsPage,
    AnalyticsRealtime,
    AnalyticsSegment,
    AnalyticsTotals,
)
from app.shared.exceptions import ApplicationError

TOKEN_URL = "https://oauth2.googleapis.com/token"
API_URL = "https://analyticsdata.googleapis.com/v1beta/properties/"
METRICS = ["activeUsers", "newUsers", "sessions", "screenPageViews", "engagementRate"]
Days = Literal[7, 28, 90]
Report = dict[str, Any]
Result = TypeVar("Result", AnalyticsOverview, AnalyticsRealtime)


def failure(code: str, status: int = 503) -> ApplicationError:
    return ApplicationError(
        code=code, message="Analytics reports are unavailable.", status_code=status
    )


def report_request(days: int, metrics: list[str], dimension: str | None = None) -> Report:
    request: Report = {
        "dateRanges": [{"startDate": f"{days}daysAgo", "endDate": "yesterday"}],
        "metrics": [{"name": name} for name in metrics],
        "limit": "10" if dimension else "1",
        "returnPropertyQuota": True,
    }
    if dimension:
        request["dimensions"] = [{"name": dimension}]
        request["orderBys"] = [{"metric": {"metricName": metrics[0]}, "desc": True}]
    return request


def report_rows(report: Report, metrics: list[str], dimensions: list[str]) -> list[Report]:
    # Match headers explicitly rather than silently reading a changed metric order.
    if [header["name"] for header in report.get("metricHeaders", [])] != metrics:
        raise ValueError("Unexpected metric headers")
    if [header["name"] for header in report.get("dimensionHeaders", [])] != dimensions:
        raise ValueError("Unexpected dimension headers")
    rows = []
    for row in report.get("rows", []):
        metrics_map = dict(
            zip(metrics, [value["value"] for value in row["metricValues"]], strict=True)
        )
        dimension_map = dict(
            zip(
                dimensions,
                [value["value"] for value in row.get("dimensionValues", [])],
                strict=True,
            )
        )
        rows.append(metrics_map | dimension_map)
    return rows


def totals(row: Report | None) -> AnalyticsTotals:
    # An empty, successful GA report represents no measured activity, not an API failure.
    row = row or dict.fromkeys(METRICS, "0")
    return AnalyticsTotals(
        active_users=int(row["activeUsers"]),
        new_users=int(row["newUsers"]),
        sessions=int(row["sessions"]),
        views=int(row["screenPageViews"]),
        engagement_rate=float(row["engagementRate"]),
    )


class AnalyticsService:
    def __init__(
        self, settings: Settings, redis: Redis, transport: httpx.AsyncBaseTransport | None = None
    ) -> None:
        self.settings = settings
        self.redis = redis
        self.transport = transport

    async def _token(self, client: httpx.AsyncClient) -> str:
        def assertion() -> str:
            path = Path(self.settings.analytics_credentials_file)
            if path.stat().st_size > 32_768:
                raise ValueError("Invalid credentials file")
            credentials = json.loads(path.read_text(encoding="utf-8"))
            if credentials.get("type") != "service_account":
                raise ValueError("A service account is required")
            now = int(time.time())
            return jwt.encode(
                {
                    "iss": credentials["client_email"],
                    "scope": "https://www.googleapis.com/auth/analytics.readonly",
                    "aud": TOKEN_URL,
                    "iat": now,
                    "exp": now + 3600,
                },
                credentials["private_key"],
                algorithm="RS256",
            )

        try:
            proof = await asyncio.to_thread(assertion)
        except (OSError, ValueError, KeyError, TypeError, jwt.PyJWTError):
            raise failure("ANALYTICS_CREDENTIALS_INVALID") from None
        response = await client.post(
            TOKEN_URL,
            data={"grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer", "assertion": proof},
        )
        if response.status_code != 200:
            raise failure("ANALYTICS_AUTH_FAILED")
        token = response.json().get("access_token")
        if not isinstance(token, str) or not token:
            raise failure("ANALYTICS_AUTH_FAILED")
        return token

    async def _post(
        self, client: httpx.AsyncClient, token: str, operation: str, body: Report
    ) -> Report:
        # Server-controlled origin and property; client input cannot select another account.
        response = await client.post(
            f"{API_URL}{self.settings.analytics_property_id}:{operation}",
            headers={"Authorization": f"Bearer {token}"},
            json=body,
        )
        if response.status_code in (401, 403):
            raise failure("ANALYTICS_ACCESS_DENIED")
        if response.status_code == 429:
            raise failure("ANALYTICS_QUOTA_EXCEEDED", 429)
        if response.status_code != 200:
            raise failure("ANALYTICS_UPSTREAM_FAILED")
        result = response.json()
        if not isinstance(result, dict):
            raise ValueError("Unexpected report")
        return result

    async def _cached(
        self, suffix: str, ttl: int, model: type[Result], fetch: Callable[[], Awaitable[Result]]
    ) -> Result:
        key = f"ga4:v1:{self.settings.analytics_property_id}:{suffix}"
        lock_key = f"{key}:lock"
        owner = str(uuid4())
        try:
            stored = await self.redis.get(key)
            if stored:
                return model.model_validate_json(stored).model_copy(update={"cached": True})
            if not await self.redis.set(lock_key, owner, nx=True, ex=30):
                raise failure("ANALYTICS_REFRESH_BUSY")
        except (RedisError, ValidationError):
            raise failure("ANALYTICS_CACHE_UNAVAILABLE") from None
        try:
            try:
                async with asyncio.timeout(12):
                    result = await fetch()
                await self.redis.set(key, result.model_dump_json(by_alias=True), ex=ttl)
                return result
            except (TimeoutError, httpx.HTTPError):
                raise failure("ANALYTICS_UPSTREAM_FAILED") from None
            except (ValueError, KeyError, TypeError, IndexError, ValidationError):
                raise failure("ANALYTICS_INVALID_REPORT", 502) from None
            except RedisError:
                raise failure("ANALYTICS_CACHE_UNAVAILABLE") from None
        finally:
            try:
                # Do not delete a different worker's lock if a prior request outlived its lease.
                await cast(
                    Awaitable[object],
                    self.redis.eval(
                        "if redis.call('get',KEYS[1]) == ARGV[1] then "
                        "return redis.call('del',KEYS[1]) else return 0 end",
                        1,
                        lock_key,
                        owner,
                    ),
                )
            except RedisError:
                pass  # The short lease still expires; do not mask the original error.

    async def overview(self, days: Days) -> AnalyticsOverview:
        if not self.settings.analytics_enabled:
            return AnalyticsOverview(
                status="not_configured",
                property_id=self.settings.analytics_property_id,
                range_days=days,
            )
        return await self._cached(
            f"overview:{days}", 300, AnalyticsOverview, lambda: self._overview(days)
        )

    async def _overview(self, days: Days) -> AnalyticsOverview:
        current = report_request(days, METRICS)
        previous = report_request(days, METRICS)
        previous["dateRanges"] = [
            {"startDate": f"{days * 2}daysAgo", "endDate": f"{days + 1}daysAgo"}
        ]
        daily = report_request(days, METRICS, "date")
        daily["limit"] = str(days)
        daily["orderBys"] = [{"dimension": {"dimensionName": "date"}}]
        channels = report_request(days, ["sessions"], "sessionDefaultChannelGroup")
        devices = report_request(days, ["sessions"], "deviceCategory")
        pages = report_request(days, ["screenPageViews"], "pagePath")
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(8, connect=3), transport=self.transport, follow_redirects=False
        ) as client:
            token = await self._token(client)
            batch, page_report = await asyncio.gather(
                self._post(
                    client,
                    token,
                    "batchRunReports",
                    {"requests": [current, previous, daily, channels, devices]},
                ),
                self._post(client, token, "runReport", pages),
            )
        reports = batch["reports"]
        if len(reports) != 5:
            raise ValueError("Incomplete batch")
        current_rows = report_rows(reports[0], METRICS, [])
        previous_rows = report_rows(reports[1], METRICS, [])
        daily_rows = report_rows(reports[2], METRICS, ["date"])
        limitations = []
        for report in [*reports, page_report]:
            metadata = report.get("metadata", {})
            for flag in ("subjectToThresholding", "dataLossFromOtherRow"):
                if metadata.get(flag) and flag not in limitations:
                    limitations.append(flag)
            if metadata.get("samplingMetadatas") and "sampled" not in limitations:
                limitations.append("sampled")
        return AnalyticsOverview(
            status="ready",
            property_id=self.settings.analytics_property_id,
            range_days=days,
            fetched_at=datetime.now(UTC),
            time_zone=reports[0].get("metadata", {}).get("timeZone"),
            totals=totals(current_rows[0] if current_rows else None),
            previous=totals(previous_rows[0] if previous_rows else None),
            daily=[
                AnalyticsDay(
                    date=datetime.strptime(row["date"], "%Y%m%d").date().isoformat(),
                    **totals(row).model_dump(),
                )
                for row in daily_rows
            ],
            channels=[
                AnalyticsSegment(
                    name=row["sessionDefaultChannelGroup"], sessions=int(row["sessions"])
                )
                for row in report_rows(reports[3], ["sessions"], ["sessionDefaultChannelGroup"])
            ],
            devices=[
                AnalyticsSegment(name=row["deviceCategory"], sessions=int(row["sessions"]))
                for row in report_rows(reports[4], ["sessions"], ["deviceCategory"])
            ],
            pages=[
                AnalyticsPage(path=row["pagePath"], views=int(row["screenPageViews"]))
                for row in report_rows(page_report, ["screenPageViews"], ["pagePath"])
            ],
            limitations=limitations,
        )

    async def realtime(self) -> AnalyticsRealtime:
        if not self.settings.analytics_enabled:
            return AnalyticsRealtime(
                status="not_configured", property_id=self.settings.analytics_property_id
            )
        return await self._cached("realtime", 60, AnalyticsRealtime, self._realtime)

    async def _realtime(self) -> AnalyticsRealtime:
        async with httpx.AsyncClient(
            timeout=httpx.Timeout(8, connect=3), transport=self.transport, follow_redirects=False
        ) as client:
            token = await self._token(client)
            report = await self._post(
                client,
                token,
                "runRealtimeReport",
                {
                    "metrics": [{"name": "activeUsers"}],
                    "minuteRanges": [{"startMinutesAgo": 29, "endMinutesAgo": 0}],
                    "returnPropertyQuota": True,
                },
            )
        rows = report_rows(report, ["activeUsers"], [])
        return AnalyticsRealtime(
            status="ready",
            property_id=self.settings.analytics_property_id,
            fetched_at=datetime.now(UTC),
            active_users=int(rows[0]["activeUsers"]) if rows else 0,
        )
