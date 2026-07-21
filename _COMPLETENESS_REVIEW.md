# Completeness Review: microsoftDynamics

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 40 project files (30 source files), 2 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Prototype-demo**

This is a prototype/demo for application workflow. Generated gap/demo patterns are present: it contains 30 source files and visible routes/pages in `frontend/`, `backend/`, but those surfaces are not evidence of durable domain execution, verified integrations, or operational completion.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Define the primary user and acceptance criteria, then complete one end-to-end workflow against persistent data instead of demo fixtures.
2. Replace mocks, placeholders, and generic AI responses with validated domain services and explicit failure/retry behavior.
3. Implement secure identity, role/tenant boundaries, input validation, secrets handling, and auditable state changes.
4. Add representative automated tests, CI quality gates, environment documentation, migrations, observability, backup, and deployment configuration.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `frontend/src/App.jsx:13`
- `frontend/src/components/MappingRulesEditor.jsx:112`
- `backend/server.js`
- `backend/middleware/auth.js`
- `backend/package.json`
- `start.sh`

## Recommended next action

Stop adding generated pages; prove one application workflow workflow against real services and persistent state, with tests and measurable acceptance criteria.

## Implementation progress (2026-07-20)

All five source-actionable requirements are now implemented for one bounded sales-representative journey: tenant-scoped lead capture, deterministic qualification, and transactional conversion into exactly one opportunity.

- Persistent PostgreSQL tables and checksum-pinned migrations now hold tenants, active users, owned/versioned leads, immutable qualification evidence, opportunities, idempotency receipts, and per-tenant SHA-256 audit chains. Applying both migrations and replaying them is safe; altered applied checksums and pending migration startup fail closed.
- The supported service replaces mock/AI decisions with a documented BANT-style rubric, bounded validation, parameterized SQL, explicit lifecycle rules, optimistic conflicts, row-locked ownership checks, and transactional idempotent create/convert operations. Unsupported AI, connector, visualization, and generic CRM breadth was removed from both API and console.
- JWT authentication requires a 32+ byte deployment secret and verifies algorithm, issuer, audience, subject, tenant, and current active-user state on every request. Sales representatives see only their own tenant records; managers/administrators see tenant records; user administration and audit access are role-gated; deactivation immediately revokes existing tokens. CORS is explicit and non-enumerating errors omit credentials and request bodies.
- The replacement console exposes only the supported persisted journey and its version, deterministic facts, opportunity result, and authorized audit verification. Demo users, public registration, fallback secrets, fake provider success, automatic seeding, runtime migration, port killing, dependency installation, and database creation were removed from startup.
- CI now installs exact locks, applies/replays/checks migrations on PostgreSQL 17, runs unit and live HTTP/database integration tests, performs syntax and frontend production builds, rejects any dependency advisory, validates shell/Compose, scans full history for secrets, and builds both non-root/read-only production images. Environment, support, security, observability, backup/restore, recovery, and one-time fail-closed bootstrap contracts are checked in.

Fresh verification completed on 2026-07-20: both migrations applied and replayed with no pending work; 8/8 tests across three files passed against disposable PostgreSQL, covering normalization/rubric determinism and invalid input plus invalid login, tenant and same-tenant owner isolation, role denial, explicit-origin rejection, create/convert replay and payload conflict, stale versions, checksum-drift readiness rejection, conversion uniqueness, user provisioning/deactivation, token revocation, audit verification, and database rejection of audit mutation. Backend syntax checked 16 files; the Vite 8 production build passed; backend and frontend audits reported zero findings at the low-severity threshold; Compose and workflow YAML, shell syntax, executable modes, and `git diff --check` passed; the current tree and all six Git commits passed Gitleaks after test credentials were generated ephemerally. A custom-format backup restored into a guarded loopback database with identical `2:2:1:1:4` migration/tenant/lead/opportunity/audit counts and valid audit chains. The production API accepted both URL and separately supplied PostgreSQL configuration and returned live/ready 200, unauthenticated 401, unsupported legacy 404, and disallowed-origin 403.

Source completion does not certify a Microsoft Dynamics integration or a production deployment. Real licensed-provider bidirectional sync/reconciliation, named product/security/privacy/data/release/recovery owners, an approved license/name posture, MFA/SSO, managed secrets and database TLS/least privilege, regional retention/deletion policy, centralized monitoring, browser/accessibility/load testing, target-platform restore drills, and Docker image execution remain explicit external release gates; the local Docker daemon was unavailable, while CI contains both image builds.

## Runtime verification (2026-07-20)

- The safe launcher now propagates caller-assigned backend/frontend hosts and ports, derives the Vite proxy and explicit CORS origin from those values, and retains the original production defaults when they are not supplied.
- The existing acknowledged one-time administrator bootstrap is exposed as `create-admin` for disposable acceptance runs; it remains fail-closed and refuses to overwrite an existing user.
