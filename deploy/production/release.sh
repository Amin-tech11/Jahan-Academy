#!/usr/bin/env bash
# Run only the reviewed main artifact; never build on the production machine.
set -euo pipefail
umask 077
root=/opt/jahan-academy-test
sha=${1:?Main commit is required}
backend=${2:?Backend digest is required}
frontend=${3:?Frontend digest is required}
[[ "$sha" =~ ^[0-9a-f]{40}$ ]] || exit 2
[[ "$backend" =~ ^ghcr.io/amin-tech11/jahan-academy/backend@sha256:[0-9a-f]{64}$ ]] || exit 2
[[ "$frontend" =~ ^ghcr.io/amin-tech11/jahan-academy/frontend@sha256:[0-9a-f]{64}$ ]] || exit 2
release="$root/releases/$sha"
test "$(realpath "$(dirname "$0")/../..")" = "$release"
cd "$root"
exec 8>release.lock
flock -w 600 8
available=$(awk '/MemAvailable/ { print int($2 / 1024) }' /proc/meminfo)
test "$available" -ge 1500 || { echo 'Insufficient available memory for an isolated rollout'; exit 1; }
test "$(df -Pm "$root" | awk 'NR==2 {print $4}')" -ge 2048
docker pull "$backend"
docker pull "$frontend"
for image in "$backend" "$frontend"; do
  test "$(docker image inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' "$image")" = "$sha"
done
snapshot="$root/releases/rollback-$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p "$snapshot"
for file in compose.yml runtime.env frontend.env database.env preview.conf proxy-headers.conf .env backup.sh retention.sh monitor.py; do
  [ ! -f "$root/$file" ] || cp -p "$root/$file" "$snapshot/"
done
for file in jahan-academy-test-backup jahan-academy-maintenance; do
  [ ! -f "/etc/cron.d/$file" ] || cp -p "/etc/cron.d/$file" "$snapshot/$file"
done
bash "$release/deploy/production/backup.sh"
rollback() {
  code=$?
  trap - ERR
  for file in compose.yml runtime.env frontend.env database.env preview.conf proxy-headers.conf .env backup.sh retention.sh monitor.py; do
    if [ -f "$snapshot/$file" ]; then cp -p "$snapshot/$file" "$root/";
    else rm -f "$root/$file"; fi
  done
  for file in jahan-academy-test-backup jahan-academy-maintenance; do
    if [ -f "$snapshot/$file" ]; then cp -p "$snapshot/$file" "/etc/cron.d/$file";
    else rm -f "/etc/cron.d/$file"; fi
  done
  docker compose -p jahan-academy-test up -d --no-deps --force-recreate backend frontend preview || true
  printf '{"release":"failed","commit":"%s","rollback":"%s"}\n' "$sha" "$snapshot" >> operations.jsonl
  echo "Release failed; previous application/configuration restored. Database backup: $root/backups"
  exit "$code"
}
trap rollback ERR
gateway=$(docker network inspect jahan-academy-test_edge --format '{{(index .IPAM.Config 0).Gateway}}')
python3 "$release/deploy/production/prepare-runtime.py" "$root" "$release/deploy/production/preview.conf.template" "$gateway"
cp "$release/deploy/production/compose.yml" compose.yml
printf 'JAHAN_BACKEND_IMAGE=%s\nJAHAN_FRONTEND_IMAGE=%s\n' "$backend" "$frontend" > .env
docker compose -p jahan-academy-test config --quiet
docker compose -p jahan-academy-test up -d --wait db redis
docker compose -p jahan-academy-test up -d migrate
migration=$(docker compose -p jahan-academy-test ps -aq migrate)
test "$(docker wait "$migration")" = 0
docker compose -p jahan-academy-test up -d --no-deps --force-recreate --wait --wait-timeout 180 backend frontend preview
docker compose -p jahan-academy-test exec -T preview nginx -t
for path in /fa /en /fa/admin /health/ready /sitemap.xml; do
  curl --fail --silent --show-error --retry 6 --retry-delay 3 --connect-timeout 5 --max-time 20 "https://jahanacademi.ir$path" > /dev/null
done
# Cron jobs are confined to this project and installed only after the release is healthy.
cp "$release/deploy/production/backup.sh" "$release/deploy/production/retention.sh" "$release/deploy/production/monitor.py" "$root/"
# Replace this project's older duplicate schedule; do not touch other cron files.
if [ -f /etc/cron.d/jahan-academy-test-backup ]; then
  cp -p /etc/cron.d/jahan-academy-test-backup "$snapshot/legacy-backup-cron"
  rm -f /etc/cron.d/jahan-academy-test-backup
fi
cat > /etc/cron.d/jahan-academy-maintenance <<'CRON'
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
35 3 * * * root bash /opt/jahan-academy-test/backup.sh >> /opt/jahan-academy-test/maintenance.log 2>&1
15 4 * * * root bash /opt/jahan-academy-test/retention.sh >> /opt/jahan-academy-test/maintenance.log 2>&1
*/10 * * * * root flock -n /opt/jahan-academy-test/media-cleanup.lock docker compose -p jahan-academy-test --project-directory /opt/jahan-academy-test exec -T backend /app/.venv/bin/python -m app.modules.media.cleanup --apply >> /opt/jahan-academy-test/maintenance.log 2>&1
* * * * * root flock -n /opt/jahan-academy-test/security-notifications.lock docker compose -p jahan-academy-test --project-directory /opt/jahan-academy-test exec -T backend /app/.venv/bin/python -m app.modules.identity.security_notifications --apply >> /opt/jahan-academy-test/maintenance.log 2>&1
*/5 * * * * root flock -n /opt/jahan-academy-test/monitor.lock python3 /opt/jahan-academy-test/monitor.py >> /opt/jahan-academy-test/maintenance.log 2>&1
CRON
cat > /etc/logrotate.d/jahan-academy <<'ROTATE'
/opt/jahan-academy-test/operations.jsonl /opt/jahan-academy-test/maintenance.log {
  daily
  rotate 14
  compress
  missingok
  notifempty
  create 0600 root root
}
ROTATE
docker compose -p jahan-academy-test exec -T backend /app/.venv/bin/python -m app.modules.operational.maintenance >> operations.jsonl
bash "$root/retention.sh"
python3 "$root/monitor.py"
printf '%s\n' "$sha" > current-main-sha
printf '{"release":"success","commit":"%s"}\n' "$sha" >> operations.jsonl
trap - ERR
echo "Healthy main release: $sha"
