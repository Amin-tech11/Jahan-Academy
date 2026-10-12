#!/usr/bin/env bash
set -euo pipefail
umask 077
cd /opt/jahan-academy-test
exec 9>retention.lock
flock -n 9 || exit 0
docker compose -p jahan-academy-test exec -T backend /app/.venv/bin/python -m app.modules.operational.maintenance --apply >> operations.jsonl
touch retention-success
