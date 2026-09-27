# Jahan Academy — Docker Environment

## Runtime Topology

```text
                         Internet
                            │
                            ▼
                    Nginx :8080 (only public port)
                      │             │
          page/static │             │ /api/* and /health/*
                      ▼             ▼
               Next.js Web      FastAPI API
                                      │
          ┌───────┼───────────┬───────────┐
          ▼       ▼           ▼           ▼
    PostgreSQL  Redis      MinIO       ClamAV
                  ▲                       │
                  │                       ▼
          Integration Worker ◄──── Celery Beat
                  │
                  ▼
             Mock Noura API
```

`migrate` is a one-shot container. It waits for PostgreSQL, applies all Alembic migrations, and
must succeed before the API starts. Nginx starts only after both Web and API health checks pass.

## Services

| Service | Role | Public port |
|---|---|---|
| `nginx` | Single local ingress and reverse proxy | `${NGINX_PORT:-8080}` |
| `frontend` | Next.js standalone production server | None |
| `backend` | FastAPI/Uvicorn application | None |
| `migrate` | One-shot Alembic migration runner | None |
| `postgres` | Durable PostgreSQL system of record | None |
| `redis` | Cache, session coordination, and Celery broker | None |
| `worker-integration` | Claims the durable outbox and synchronizes leads | None |
| `beat` | Schedules outbox dispatch every 10 seconds | None |
| `mock-noura` | Idempotent local replacement for the unavailable Noura API | None |
| `minio` | S3-compatible quarantine and public-media object storage | `${MINIO_PORT:-9100}`; console `${MINIO_CONSOLE_PORT:-9101}` |
| `minio-init` | One-shot creation of the quarantine and public-media buckets | None |
| `clamav` | Malware inspection before an uploaded object becomes ready | None |

PostgreSQL, Redis, and ClamAV are attached only to the internal `application` network. MinIO's API
is exposed locally because browser uploads use signed URLs; production replaces it with private
managed object storage/CDN endpoints.

## Start

Create a local environment file and replace the sample passwords:

```powershell
Copy-Item .env.example .env
docker compose up --build --wait
```

Open:

- Persian Web: `http://localhost:8080/fa`
- English Web: `http://localhost:8080/en`
- API docs: `http://localhost:8080/docs`
- API liveness: `http://localhost:8080/health/live`
- API readiness: `http://localhost:8080/health/ready`
- Nginx health: `http://localhost:8080/health/nginx`
- MinIO API: `http://localhost:9100`
- MinIO console: `http://localhost:9101`

Inspect service health and logs:

```powershell
docker compose ps
docker compose logs --follow nginx frontend backend worker-integration beat mock-noura minio clamav
```

## Stop and Reset

Stop containers while preserving database/cache volumes:

```powershell
docker compose down
```

Deleting volumes permanently removes local PostgreSQL and Redis data. Run the following only when
an intentional local reset is required:

```powershell
docker compose down --volumes
```

## Routing

- `/api/*` and `/health/*` are proxied to FastAPI without path rewriting.
- `/_next/static/*` is proxied to Next.js with immutable caching headers.
- Every other path is proxied to Next.js.
- Browser traffic uses one origin, avoiding unnecessary CORS and cookie complexity.

## Production Boundary

This Compose file is a reproducible local/integration environment. Production continues to use
managed PostgreSQL/Redis where available and the single ingress selected for the target host. Do
not expose PostgreSQL or Redis publicly. TLS, runtime secrets, backups, monitoring, and deployment
credentials are external production responsibilities described in `CI_CD.md`.
