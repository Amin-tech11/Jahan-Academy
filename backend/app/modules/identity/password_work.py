"""Bounded, nonblocking admission for password work; no unbounded executor queue."""

import asyncio
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor

from app.core.work_budget import heavy_work_slot
from app.shared.exceptions import ApplicationError

_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="auth-password")


async def password_work[**P, T](function: Callable[P, T], *args: P.args, **kwargs: P.kwargs) -> T:
    if not heavy_work_slot.acquire(blocking=False):
        raise ApplicationError(
            "AUTH_CRYPTO_BUSY",
            "Authentication is busy; please retry shortly.",
            503,
            headers={"Retry-After": "1", "Cache-Control": "no-store"},
        )
    try:
        future = _executor.submit(function, *args, **kwargs)
    except BaseException:
        heavy_work_slot.release()
        raise
    # Cancellation of the caller cannot free the budget while native Argon2 still runs.
    future.add_done_callback(lambda _: heavy_work_slot.release())
    return await asyncio.wrap_future(future)
