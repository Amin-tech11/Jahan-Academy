FROM ghcr.io/astral-sh/uv:0.12.17 AS uv

FROM python:3.12-slim AS runtime
RUN apt-get update \
    && apt-get upgrade -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    HOME=/app
WORKDIR /app
# Refresh Debian security packages so the runtime image includes patched system libraries.
RUN apt-get update && apt-get upgrade -y && rm -rf /var/lib/apt/lists/*
RUN addgroup --system jahan && adduser --system --ingroup jahan jahan
COPY --from=uv /uv /uvx /bin/
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini backend/migration_sql_runner.py ./
COPY database/sql /database/sql
RUN uv sync --frozen --no-dev \
    && chown -R jahan:jahan /app \
    && rm -f /bin/uv /bin/uvx
USER jahan
EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
