#!/usr/bin/env bash
set -euo pipefail

: "${RESTORE_DATABASE_URL:?RESTORE_DATABASE_URL is required}"
test "$#" -eq 1 || { echo "usage: $0 BACKUP.dump" >&2; exit 64; }
archive=$1
test -f "$archive"
command -v pg_restore >/dev/null

node -e "const u=new URL(process.env.RESTORE_DATABASE_URL); const db=u.pathname.slice(1); if(!['127.0.0.1','localhost','::1'].includes(u.hostname)||!db.endsWith('_restore_test')) throw new Error('restore target must be loopback and end in _restore_test')"
if [ -f "$archive.sha256" ]; then
  (cd "$(dirname "$archive")" && shasum -a 256 -c "$(basename "$archive").sha256")
fi
pg_restore --list "$archive" >/dev/null
pg_restore --dbname="$RESTORE_DATABASE_URL" --clean --if-exists --no-owner --no-acl --exit-on-error "$archive"
DATABASE_URL="$RESTORE_DATABASE_URL" node "$(dirname "$0")/verify-restore.js"
