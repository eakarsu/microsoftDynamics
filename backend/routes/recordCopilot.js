// AI record copilot (summary, related records, suggested actions).
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function ai(messages, max = 700) {
  if (!OPENROUTER_API_KEY) {
    const e = new Error('OPENROUTER_API_KEY not configured'); e.statusCode = 503; throw e;
  }
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens: max, temperature: 0.3 })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  return d.choices[0].message.content;
}

// POST /api/record-copilot/summarize — summarise an arbitrary record.
router.post('/summarize', auth, async (req, res) => {
  try {
    const { record, entityName } = req.body;
    if (!record) return res.status(400).json({ error: 'record required' });
    const summary = await ai([
      { role: 'system', content: `You produce a 2-3 sentence executive summary for a ${entityName || 'record'}.` },
      { role: 'user', content: JSON.stringify(record).slice(0, 6000) }
    ]);
    res.json({ summary });
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// POST /api/record-copilot/next-best-action
router.post('/next-best-action', auth, async (req, res) => {
  try {
    const { record, history } = req.body;
    const out = await ai([
      { role: 'system', content: 'Return JSON {"actions":[{"action":string,"reason":string,"priority":1-3}]}' },
      { role: 'user', content: `Record:\n${JSON.stringify(record).slice(0, 4000)}\n\nHistory:\n${JSON.stringify(history || []).slice(0, 2000)}` }
    ], 600);
    let parsed;
    try { parsed = JSON.parse(out.match(/\{[\s\S]*\}/)[0]); } catch { parsed = { raw: out }; }
    res.json(parsed);
  } catch (e) {
    res.status(e.statusCode || 500).json({ error: e.message });
  }
});

// POST /api/record-copilot/related — naive related records: same module table, share owner or contact.
router.post('/related', auth, async (req, res) => {
  try {
    const { table, recordId } = req.body;
    if (!table || !recordId) return res.status(400).json({ error: 'table and recordId required' });
    const q = `SELECT * FROM ${table} WHERE id = $1`;
    const me = (await pool.query(q, [recordId]).catch(() => ({ rows: [] }))).rows[0];
    if (!me) return res.json({ related: [] });
    const ownerCol = Object.keys(me).find(k => k.includes('owner'));
    if (!ownerCol) return res.json({ related: [] });
    const related = await pool.query(`SELECT * FROM ${table} WHERE ${ownerCol} = $1 AND id <> $2 LIMIT 10`,
      [me[ownerCol], recordId]).catch(() => ({ rows: [] }));
    res.json({ count: related.rows.length, related: related.rows });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
