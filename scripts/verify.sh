#!/usr/bin/env bash
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
cd "$root"

bash -n start.sh scripts/*.sh
npm --prefix backend run check
npm --prefix backend test
npm --prefix frontend run build
npm --prefix backend audit --audit-level=low
npm --prefix frontend audit --audit-level=low

if command -v gitleaks >/dev/null; then
  gitleaks detect --source . --no-banner --redact --config .gitleaks.toml
fi
