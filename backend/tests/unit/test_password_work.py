import asyncio
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from unittest.mock import Mock, patch

import pytest

from app.core.config import Settings
from app.core.work_budget import heavy_work_slot
from app.modules.identity.dependencies import _cached_auth_security, auth_security
from app.modules.identity.password_work import password_work
from app.modules.identity.security import AuthSecurity
from app.shared.exceptions import ApplicationError


def test_security_construction_never_hashes() -> None:
    with patch("app.modules.identity.security.PasswordHasher.hash", side_effect=AssertionError):
        AuthSecurity(Settings(_env_file=None))


def test_concurrent_cold_cache_constructs_only_one_instance() -> None:
    barrier = threading.Barrier(6)
    instance = Mock(spec=AuthSecurity)

    def construct(*args: object) -> Mock:
        time.sleep(0.02)
        return instance

    def get(_: int) -> AuthSecurity:
        barrier.wait(timeout=2)
        return auth_security()

    _cached_auth_security.cache_clear()
    try:
        with patch("app.modules.identity.dependencies.AuthSecurity", side_effect=construct) as ctor:
            with ThreadPoolExecutor(max_workers=6) as pool:
                assert all(result is instance for result in pool.map(get, range(6)))
            assert ctor.call_count == 1
    finally:
        _cached_auth_security.cache_clear()


@pytest.mark.parametrize("cancel", [False, True])
async def test_native_work_does_not_block_loop_or_release_budget_on_cancellation(
    cancel: bool,
) -> None:
    started, release = threading.Event(), threading.Event()
    caller_thread = threading.get_ident()

    def blocked() -> int:
        assert threading.get_ident() != caller_thread
        started.set()
        assert release.wait(3)
        return 7

    task = asyncio.create_task(password_work(blocked))
    try:
        assert await asyncio.to_thread(started.wait, 2)
        await asyncio.wait_for(asyncio.sleep(0.01), 0.5)
        if cancel:
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
        rejected = Mock(return_value=0)
        with pytest.raises(ApplicationError) as error:
            await password_work(rejected)
        assert error.value.code == "AUTH_CRYPTO_BUSY" and error.value.status_code == 503
        rejected.assert_not_called()
    finally:
        release.set()
        if not cancel:
            assert await task == 7
        # Wait for the native Future's completion callback, not just the cancelled coroutine.
        for _ in range(200):
            if heavy_work_slot.acquire(blocking=False):
                heavy_work_slot.release()
                break
            await asyncio.sleep(0.01)
        else:
            pytest.fail("Native completion did not release capacity")
    assert await password_work(lambda: 9) == 9


async def test_failed_native_work_releases_budget() -> None:
    def fail() -> None:
        raise ValueError("synthetic failure")

    with pytest.raises(ValueError, match="synthetic"):
        await password_work(fail)
    assert await password_work(lambda: True)
