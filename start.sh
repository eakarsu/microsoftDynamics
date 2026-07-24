#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
set -a
# shellcheck disable=SC1091
source "$project_dir/.env"
set +a

mode="${1:-start}"
case "$mode" in
  start) ;;
  migrate) exec npm --prefix "$project_dir/backend" run migrate ;;
  check) exec npm --prefix "$project_dir/backend" run check ;;
  *) echo 'usage: ./start.sh [start|migrate|check]' >&2; exit 2 ;;
esac

: "${DATABASE_URL:?DATABASE_URL is required}"
: "${BACKEND_PORT:?BACKEND_PORT is required}"
: "${FRONTEND_PORT:?FRONTEND_PORT is required}"
: "${OPENROUTER_API_KEY:?OPENROUTER_API_KEY is required}"
: "${OPENROUTER_MODEL:?OPENROUTER_MODEL is required}"
: "${OPENROUTER_BASE_URL:?OPENROUTER_BASE_URL is required}"
[[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo 'BACKEND_PORT and FRONTEND_PORT must differ' >&2; exit 1; }
for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
  [[ "$port" =~ ^[0-9]+$ ]] && (( port >= 1024 && port <= 65535 )) || { echo 'Invalid assigned port' >&2; exit 1; }
  ! lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 || { echo "Port $port is occupied" >&2; exit 1; }
done
[[ -d "$project_dir/backend/node_modules" && -d "$project_dir/frontend/node_modules" ]] || { echo 'Dependencies are missing' >&2; exit 1; }

export BACKEND_HOST=127.0.0.1
export ALLOWED_ORIGINS="http://127.0.0.1:$FRONTEND_PORT"
export VITE_API_TARGET="http://127.0.0.1:$BACKEND_PORT"
export BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin
export BOOTSTRAP_TENANT_NAME="${BOOTSTRAP_TENANT_NAME:-Runtime Acceptance}"
export BOOTSTRAP_ADMIN_NAME="${BOOTSTRAP_ADMIN_NAME:-${PROVISION_ADMIN_NAME:-Runtime Administrator}}"

npm --prefix "$project_dir/backend" run migrate
npm --prefix "$project_dir/backend" run create-admin

backend_pid=''; frontend_pid=''
cleanup() {
  trap - INT TERM EXIT
  [[ -z "$frontend_pid" ]] || kill "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || kill "$backend_pid" 2>/dev/null || true
  [[ -z "$frontend_pid" ]] || wait "$frontend_pid" 2>/dev/null || true
  [[ -z "$backend_pid" ]] || wait "$backend_pid" 2>/dev/null || true
}
trap cleanup INT TERM EXIT

(cd "$project_dir/backend" && exec npm start) & backend_pid=$!
for _ in $(seq 1 240); do
  curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health/ready" >/dev/null 2>&1 && break
  kill -0 "$backend_pid" 2>/dev/null || { wait "$backend_pid"; exit $?; }
  sleep 0.25
done
curl -fsS "http://127.0.0.1:$BACKEND_PORT/api/health/ready" >/dev/null
(cd "$project_dir/frontend" && exec npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT") & frontend_pid=$!
wait "$backend_pid" "$frontend_pid"
