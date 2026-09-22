# Jahan Academy

Jahan Academy is a bilingual platform for university discovery, educational-migration guidance,
consultation lead management, and the future applicant, learning, and commerce journeys.

The repository currently contains the approved product/engineering specifications, PostgreSQL
schema and migrations, modular FastAPI backend foundation, contract-first API, authentication, and
authorization framework.

## Project References

- [Source of truth](PROJECT_CONTEXT.md)
- [Software requirements](SRS.md)
- [API contracts](API_DESIGN.md)
- [Backend architecture](BACKEND_ARCHITECTURE.md)
- [Database design](DATABASE_DESIGN.md)
- [Git workflow](GIT_WORKFLOW.md)
- [CI/CD pipeline](CI_CD.md)

## Backend Development

Requirements: Python 3.12, uv, Docker, and Docker Compose.

```powershell
cd backend
uv sync --frozen --dev
uv run ruff format --check app tests
uv run ruff check app tests
uv run mypy app tests
uv run pytest
```

Start the disposable PostgreSQL database and apply migrations:

```powershell
docker compose -f database/compose.yml up -d
cd backend
uv run alembic -c alembic.ini upgrade head
```

Build the production backend image from the repository root:

```powershell
docker build -f backend/Dockerfile -t jahan-academy-backend:dev .
```

Never commit `.env` files or production secrets. Copy `backend/.env.example` for local settings.
