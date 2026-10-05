#!/usr/bin/env bash
set -euo pipefail
repo=$(cd "$(dirname "$0")/.." && pwd)
integration=0 lint=0 build=0
for argument in "$@"; do
  case "$argument" in
    --integration) integration=1 ;;
    --lint) lint=1 ;;
    --build) build=1 ;;
    *) echo "Unknown option: $argument" >&2; exit 2 ;;
  esac
done
# Keep Linux binaries and environments on the F-backed Ubuntu disk, isolated
# from the runner's active checkout and from other panel environments.
key=$(printf '%s' "$repo" | sha256sum | cut -c1-12)
state="$HOME/local-tests/$key"
mkdir -p "$state"
exec 9>"$state/test.lock"
flock -n 9 || { echo 'Tests are already running for this checkout.' >&2; exit 1; }
uv=$(command -v uv || true)
if [[ -z "$uv" ]]; then
  uv=$(find /opt/actions-runner-jahan/_work/_tool/uv -maxdepth 3 -type f -name uv | sort -V | tail -1)
fi
[[ -x "$uv" ]] || { echo 'uv is missing from the local runner tool cache.' >&2; exit 1; }
export UV_PROJECT_ENVIRONMENT="$state/.venv"
export RUFF_CACHE_DIR="$state/ruff-cache"
export MYPY_CACHE_DIR="$state/mypy-cache"
export UV_PYTHON_INSTALL_MIRROR=https://github.com/astral-sh/python-build-standalone/releases/download
export JAHAN_ENVIRONMENT=test
unset JAHAN_RUN_INTEGRATION
cd "$repo/backend"
"$uv" sync --frozen --dev
if ((lint)); then
  "$uv" run --frozen ruff format --check app tests
  "$uv" run --frozen ruff check app tests
  "$uv" run --frozen mypy app tests
fi
"$uv" run --frozen pytest -o "cache_dir=$state/pytest-cache" tests/unit tests/architecture tests/contract -q
id="jahan-local-test-$key-$$"
context=""
cleanup() {
  if ((integration)); then
    docker rm -fv "$id-postgres" "$id-redis" >/dev/null 2>&1 || true
  fi
  if ((build)); then
    docker rm -f "$id-smoke" >/dev/null 2>&1 || true
    docker image rm "$id:backend" >/dev/null 2>&1 || true
    if [[ -n "$context" && "$context" == "$state"/build-context.* ]]; then
      rm -rf -- "$context"
    fi
  fi
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
if ((integration)); then
  docker run -d --name "$id-postgres" -p 127.0.0.1::5432 \
    --tmpfs /var/lib/postgresql:rw,size=512m \
    -e POSTGRES_DB=jahan_test -e POSTGRES_USER=jahan -e POSTGRES_PASSWORD=local_test_only \
    postgres:18-alpine >/dev/null
  docker run -d --name "$id-redis" -p 127.0.0.1::6379 redis:8-alpine >/dev/null
  ready=0
  for ((attempt=0; attempt<60; attempt++)); do
    if docker exec "$id-postgres" pg_isready -U jahan -d jahan_test >/dev/null 2>&1 \
      && docker exec "$id-redis" redis-cli ping >/dev/null 2>&1; then
      ready=1; break
    fi
    sleep 1
  done
  if ((!ready)); then
    docker logs "$id-postgres"
    docker logs "$id-redis"
    echo 'Isolated test services failed to start.' >&2
    exit 1
  fi
  pgport=$(docker port "$id-postgres" 5432/tcp | cut -d: -f2)
  redisport=$(docker port "$id-redis" 6379/tcp | cut -d: -f2)
  export DATABASE_URL="postgresql+psycopg://jahan:local_test_only@127.0.0.1:$pgport/jahan_test"
  export JAHAN_DATABASE_URL="postgresql+asyncpg://jahan:local_test_only@127.0.0.1:$pgport/jahan_test"
  export JAHAN_REDIS_URL="redis://127.0.0.1:$redisport/0"
  export JAHAN_SESSION_SECRET=local-test-only-secret-longer-than-32-characters
  export JAHAN_RUN_INTEGRATION=1
  "$uv" run --frozen alembic -c alembic.ini upgrade head
  "$uv" run --frozen pytest -o "cache_dir=$state/pytest-cache" tests/integration -q
  "$uv" run --frozen alembic -c alembic.ini downgrade -1
  "$uv" run --frozen alembic -c alembic.ini upgrade head
fi
if ((build)); then
  cd "$repo"
  # DrvFS cache folders can deny extended-attribute reads even when ignored by
  # Docker. Stage only the production Dockerfile's inputs on Linux storage.
  context=$(mktemp -d "$state/build-context.XXXXXX")
  tar --exclude='__pycache__' --exclude='*.pyc' -cf - \
    .dockerignore backend/Dockerfile backend/pyproject.toml backend/uv.lock \
    backend/app backend/alembic backend/alembic.ini backend/migration_sql_runner.py \
    database/sql | tar -C "$context" -xf -
  docker build --progress=plain -f "$context/backend/Dockerfile" -t "$id:backend" "$context"
  docker run -d --name "$id-smoke" -p 127.0.0.1::8000 "$id:backend" >/dev/null
  address=$(docker port "$id-smoke" 8000/tcp)
  for ((attempt=0; attempt<30; attempt++)); do
    if curl --fail --silent "http://$address/health/live"; then exit 0; fi
    sleep 1
  done
  docker logs "$id-smoke"
  exit 1
fi
