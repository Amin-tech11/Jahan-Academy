from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import session_factory


async def database_session() -> AsyncIterator[AsyncSession]:
    async with session_factory() as session:
        yield session
