#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"
command -v pg_dump >/dev/null
command -v shasum >/dev/null

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
destination=${BACKUP_DIRECTORY:-"$root/backups"}
umask 077
mkdir -p "$destination"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
archive="$destination/dynamics-sales-$timestamp.dump"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$archive"
pg_restore --list "$archive" >/dev/null
shasum -a 256 "$archive" > "$archive.sha256"
chmod 600 "$archive" "$archive.sha256"
printf '%s\n' "$archive"
