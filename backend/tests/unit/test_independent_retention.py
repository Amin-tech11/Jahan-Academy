from unittest.mock import AsyncMock, Mock

import pytest

from app.core.config import Settings
from app.modules.operational import maintenance


@pytest.mark.parametrize("failed_job", ["sheets", "media", "both"])
async def test_remote_failure_never_skips_other_cleanup(
    monkeypatch: pytest.MonkeyPatch, failed_job: str
) -> None:
    session = AsyncMock()
    session.scalar.return_value = 0
    factory = Mock()
    factory.return_value.__aenter__ = AsyncMock(return_value=session)
    factory.return_value.__aexit__ = AsyncMock(return_value=False)
    repo = Mock()
    repo.anonymize_expired_leads = AsyncMock(return_value=0)
    repo.remove_expired_idempotency_keys = AsyncMock(return_value=0)
    media = AsyncMock(return_value=3)
    sheets = AsyncMock(return_value={"status": "success"})
    for name, function in [("media", media), ("sheets", sheets)]:
        if failed_job in {name, "both"}:
            function.side_effect = RuntimeError(name)
    monkeypatch.setattr(maintenance, "get_settings", lambda: Settings(_env_file=None))
    monkeypatch.setattr(maintenance, "session_factory", factory)
    monkeypatch.setattr(maintenance, "RetentionRepository", lambda _: repo)
    monkeypatch.setattr(maintenance, "S3MediaStorage", Mock())
    monkeypatch.setattr(maintenance, "cleanup_uploads", media)
    monkeypatch.setattr(maintenance, "cleanup_sheets", sheets)
    monkeypatch.setattr(maintenance, "dispose_database", AsyncMock())
    with pytest.raises(ExceptionGroup) as errors:
        await maintenance.run(apply=True)
    media.assert_awaited_once()
    sheets.assert_awaited_once()
    assert len(errors.value.exceptions) == (2 if failed_job == "both" else 1)
    assert session.rollback.await_count == len(errors.value.exceptions)
