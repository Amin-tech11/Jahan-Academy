# Jahan Academy — CI/CD

## Pipeline

```text
git push / pull request
          │
          ▼
        Lint
          │
          ▼
     Unit Tests
          │
          ▼
  Integration Tests
          │
          ▼
        Build
          │
          ▼
  Security Checks
          │
          ▼
   Publish to GHCR
          │
          ├── develop ───────► Staging
          │
          └── vX.Y.Z tag ───► Production
```

The workflow is defined in `.github/workflows/ci-cd.yml`. CI runs for every pushed branch and for
pull requests targeting `develop` or `main`. Publish and deployment never run for pull requests.

## CI Gates

| Gate | Coverage |
|---|---|
| Lint | Ruff formatting/linting and strict mypy |
| Unit Tests | Unit, architecture, and OpenAPI contract tests |
| Integration Tests | PostgreSQL 18, Redis 8, authentication flow, migrations, downgrade/re-upgrade |
| Build | Production Docker build and liveness smoke test |
| Security Checks | Dependency audit, Bandit SAST, Gitleaks history scan, Trivy image scan |

Every gate depends on the preceding gate. A failure stops publishing and deployment.

## Image Publishing

Successful pushes to `develop`, `main`, or a semantic version tag publish the backend image to:

```text
ghcr.io/amin-tech11/jahan-academy/backend:<immutable-commit-sha>
```

Branch and semantic-version aliases are also published for operator convenience, but deployment
always consumes the immutable full-commit SHA produced by the workflow.

## Environments

Create GitHub Environments named `staging` and `production`. Configure the following in each one.

Environment variables:

| Variable | Example | Purpose |
|---|---|---|
| `DEPLOY_ENABLED` | `true` | Explicit deployment kill switch |
| `DEPLOY_PATH` | `/srv/jahan-academy` | Repository checkout on the host |
| `APP_URL` | `https://staging.example.com` | Link displayed by GitHub |
| `HEALTHCHECK_URL` | `https://staging.example.com/health/live` | Post-deployment verification |

Environment secrets:

| Secret | Purpose |
|---|---|
| `SSH_HOST` | Deployment server hostname or IP |
| `SSH_PORT` | SSH port; defaults to `22` when omitted |
| `SSH_USER` | Restricted deployment account |
| `SSH_PRIVATE_KEY` | Private key dedicated to GitHub Actions deployment |

Do not store application secrets in the repository or workflow. Store the runtime `deploy/.env`
only on the deployment host with restrictive permissions. Use `deploy/.env.example` as the schema.

## Server Bootstrap

The server must have Docker Engine, Docker Compose v2, a dedicated read-only Git checkout, and
permission to pull the private GHCR package. The deployment account must be able to fetch this
repository without an interactive prompt. Authenticate GHCR once using a narrowly scoped read-only
package token.

The deployment sequence is:

1. Pull the immutable image.
2. Apply Alembic migrations as a one-shot container.
3. Reconcile API and worker containers.
4. Verify the public liveness endpoint.

If migration or health verification fails, the job fails and GitHub records the unsuccessful
deployment. Database migrations must remain backward compatible so the previous immutable image
can be restored safely.

## Release Policy

- Pushes to feature and fix branches run CI only.
- Merging to `develop` publishes and deploys to staging when `DEPLOY_ENABLED=true`.
- Production deployment requires a semantic tag such as `v1.0.0` from `main`.
- Configure required reviewers on the GitHub `production` Environment.
- Keep `DEPLOY_ENABLED` unset or `false` until hosting, domain, TLS, database, Redis, and runtime
  secrets are ready.
