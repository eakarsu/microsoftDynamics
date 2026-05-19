// Power-Automate-style connectors (Slack, Teams, Outlook, SAP).
// TODO: configure credentials —
//   SLACK_WEBHOOK_URL, TEAMS_WEBHOOK_URL, OUTLOOK_CLIENT_ID/SECRET, SAP_BASE_URL/SAP_API_KEY.
const express = require('express');
const auth = require('../middleware/auth');
const router = express.Router();

async function postJson(url, body, headers = {}) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body)
  });
  return { status: r.status, text: await r.text() };
}

// POST /api/connectors/slack
router.post('/slack', auth, async (req, res) => {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return res.status(503).json({ error: 'SLACK_WEBHOOK_URL not configured' });
  const { text, blocks } = req.body;
  if (!text && !blocks) return res.status(400).json({ error: 'text or blocks required' });
  const r = await postJson(url, { text: text || '', blocks });
  res.json(r);
});

// POST /api/connectors/teams
router.post('/teams', auth, async (req, res) => {
  const url = process.env.TEAMS_WEBHOOK_URL;
  if (!url) return res.status(503).json({ error: 'TEAMS_WEBHOOK_URL not configured' });
  const { title, text } = req.body;
  const r = await postJson(url, { '@type': 'MessageCard', title: title || 'Notification', text: text || '' });
  res.json(r);
});

// POST /api/connectors/outlook/send
router.post('/outlook/send', auth, async (req, res) => {
  if (!process.env.OUTLOOK_CLIENT_ID || !process.env.OUTLOOK_CLIENT_SECRET) {
    return res.status(503).json({ error: 'Outlook OAuth not configured' });
  }
  // TODO: configure credentials — implement Microsoft Graph /me/sendMail with OAuth2 client credentials.
  res.json({ status: 'queued', note: 'Implement Microsoft Graph send-mail' });
});

// POST /api/connectors/sap/query — read-only SAP OData proxy.
router.post('/sap/query', auth, async (req, res) => {
  const base = process.env.SAP_BASE_URL;
  const key = process.env.SAP_API_KEY;
  if (!base) return res.status(503).json({ error: 'SAP_BASE_URL not configured' });
  const { entitySet, query = '' } = req.body;
  if (!entitySet) return res.status(400).json({ error: 'entitySet required' });
  try {
    const r = await fetch(`${base}/${entitySet}?${query}`, {
      headers: { Accept: 'application/json', ...(key ? { APIKey: key } : {}) }
    });
    res.json({ status: r.status, body: await r.json().catch(() => ({})) });
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
});

router.get('/list', auth, (_req, res) => {
  res.json({
    connectors: [
      { id: 'slack', configured: !!process.env.SLACK_WEBHOOK_URL },
      { id: 'teams', configured: !!process.env.TEAMS_WEBHOOK_URL },
      { id: 'outlook', configured: !!process.env.OUTLOOK_CLIENT_ID },
      { id: 'sap', configured: !!process.env.SAP_BASE_URL }
    ]
  });
});

module.exports = router;
