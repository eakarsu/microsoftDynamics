// Entity / field designer with metadata-driven API.
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

// Bootstrap metadata table — best-effort, NEVER run migrations elsewhere.
async function ensure() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS dyn_entities (
      id SERIAL PRIMARY KEY,
      logical_name TEXT UNIQUE NOT NULL,
      display_name TEXT,
      fields JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {
    console.warn('[entityDesigner] ensure table:', e.message);
  }
}
ensure();

// POST /api/entity-designer/entity
router.post('/entity', auth, async (req, res) => {
  try {
    const { logicalName, displayName } = req.body;
    if (!logicalName) return res.status(400).json({ error: 'logicalName required' });
    const r = await pool.query(
      'INSERT INTO dyn_entities (logical_name, display_name) VALUES ($1, $2) RETURNING *',
      [logicalName, displayName || logicalName]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/entity', auth, async (_req, res) => {
  const r = await pool.query('SELECT * FROM dyn_entities ORDER BY id');
  res.json(r.rows);
});

router.get('/entity/:logical', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM dyn_entities WHERE logical_name = $1', [req.params.logical]);
  if (!r.rows.length) return res.status(404).json({ error: 'not found' });
  res.json(r.rows[0]);
});

// POST /api/entity-designer/entity/:logical/field — add a field.
router.post('/entity/:logical/field', auth, async (req, res) => {
  try {
    const { name, type, required = false, options } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'name and type required' });
    const r = await pool.query('SELECT fields FROM dyn_entities WHERE logical_name = $1', [req.params.logical]);
    if (!r.rows.length) return res.status(404).json({ error: 'entity not found' });
    const fields = r.rows[0].fields || [];
    if (fields.some(f => f.name === name)) return res.status(409).json({ error: 'field exists' });
    fields.push({ name, type, required, options: options || null, createdAt: new Date() });
    await pool.query('UPDATE dyn_entities SET fields = $1::jsonb WHERE logical_name = $2', [JSON.stringify(fields), req.params.logical]);
    res.json({ ok: true, fields });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/entity-designer/entity/:logical/schema-form — emit a JSON schema usable by a UI generator.
router.get('/entity/:logical/schema-form', auth, async (req, res) => {
  const r = await pool.query('SELECT * FROM dyn_entities WHERE logical_name = $1', [req.params.logical]);
  if (!r.rows.length) return res.status(404).json({ error: 'not found' });
  const e = r.rows[0];
  const properties = {};
  const required = [];
  for (const f of e.fields || []) {
    properties[f.name] = { type: f.type === 'number' ? 'number' : 'string' };
    if (f.required) required.push(f.name);
  }
  res.json({
    type: 'object',
    title: e.display_name,
    properties,
    required
  });
});

module.exports = router;
