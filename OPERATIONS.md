# Operations runbook

## Release sequence

1. Pin and record the source revision and container digests.
2. Run the acceptance contract in `SUPPORT_BOUNDARY.md`.
3. Back up the database and verify the checksum.
4. Run the one-shot migration job. Applied migration files are immutable; checksum drift fails closed.
5. Start the API only after migration success, then wait for `/api/health/ready` before exposing the console.
6. Record deployer, time, revision, schema version, backup reference, and approvals outside the repository.

Migrations are forward-only. Restore the pre-release backup or ship a reviewed corrective migration; never edit an applied SQL file.

## Bootstrap and users

Bootstrap exactly once with values delivered out of band. The command refuses to run once a user exists. Thereafter an administrator provisions users through `POST /api/users` and deactivates them through `PATCH /api/users/:id/deactivate`. Deactivation is audited and active tokens fail on their next request.

## Monitoring

The API writes one JSON line per request with request ID, method, path, status, and duration, without request bodies or credentials. Alert on readiness failure, migration failure, repeated 401/403/409/429/5xx responses, latency regression, database saturation, restart loops, backup failure, storage growth, and an invalid audit chain. Forward logs to an access-controlled sink and set retention there.

`/api/health/live` proves the process is serving. `/api/health/ready` proves PostgreSQL connectivity and exact migration coverage. Neither endpoint proves downstream business correctness.

## Backup and restore

Run `scripts/backup.sh` on a schedule appropriate to the accepted recovery-point objective. It creates a mode-0600 custom-format dump and adjacent SHA-256 file. Encrypt and copy both to independent storage; test access controls and lifecycle rules.

At least quarterly, provision an isolated loopback database ending in `_restore_test`, verify the backup checksum, and run `scripts/restore-test.sh`. The guard prevents a remote or ambiguously named restore target. Record row counts, audit verification, duration, and operator. The default recommendation—not a contractual SLO—is daily backups, RPO 24 hours, and RTO 4 hours; accountable owners must replace it with approved targets.

## Retention and privacy

Leads contain personal data. The application intentionally has no hard-delete or automatic retention feature because the repository cannot choose a lawful policy. Before production, owners must define purpose, access, export/correction/deletion handling, regional storage, retention, litigation hold, and audit-log retention. Use reviewed administrative SQL only under an approved data request until a governed product workflow is implemented.

Idempotency receipts can contain response snapshots. Schedule deletion only after an owner chooses a retry window; do not delete receipts still needed for client retries or investigations.

## Incident containment

Remove public routing, preserve logs and database evidence, rotate database/JWT/bootstrap secrets as applicable, invalidate user access, verify the audit chains, restore only from a verified backup, and document scope. Do not “repair” evidence by updating or deleting `audit_events`.
