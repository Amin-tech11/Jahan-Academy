from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

from app.modules.identity.authorization import AuthorizationContext
from app.modules.integrations.contracts import (
    NouraAdapterError,
    NouraLeadAdapter,
    PermanentNouraError,
)
from app.modules.integrations.repository import NouraOutboxJob, NouraRepository
from app.modules.integrations.schemas import NouraRetryReceipt
from app.shared.exceptions import ApplicationError

RETRY_DELAYS = (
    timedelta(minutes=5),
    timedelta(minutes=30),
    timedelta(hours=2),
    timedelta(hours=12),
    timedelta(hours=24),
)


def retry_delay_after(attempt: int) -> timedelta | None:
    if 1 <= attempt <= len(RETRY_DELAYS):
        return RETRY_DELAYS[attempt - 1]
    return None


class NouraSyncService:
    RETRY_PERMISSION = frozenset({"lead.sync.retry"})

    def __init__(self, repository: NouraRepository, adapter: NouraLeadAdapter) -> None:
        self._repository = repository
        self._adapter = adapter

    async def process_due(
        self,
        *,
        limit: int,
        lock_timeout_seconds: int,
        worker_id: str | None = None,
    ) -> dict[str, int]:
        jobs = await self._repository.claim_due(
            worker_id=worker_id or f"noura-{uuid4()}",
            limit=limit,
            lock_timeout_seconds=lock_timeout_seconds,
        )
        await self._repository.session.commit()
        result = {"claimed": len(jobs), "synced": 0, "retrying": 0, "failed": 0}
        for job in jobs:
            outcome = await self._process(job)
            result[outcome] += 1
        return result

    async def _process(self, job: NouraOutboxJob) -> str:
        lead = await self._repository.lead_input(job.lead_id)
        if lead is None:
            await self._fail(
                job,
                safe_error="NOURA_LEAD_NOT_FOUND",
                permanent=True,
            )
            return "failed"
        try:
            result = await self._adapter.create_lead(
                lead,
                idempotency_key=job.idempotency_key,
            )
        except PermanentNouraError as exc:
            await self._fail(job, safe_error=exc.safe_code, permanent=True)
            return "failed"
        except NouraAdapterError as exc:
            delay = retry_delay_after(job.attempt)
            await self._fail(
                job,
                safe_error=exc.safe_code,
                permanent=delay is None,
                delay=delay,
            )
            return "failed" if delay is None else "retrying"
        except Exception:
            delay = retry_delay_after(job.attempt)
            await self._fail(
                job,
                safe_error="NOURA_UNEXPECTED_ERROR",
                permanent=delay is None,
                delay=delay,
            )
            return "failed" if delay is None else "retrying"

        await self._repository.mark_success(job, external_id=result.external_id)
        await self._repository.session.commit()
        return "synced"

    async def _fail(
        self,
        job: NouraOutboxJob,
        *,
        safe_error: str,
        permanent: bool,
        delay: timedelta | None = None,
    ) -> None:
        next_attempt_at = datetime.now(UTC) + (delay or timedelta(0))
        await self._repository.mark_failure(
            job,
            safe_error=safe_error,
            final=permanent,
            next_attempt_at=next_attempt_at,
        )
        await self._repository.session.commit()

    async def request_manual_retry(
        self,
        lead_id: UUID,
        actor: AuthorizationContext,
        *,
        note: str | None,
    ) -> NouraRetryReceipt:
        if not actor.allows(self.RETRY_PERMISSION):
            raise ApplicationError(
                code="PERMISSION_DENIED",
                message="You do not have permission to retry Noura synchronization.",
                status_code=403,
            )
        retry = await self._repository.request_manual_retry(lead_id)
        if retry is None:
            await self._repository.session.rollback()
            if not await self._repository.lead_sync_exists(lead_id):
                raise ApplicationError(
                    code="LEAD_NOT_FOUND",
                    message="The consultation lead was not found.",
                    status_code=404,
                )
            raise ApplicationError(
                code="SYNC_NOT_RETRYABLE",
                message="Noura synchronization is not currently retryable.",
                status_code=409,
            )
        await self._repository.audit_manual_retry(
            actor_user_id=actor.user_id,
            lead_id=lead_id,
            note=note,
            manual_retry_count=retry["manual_retry_count"],
        )
        await self._repository.session.commit()
        return NouraRetryReceipt(
            status="pending",
            attempt_count=retry["attempts"],
            manual_retry_count=retry["manual_retry_count"],
            next_attempt_at=retry["next_attempt_at"],
        )
