# Governed sales core

This repository implements one supported CRM workflow: tenant-scoped lead creation, deterministic qualification, and transactional conversion into an opportunity. It does not claim Microsoft Dynamics 365 compatibility or affiliation.

## Supported outcome

A signed-in tenant user can:

1. Create a lead with an idempotency key.
2. Score it with explicit budget, authority, need, and timeline facts.
3. Re-score only against the current optimistic version.
4. Convert a score of at least 75 into exactly one opportunity.
5. Retrieve only records allowed by their tenant and role.

Every mutation appends a SHA-256-linked audit event. Conversion, lead state change, audit append, and idempotency receipt commit in one PostgreSQL transaction. Sales representatives see only their own pipeline; managers and administrators see their tenant. Administrators can provision and deactivate users. Deactivated credentials stop working on the next request, including with a previously issued token.

## Local setup

Requirements: Node.js 22, npm, and PostgreSQL 17 (the SQL remains compatible with supported PostgreSQL 14+ releases, but CI proves 17).

```sh
cp .env.example .env
npm ci --prefix backend
npm ci --prefix frontend
npm --prefix backend run migrate
npm --prefix backend run bootstrap
./start.sh
```

Edit `.env` before running anything. The bootstrap command is intentionally one-time, requires an exact acknowledgement and a strong non-default password, and refuses to run after any user exists. Remove all `BOOTSTRAP_*` values afterward. There are no demo credentials.

Use a dedicated application database/schema. The runtime accepts either `DATABASE_URL` or the separate `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` variables used by Compose.

The console listens on `127.0.0.1:3000` and the API on `127.0.0.1:4001` by default. `start.sh` never installs packages, kills unrelated processes, starts PostgreSQL, creates a database, migrates, or seeds data. It checks that migrations are current and manages only the two processes it starts.

## Quality gates

```sh
./scripts/verify.sh
```

The integration suite runs when `TEST_DATABASE_URL` targets a loopback database whose name ends in `_test`. It deliberately recreates only that guarded test schema. CI provides such a database and proves tenant isolation, owner scoping, authentication, user deactivation, validation, optimistic conflicts, idempotent replay/conflict, conversion uniqueness, audit immutability, and audit-chain verification.

## Deployment and recovery

`compose.yaml` provides a private PostgreSQL/API network, a one-shot migration gate, read-only non-root application containers, a health-gated frontend, and a loopback-only published port by default. Set deployment secrets outside the repository and review `OPERATIONS.md` before use.

Backups and guarded restore drills:

```sh
DATABASE_URL=... ./scripts/backup.sh
RESTORE_DATABASE_URL=postgresql://.../dynamics_restore_test ./scripts/restore-test.sh backups/example.dump
```

The restore verifier checks the migration level and every tenant audit chain.

## API boundary

- `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/users`, `PATCH /api/users/:id/deactivate` (administrator)
- `POST /api/leads`, `GET /api/leads`, `GET /api/leads/:id`
- `POST /api/leads/:id/qualify`, `POST /api/leads/:id/convert`
- `GET /api/opportunities`
- `GET /api/audit-events`, `GET /api/audit-events/verify` (manager/administrator)
- `GET /api/health/live`, `GET /api/health/ready`

See `SUPPORT_BOUNDARY.md`, `SECURITY.md`, and `OPERATIONS.md`. No license has been granted in this repository; public redistribution remains blocked until the owner supplies one.
