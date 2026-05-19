// AI pipeline forecasting and deal slippage alerts.
const express = require('express');
const pool = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';

async function ai(messages, max = 800) {
  if (!OPENROUTER_API_KEY) return null;
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OPENROUTER_MODEL, messages, max_tokens: max, temperature: 0.2 })
  });
  const d = await r.json();
  if (d.error) return null;
  return d.choices[0].message.content;
}

// POST /api/pipeline-forecast/forecast — forecast next 90 days.
router.post('/forecast', auth, async (req, res) => {
  try {
    let deals = Array.isArray(req.body.deals) ? req.body.deals : null;
    if (!deals) {
      const r = await pool.query('SELECT * FROM opportunities LIMIT 500').catch(() => ({ rows: [] }));
      deals = r.rows;
    }

    // Weighted pipeline = sum(amount * probability)
    let weighted = 0;
    let count = 0;
    const stages = {};
    for (const d of deals) {
      const amt = Number(d.amount || d.estimated_value || 0);
      const prob = Number(d.probability || (d.stage === 'won' ? 1 : d.stage === 'closed_lost' ? 0 : 0.3));
      weighted += amt * prob;
      count++;
      const s = d.stage || 'unknown';
      stages[s] = (stages[s] || 0) + 1;
    }

    const narrative = await ai([
      { role: 'system', content: 'You are a sales analyst. Provide a 3-bullet pipeline forecast commentary.' },
      { role: 'user', content: `Weighted pipeline: $${weighted.toFixed(0)}. Stage counts: ${JSON.stringify(stages)}. Sample size: ${count}.` }
    ]);
    res.json({ count, weightedPipeline: Math.round(weighted), stages, narrative });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/pipeline-forecast/slippage — flag deals likely to slip past expectedClose.
router.post('/slippage', auth, async (req, res) => {
  try {
    let deals = Array.isArray(req.body.deals) ? req.body.deals : null;
    if (!deals) {
      const r = await pool.query('SELECT * FROM opportunities WHERE close_date IS NOT NULL LIMIT 500').catch(() => ({ rows: [] }));
      deals = r.rows;
    }
    const now = Date.now();
    const flags = deals.map(d => {
      const closeDate = new Date(d.close_date || d.expected_close || d.expectedClose);
      const daysLeft = Math.round((closeDate.getTime() - now) / 86400000);
      const probability = Number(d.probability || 0.3);
      const stale = (now - new Date(d.updated_at || d.last_activity || d.createdAt || d.created_at || now).getTime()) / 86400000;
      const slipRisk = (probability < 0.5 && daysLeft < 14 ? 0.6 : 0)
        + (stale > 14 ? 0.3 : 0)
        + (probability < 0.2 ? 0.2 : 0);
      return { id: d.id, name: d.name, daysLeft, slipRisk: Number(slipRisk.toFixed(2)) };
    }).filter(d => d.slipRisk >= 0.3).sort((a, b) => b.slipRisk - a.slipRisk);

    res.json({ flagged: flags.length, deals: flags.slice(0, 50) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
