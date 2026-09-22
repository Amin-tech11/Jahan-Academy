FROM ghcr.io/astral-sh/uv:0.11.18 AS uv

FROM python:3.12-slim AS runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    HOME=/app
WORKDIR /app
RUN addgroup --system jahan && adduser --system --ingroup jahan jahan
COPY --from=uv /uv /uvx /bin/
COPY backend/pyproject.toml backend/uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini backend/migration_sql_runner.py ./
COPY database/sql /database/sql
RUN uv sync --frozen --no-dev && chown -R jahan:jahan /app
USER jahan
EXPOSE 8000
CMD ["/app/.venv/bin/uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
