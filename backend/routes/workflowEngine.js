// Workflow + approval engine (visual builder backend).
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

async function ensure() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS dyn_workflows (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      definition JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS dyn_workflow_runs (
      id SERIAL PRIMARY KEY,
      workflow_id INTEGER REFERENCES dyn_workflows(id),
      status TEXT,
      context JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {
    console.warn('[workflowEngine] ensure:', e.message);
  }
}
ensure();

// POST /api/workflows — create a workflow.
router.post('/', auth, async (req, res) => {
  try {
    const { name, definition } = req.body;
    if (!name || !definition) return res.status(400).json({ error: 'name and definition required' });
    const r = await pool.query('INSERT INTO dyn_workflows (name, definition) VALUES ($1, $2::jsonb) RETURNING *',
      [name, JSON.stringify(definition)]);
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', auth, async (_req, res) => {
  const r = await pool.query('SELECT * FROM dyn_workflows ORDER BY id DESC LIMIT 100');
  res.json(r.rows);
});

// POST /api/workflows/:id/run — run a workflow with a context object.
router.post('/:id/run', auth, async (req, res) => {
  try {
    const wf = (await pool.query('SELECT * FROM dyn_workflows WHERE id = $1', [req.params.id])).rows[0];
    if (!wf) return res.status(404).json({ error: 'workflow not found' });
    const def = wf.definition || {};
    let ctx = { ...(req.body || {}) };
    const trace = [];
    for (const step of def.steps || []) {
      trace.push({ step: step.id || step.name, before: { ...ctx } });
      if (step.type === 'approval') {
        ctx._needs_approval = true;
        trace.push({ step: step.id, action: 'paused-for-approval' });
        break;
      }
      if (step.type === 'set') {
        ctx[step.field] = step.value;
      }
      if (step.type === 'compute' && step.expression) {
        try {
          const f = new Function('ctx', `with(ctx){ return (${step.expression}); }`);
          ctx[step.target || '_result'] = f(ctx);
        } catch (err) {
          trace.push({ step: step.id, error: err.message });
        }
      }
    }
    const run = await pool.query(
      'INSERT INTO dyn_workflow_runs (workflow_id, status, context) VALUES ($1, $2, $3::jsonb) RETURNING *',
      [wf.id, ctx._needs_approval ? 'awaiting_approval' : 'completed', JSON.stringify({ ctx, trace })]
    );
    res.json(run.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/workflows/runs/:runId/approve
router.post('/runs/:runId/approve', auth, async (req, res) => {
  const decision = (req.body.decision || 'approve').toLowerCase();
  const r = await pool.query('UPDATE dyn_workflow_runs SET status = $1 WHERE id = $2 RETURNING *',
    [decision === 'approve' ? 'completed' : 'rejected', req.params.runId]);
  if (!r.rows.length) return res.status(404).json({ error: 'run not found' });
  res.json(r.rows[0]);
});

module.exports = router;
