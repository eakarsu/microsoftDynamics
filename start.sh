#!/bin/sh
set -eu

project_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
backend_pid=''
frontend_pid=''

: "${BACKEND_HOST:=127.0.0.1}"
: "${BACKEND_PORT:=${PORT:-4001}}"
: "${FRONTEND_HOST:=127.0.0.1}"
: "${FRONTEND_PORT:=3000}"
: "${VITE_API_TARGET:=http://${BACKEND_HOST}:${BACKEND_PORT}}"
: "${ALLOWED_ORIGINS:=http://${FRONTEND_HOST}:${FRONTEND_PORT}}"
export BACKEND_HOST BACKEND_PORT FRONTEND_HOST FRONTEND_PORT VITE_API_TARGET ALLOWED_ORIGINS

finish() {
  [ -z "$backend_pid" ] || kill "$backend_pid" 2>/dev/null || true
  [ -z "$frontend_pid" ] || kill "$frontend_pid" 2>/dev/null || true
  [ -z "$backend_pid" ] || wait "$backend_pid" 2>/dev/null || true
  [ -z "$frontend_pid" ] || wait "$frontend_pid" 2>/dev/null || true
}
trap finish EXIT INT TERM

if [ ! -d "$project_dir/backend/node_modules" ] || [ ! -d "$project_dir/frontend/node_modules" ]; then
  echo "dependencies are missing; run npm ci explicitly in backend and frontend" >&2
  exit 69
fi

(cd "$project_dir/backend" && npm run migrate:check >/dev/null && npm start) &
backend_pid=$!
(cd "$project_dir/frontend" && npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT") &
frontend_pid=$!

echo "backend and frontend started; press Ctrl-C to stop only these child processes"
while kill -0 "$backend_pid" 2>/dev/null && kill -0 "$frontend_pid" 2>/dev/null; do
  sleep 1
done
exit 1
