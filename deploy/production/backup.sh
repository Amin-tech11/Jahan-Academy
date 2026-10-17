#!/usr/bin/env bash
set -euo pipefail
umask 077
root=/opt/jahan-academy-test
cd "$root"
exec 9>"$root/backup.lock"
flock -n 9 || exit 0
destination="$root/backups"
mkdir -p "$destination"
stamp=$(date -u +%Y%m%dT%H%M%S%NZ)
file="$destination/jahan-$stamp.dump.age"
finish() {
  code=$?
  rm -f "$file.partial" "$file.sha256.partial"
  if [ "$code" -ne 0 ]; then
    printf '{"time":"%s","backup":"failed","exit_code":%s}\n' "$stamp" "$code" >> "$root/operations.jsonl"
  fi
  exit "$code"
}
trap finish EXIT

# Public recipient only; private identities belong on a separate recovery host.
# Existing offsite configs carrying AGE_RECIPIENT remain supported.
if [ -f "$root/offsite-backup.env" ]; then
  source "$root/offsite-backup.env"
  : "${OFFSITE_SSH_TARGET:?}"
  [[ "$OFFSITE_SSH_TARGET" =~ ^[a-zA-Z0-9_-]+@[a-zA-Z0-9.-]+:/[a-zA-Z0-9/_-]+$ ]] || exit 2
fi
if [ -f "$root/backup-encryption.env" ]; then
  source "$root/backup-encryption.env"
fi
: "${AGE_RECIPIENT:?Configure a recovery recipient before creating backups}"
[[ "$AGE_RECIPIENT" =~ ^age1[a-z0-9]+$ ]] || exit 2
command -v age > /dev/null
# Validate the recipient checksum before invoking pg_dump.
printf '' | age -r "$AGE_RECIPIENT" > /dev/null

# No plaintext dump, including a temporary one, is ever written to disk.
# pipefail removes the partial ciphertext on dump or encryption failure.
docker compose -p jahan-academy-test exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc' \
  | age -r "$AGE_RECIPIENT" -o "$file.partial"
test -s "$file.partial"
mv "$file.partial" "$file"
(cd "$destination" && sha256sum "$(basename "$file")") > "$file.sha256.partial"
mv "$file.sha256.partial" "$file.sha256"

offsite=not_configured
if [ -f "$root/offsite-backup.env" ]; then
  scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15 "$file" "$OFFSITE_SSH_TARGET/"
  scp -q -o BatchMode=yes -o StrictHostKeyChecking=yes -o ConnectTimeout=15 "$file.sha256" "$OFFSITE_SSH_TARGET/"
  touch "$root/offsite-backup-success"
  offsite=success
fi
# Legacy plaintext copies are not silently removed or counted as encrypted backups.
find "$destination" -maxdepth 1 -type f -name 'jahan-*.dump.age*' -mtime +14 -delete
printf '{"time":"%s","backup":"success","encrypted":true,"offsite":"%s"}\n' "$stamp" "$offsite" >> "$root/operations.jsonl"
