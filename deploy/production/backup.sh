#!/usr/bin/env bash
set -euo pipefail
umask 077
root=/opt/jahan-academy-test
cd "$root"
exec 9>"$root/backup.lock"
flock -n 9 || exit 0
destination="$root/backups"
mkdir -p "$destination"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
file="$destination/jahan-$stamp.dump"
finish() {
  code=$?
  rm -f "$file.partial"
  if [ "$code" -ne 0 ]; then
    printf '{"time":"%s","backup":"failed","exit_code":%s}\n' "$stamp" "$code" >> "$root/operations.jsonl"
  fi
  exit "$code"
}
trap finish EXIT
docker compose -p jahan-academy-test exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' > "$file.partial"
test -s "$file.partial"
docker compose -p jahan-academy-test exec -T db pg_restore --list < "$file.partial" > /dev/null
mv "$file.partial" "$file"
sha256sum "$file" > "$file.sha256"
offsite=not_configured
# This root-owned file must be configured with a real separate host and encryption recipient.
if [ -f "$root/offsite-backup.env" ]; then
  source "$root/offsite-backup.env"
  : "${OFFSITE_SSH_TARGET:?}" "${AGE_RECIPIENT:?}"
  [[ "$OFFSITE_SSH_TARGET" =~ ^[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+:/[a-zA-Z0-9/_-]+$ ]] || exit 2
  [[ "$AGE_RECIPIENT" =~ ^age1[a-z0-9]+$ ]] || exit 2
  command -v age > /dev/null
  age -r "$AGE_RECIPIENT" -o "$file.age" "$file"
  scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15 "$file.age" "$OFFSITE_SSH_TARGET/"
  rm "$file.age"
  touch "$root/offsite-backup-success"
  offsite=success
fi
find "$destination" -maxdepth 1 -type f -name 'jahan-*.dump*' -mtime +14 -delete
printf '{"time":"%s","backup":"success","offsite":"%s"}\n' "$stamp" "$offsite" >> "$root/operations.jsonl"
