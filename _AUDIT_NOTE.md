# Audit Note - microsoftDynamics

Source: `_AUDIT/reports/batch_10.md` (lines 260-271).

## Original Audit Recommendations

Audit verdict: **SKELETON** — "UI-only, no backend." (NOTE: The audit was inaccurate. The repo has a working Express backend in `backend/server.js` with auth, generic CRUD, dashboard stats, and 8 existing AI endpoints: sales-forecast, lead-scoring, sentiment, content-generate, insights, copilot, performance, competitor-analysis.)

### What's Missing (per audit)
- Records CRUD, module navigation, field management, workflows.
- No AI for insights, forecasting, or automation.

(Most of the above is partially present already; the gaps in practice are around workflow automation, churn analytics, and quote generation.)

## Implementations Applied

Added 3 AI endpoints to `backend/server.js` matching the existing `callAI` + `auth` pattern:
- `POST /api/ai/quote-generate`
- `POST /api/ai/churn-prediction`
- `POST /api/ai/workflow-recommend`

Each follows the existing inline route style (no separate router file). No new dependencies.

## Backlog (Prioritized)

### High
- Field/entity metadata management (Dynamics-style entities/fields).
- Real workflow engine (state machine, approvals).
- Module navigation in frontend.

### Medium
- Records CRUD UI.
- Lead-to-opportunity conversion automation.
- Outlook/Teams integration.

### Low / Product Decisions
- Power BI report embedding.
- Power Automate connector parity.

## Apply pass 3 (frontend)

LEFT-AS-IS. `frontend/src/pages/AIAdvanced.jsx` is a three-tool selector wired
to the apply2 endpoints (`/api/ai/quote-generate`, `/api/ai/churn-prediction`,
`/api/ai/workflow-recommend`) via `callAI(endpoint, body)` in
`frontend/src/api.js`, which injects `Authorization: Bearer ${token}` from
localStorage and 401-redirects to `/login`. Backend 503-no-key bubbles via
`data.error.message`. `AIInsights.jsx` covers the older AI endpoints. Both
registered in `App.jsx` (`/ai-advanced`, `/ai-insights`). No edits.

## Apply pass 4 (mechanical backlog)

IMPLEMENTED — 2 features matching the prioritized backlog.

1. `POST /api/ai/lead-conversion-advisor` (covers backlog: medium —
   "Lead-to-opportunity conversion automation"). Accepts an inline `lead`
   object/text or a `leadId` (DB lookup against `leads`), plus optional
   BANT-style criteria. Returns JSON with `convert_now`, `readiness_score`,
   `suggested_opportunity`, `next_actions`, `risks`.
2. `POST /api/ai/workflow-state-machine` (covers backlog: high — "Real
   workflow engine — state machine, approvals"). Accepts `processName`,
   `description`, `actors`, `approvalLevels` and returns a JSON state
   machine: `states`, `transitions`, `approvals` (with role + escalation
   SLA), `notifications`, `kpis`, `example_happy_path`. This is a
   design-time generator; an actual runtime engine remains TOO-RISKY.

Both endpoints follow the existing inline `app.post('/api/ai/...', auth,
async ...)` pattern in `backend/server.js`, reuse the shared `callAI` +
`pool` helpers, and add explicit `503` short-circuit when
`OPENROUTER_API_KEY` is missing (returning `{error:{message:...}}` to match
the existing FE error path in `AIAdvanced.jsx`). FE adds two new feature
cards to the existing AIAdvanced grid (now 5 tools), extends the textarea
field whitelist to cover the new long-form fields, and tolerates both
string-shape and object-shape `error` payloads in `submit`.

Verified with `node --check` (BE) and local `esbuild` (FE). Live HTTP smoke
skipped — backend requires PostgreSQL.

Remaining backlog (field/entity metadata management, records CRUD UI,
module navigation in frontend, runtime workflow engine) is mechanical but
non-AI / large-refactor and skipped per pass-4 scope; Outlook/Teams,
Power BI embedding, Power Automate connector parity remain NEEDS-CREDS /
NEEDS-PRODUCT-DECISION.
