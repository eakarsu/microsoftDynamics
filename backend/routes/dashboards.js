// Customizable dashboards per role with embedded AI charts.
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

async function ensure() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS dyn_dashboards (
      id SERIAL PRIMARY KEY,
      role TEXT,
      owner_id INTEGER,
      name TEXT,
      widgets JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
  } catch (e) {
    console.warn('[dashboards] ensure:', e.message);
  }
}
ensure();

router.post('/', auth, async (req, res) => {
  try {
    const { role, name, widgets } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(
      'INSERT INTO dyn_dashboards (role, owner_id, name, widgets) VALUES ($1, $2, $3, $4::jsonb) RETURNING *',
      [role || null, req.user?.id || null, name, JSON.stringify(widgets || [])]
    );
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', auth, async (req, res) => {
  const role = req.query.role;
  const sql = role
    ? 'SELECT * FROM dyn_dashboards WHERE role = $1 OR owner_id = $2 ORDER BY id DESC'
    : 'SELECT * FROM dyn_dashboards WHERE owner_id = $1 ORDER BY id DESC';
  const args = role ? [role, req.user?.id] : [req.user?.id];
  const r = await pool.query(sql, args).catch(() => ({ rows: [] }));
  res.json(r.rows);
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, widgets } = req.body;
    const r = await pool.query(
      'UPDATE dyn_dashboards SET name = COALESCE($1,name), widgets = COALESCE($2::jsonb, widgets) WHERE id = $3 RETURNING *',
      [name || null, widgets ? JSON.stringify(widgets) : null, req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/dashboards/:id/widget/render — execute a widget query and return rows.
router.post('/:id/widget/render', auth, async (req, res) => {
  try {
    const { widgetId } = req.body;
    const r = await pool.query('SELECT widgets FROM dyn_dashboards WHERE id = $1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'dashboard not found' });
    const w = (r.rows[0].widgets || []).find(x => x.id === widgetId);
    if (!w) return res.status(404).json({ error: 'widget not found' });
    if (!w.query || typeof w.query !== 'string' || !w.query.toLowerCase().trim().startsWith('select')) {
      return res.status(400).json({ error: 'widget.query must be a SELECT' });
    }
    const data = await pool.query(w.query).catch(e => ({ rows: [], error: e.message }));
    res.json({ rows: data.rows, error: data.error });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
