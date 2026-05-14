const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const auth = require('./middleware/auth');
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.BACKEND_PORT || 4001;

app.use(cors());
app.use(express.json());

// ============ AUTH ROUTES ============
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, full_name: user.full_name }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, full_name, role FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GENERIC CRUD ROUTES ============
const moduleNames = [
  'contacts', 'accounts', 'leads', 'opportunities', 'cases',
  'knowledge_articles', 'campaigns', 'products', 'invoices',
  'quotes', 'orders', 'employees', 'projects', 'tasks',
  'activities', 'territories', 'competitors', 'goals',
  'departments', 'performance_reviews', 'leave_requests',
  'work_orders', 'sla_policies', 'email_templates',
  'expense_reports', 'payments', 'vendors', 'price_lists',
  'discounts', 'audit_logs', 'notifications', 'customer_segments',
  'training_courses', 'contracts', 'forecasts'
];

// Cache valid columns per table for safe sorting
const validColumnsCache = {};
async function getValidColumns(table) {
  if (validColumnsCache[table]) return validColumnsCache[table];
  const result = await pool.query(
    `SELECT column_name FROM information_schema.columns WHERE table_name = $1`, [table]
  );
  validColumnsCache[table] = result.rows.map(r => r.column_name);
  return validColumnsCache[table];
}

moduleNames.forEach((table) => {
  // GET all
  app.get(`/api/${table}`, auth, async (req, res) => {
    try {
      const { search, sort, order, limit, offset } = req.query;
      let query = `SELECT * FROM ${table}`;
      const params = [];

      if (search) {
        const result = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND data_type IN ('character varying', 'text')`, [table]);
        const textCols = result.rows.map(r => r.column_name);
        if (textCols.length > 0) {
          const searchConditions = textCols.map((col, i) => `${col} ILIKE $${i + 1}`).join(' OR ');
          params.push(...textCols.map(() => `%${search}%`));
          query += ` WHERE (${searchConditions})`;
        }
      }

      const validCols = await getValidColumns(table);
      const safeSort = (sort && validCols.includes(sort)) ? sort : 'id';
      const safeOrder = order === 'asc' ? 'ASC' : 'DESC';
      query += ` ORDER BY ${safeSort} ${safeOrder}`;
      if (limit) query += ` LIMIT ${parseInt(limit) || 50}`;
      if (offset) query += ` OFFSET ${parseInt(offset) || 0}`;

      const data = await pool.query(query, params);
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      res.json({ data: data.rows, total: parseInt(countResult.rows[0].count) });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  app.get(`/api/${table}/:id`, auth, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  app.post(`/api/${table}`, auth, async (req, res) => {
    try {
      const validCols = await getValidColumns(table);
      const keys = Object.keys(req.body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at' && validCols.includes(k));
      const values = keys.map(k => req.body[k]);
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
      const result = await pool.query(
        `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT update
  app.put(`/api/${table}/:id`, auth, async (req, res) => {
    try {
      const validCols = await getValidColumns(table);
      const keys = Object.keys(req.body).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at' && validCols.includes(k));
      const values = keys.map(k => req.body[k]);
      let setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
      if (validCols.includes('updated_at')) {
        setClause += ', updated_at = NOW()';
      }
      values.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${table} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
        values
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  app.delete(`/api/${table}/:id`, auth, async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
});

// ============ DASHBOARD STATS ============
app.get('/api/dashboard/stats', auth, async (req, res) => {
  try {
    const [contacts, accounts, leads, opportunities, cases, invoices, projects, employees] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM contacts'),
      pool.query('SELECT COUNT(*) FROM accounts'),
      pool.query("SELECT COUNT(*) FROM leads WHERE status != 'Disqualified'"),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as count FROM opportunities WHERE status = 'Open'"),
      pool.query("SELECT COUNT(*) FROM cases WHERE status NOT IN ('Resolved', 'Closed')"),
      pool.query("SELECT COALESCE(SUM(total), 0) as revenue FROM invoices WHERE status = 'Paid'"),
      pool.query("SELECT COUNT(*) FROM projects WHERE status = 'In Progress'"),
      pool.query("SELECT COUNT(*) FROM employees WHERE status = 'Active'"),
    ]);

    const recentActivities = await pool.query('SELECT * FROM activities ORDER BY created_at DESC LIMIT 10');
    const pipelineStages = await pool.query("SELECT stage, COUNT(*) as count, COALESCE(SUM(amount), 0) as total FROM opportunities WHERE status = 'Open' GROUP BY stage ORDER BY count DESC");
    const topDeals = await pool.query("SELECT * FROM opportunities WHERE status = 'Open' ORDER BY amount DESC LIMIT 5");

    res.json({
      contacts: parseInt(contacts.rows[0].count),
      accounts: parseInt(accounts.rows[0].count),
      activeLeads: parseInt(leads.rows[0].count),
      openOpportunities: parseInt(opportunities.rows[0].count),
      pipelineValue: parseFloat(opportunities.rows[0].total),
      openCases: parseInt(cases.rows[0].count),
      revenue: parseFloat(invoices.rows[0].revenue),
      activeProjects: parseInt(projects.rows[0].count),
      activeEmployees: parseInt(employees.rows[0].count),
      recentActivities: recentActivities.rows,
      pipelineStages: pipelineStages.rows,
      topDeals: topDeals.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ AI ROUTES (OpenRouter) ============
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callAI(messages) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'http://localhost:3000',
      'X-Title': 'Dynamics 365 AI Copilot',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
      messages,
      max_tokens: 2000,
    }),
  });
  const data = await response.json();
  return data;
}

// AI Sales Forecast
app.post('/api/ai/sales-forecast', auth, async (req, res) => {
  try {
    const opps = await pool.query("SELECT name, amount, stage, probability, close_date FROM opportunities WHERE status = 'Open' ORDER BY amount DESC");
    const invoices = await pool.query("SELECT COALESCE(SUM(total), 0) as total FROM invoices WHERE status = 'Paid'");
    const prompt = `You are a senior sales analyst for a Microsoft Dynamics 365 enterprise platform. Analyze this sales data and provide a comprehensive forecast.

Current Pipeline:
${opps.rows.map(o => `- ${o.name}: $${o.amount} (${o.stage}, ${o.probability}% probability, closes ${o.close_date})`).join('\n')}

Total Revenue Collected: $${invoices.rows[0].total}

Provide:
1. **Revenue Forecast** - Expected revenue for next quarter with confidence levels
2. **Pipeline Health** - Assessment of pipeline quality and stage distribution
3. **Risk Analysis** - Deals at risk and recommended actions
4. **Top Recommendations** - 3-5 specific actions to improve close rates
5. **Key Metrics** - Win rate prediction, average deal size trend, sales velocity

Format your response with clear headers, bullet points, and specific dollar amounts.`;

    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Lead Scoring
app.post('/api/ai/lead-scoring', auth, async (req, res) => {
  try {
    const leads = await pool.query('SELECT * FROM leads ORDER BY created_at DESC');
    const prompt = `You are an AI lead scoring expert for Microsoft Dynamics 365. Analyze these leads and provide scoring and recommendations.

Leads:
${leads.rows.map(l => `- ${l.first_name} ${l.last_name} (${l.company}): Source=${l.source}, Status=${l.status}, Rating=${l.rating}, Est. Value=$${l.estimated_value}`).join('\n')}

For each lead, provide:
1. **AI Score** (1-100) based on likelihood to convert
2. **Priority Ranking** (1=highest priority)
3. **Key Factors** affecting the score
4. **Recommended Next Action**

Then provide overall lead analysis:
- **Pipeline Quality Assessment**
- **Source Performance** - Which lead sources are performing best
- **Recommendations** for improving lead conversion

Format with clear structure and specific actionable insights.`;

    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Sentiment Analysis
app.post('/api/ai/sentiment', auth, async (req, res) => {
  try {
    const cases = await pool.query('SELECT title, description, priority, status, category FROM cases ORDER BY created_at DESC');
    const prompt = `You are a customer sentiment analysis AI for Microsoft Dynamics 365. Analyze these support cases to determine customer sentiment and trends.

Recent Support Cases:
${cases.rows.map(c => `- [${c.priority}] ${c.title} (${c.status}, ${c.category}): ${c.description || 'No description'}`).join('\n')}

Provide:
1. **Overall Sentiment Score** (1-10, where 10 is very positive)
2. **Sentiment Breakdown** by category
3. **Trending Issues** - Top 3 most concerning patterns
4. **Customer Health Indicators** - Areas of satisfaction and concern
5. **Proactive Recommendations** - Steps to improve customer satisfaction
6. **Risk Alerts** - Accounts that may be at risk of churn

Format professionally with headers, bullet points, and specific data-driven insights.`;

    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Content Generation
app.post('/api/ai/content-generate', auth, async (req, res) => {
  try {
    const { contentType, topic, audience, tone } = req.body;
    const prompt = `You are a professional content creator for Microsoft Dynamics 365 marketing team. Generate the following content:

Content Type: ${contentType || 'Marketing Email'}
Topic: ${topic || 'New product features and platform updates'}
Target Audience: ${audience || 'Enterprise IT decision makers'}
Tone: ${tone || 'Professional and engaging'}

Generate:
1. **Subject Line** (3 options)
2. **Main Content** - Full content piece with proper formatting
3. **Call to Action** (2-3 options)
4. **Social Media Snippets** - 3 social media versions (LinkedIn, Twitter, Short)
5. **SEO Keywords** - 5-7 relevant keywords

Make the content compelling, professional, and aligned with Microsoft brand voice.`;

    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Business Insights
app.post('/api/ai/insights', auth, async (req, res) => {
  try {
    const [opps, cases, leads, invoices, employees] = await Promise.all([
      pool.query("SELECT stage, COUNT(*) as count, COALESCE(SUM(amount),0) as total FROM opportunities GROUP BY stage"),
      pool.query("SELECT status, COUNT(*) as count FROM cases GROUP BY status"),
      pool.query("SELECT status, COUNT(*) as count FROM leads GROUP BY status"),
      pool.query("SELECT status, COUNT(*) as count, COALESCE(SUM(total),0) as total FROM invoices GROUP BY status"),
      pool.query("SELECT department, COUNT(*) as count FROM employees GROUP BY department"),
    ]);

    const prompt = `You are a senior business intelligence analyst for Microsoft Dynamics 365. Analyze this comprehensive business data and provide executive-level insights.

Sales Pipeline by Stage:
${opps.rows.map(o => `- ${o.stage}: ${o.count} deals worth $${o.total}`).join('\n')}

Support Cases by Status:
${cases.rows.map(c => `- ${c.status}: ${c.count} cases`).join('\n')}

Lead Distribution:
${leads.rows.map(l => `- ${l.status}: ${l.count} leads`).join('\n')}

Invoice Status:
${invoices.rows.map(i => `- ${i.status}: ${i.count} invoices totaling $${i.total}`).join('\n')}

Team Distribution:
${employees.rows.map(e => `- ${e.department}: ${e.count} employees`).join('\n')}

Provide:
1. **Executive Summary** - Top 3 key findings
2. **Revenue Analysis** - Current state and trends
3. **Operational Efficiency** - Support and service metrics
4. **Growth Indicators** - Positive trends and opportunities
5. **Risk Factors** - Areas requiring immediate attention
6. **Strategic Recommendations** - Top 5 action items for leadership
7. **90-Day Outlook** - Short-term predictions

Format as an executive briefing with clear headers and actionable insights.`;

    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Copilot Chat
app.post('/api/ai/copilot', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const [contacts, accounts, opps, cases] = await Promise.all([
      pool.query('SELECT COUNT(*) as c FROM contacts'),
      pool.query('SELECT COUNT(*) as c FROM accounts'),
      pool.query("SELECT COUNT(*) as c, COALESCE(SUM(amount),0) as total FROM opportunities WHERE status = 'Open'"),
      pool.query("SELECT COUNT(*) as c FROM cases WHERE status NOT IN ('Resolved','Closed')"),
    ]);

    const systemContext = `You are Dynamics 365 Copilot, an AI assistant built into Microsoft Dynamics 365. You have access to the following live data:
- ${contacts.rows[0].c} contacts in the system
- ${accounts.rows[0].c} accounts being managed
- ${opps.rows[0].c} open opportunities worth $${opps.rows[0].total}
- ${cases.rows[0].c} open support cases

You help users with CRM tasks, sales strategy, customer service, data analysis, and business operations. Be helpful, specific, and professional. Reference actual data when relevant. Provide actionable advice.`;

    const result = await callAI([
      { role: 'system', content: systemContext },
      { role: 'user', content: message }
    ]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Performance Analysis
app.post('/api/ai/performance', auth, async (req, res) => {
  try {
    const goals = await pool.query('SELECT * FROM goals');
    const projects = await pool.query('SELECT name, status, progress, budget, actual_cost FROM projects');
    const prompt = `You are a performance analytics AI for Microsoft Dynamics 365. Analyze the following performance data.

Goals:
${goals.rows.map(g => `- ${g.name} (${g.type}): Target=${g.target_value}, Actual=${g.actual_value}, Progress=${g.progress}%, Status=${g.status}`).join('\n')}

Projects:
${projects.rows.map(p => `- ${p.name}: ${p.status}, ${p.progress}% complete, Budget=$${p.budget}, Spent=$${p.actual_cost}`).join('\n')}

Provide:
1. **Performance Summary** - Overall organizational performance score
2. **Goals On Track** - Which goals are meeting targets
3. **Goals At Risk** - Which goals need intervention
4. **Project Health** - Budget vs actual analysis
5. **Resource Utilization** - Are resources being used efficiently
6. **Improvement Plan** - Specific actions to get back on track

Use data-driven analysis with specific numbers and percentages.`;

    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Competitor Analysis
app.post('/api/ai/competitor-analysis', auth, async (req, res) => {
  try {
    const competitors = await pool.query('SELECT * FROM competitors ORDER BY market_share DESC');
    const prompt = `You are a competitive intelligence analyst for Microsoft Dynamics 365. Analyze the competitive landscape.

Competitors:
${competitors.rows.map(c => `- ${c.name}: Market Share=${c.market_share}%, Threat=${c.threat_level}, Industry=${c.industry}
  Strengths: ${c.strengths}
  Weaknesses: ${c.weaknesses}`).join('\n\n')}

Provide:
1. **Competitive Landscape Overview** - Market positioning map
2. **Top Threats** - Ranked by impact on our business
3. **Competitive Advantages** - Our key differentiators
4. **Win Strategy** per major competitor - How to win against each top 5
5. **Market Trends** - Industry direction and implications
6. **Battle Card Summary** - Quick reference for sales team

Be specific and actionable. Focus on strategies that drive wins.`;

    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Quote Generator
app.post('/api/ai/quote-generate', auth, async (req, res) => {
  try {
    const { customer, products, terms } = req.body || {};
    if (!customer || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'customer and products[] are required' });
    }
    const prompt = `You are a Dynamics 365 sales operations assistant. Generate a structured customer quote with sections:
1. Quote Summary (customer, validity, total estimate)
2. Line Items (formatted)
3. Suggested Discount Strategy (justified)
4. Risks / Caveats
5. Recommended Follow-up Cadence

Customer:
${JSON.stringify(customer, null, 2)}

Products:
${JSON.stringify(products, null, 2)}

Terms: ${terms || 'standard'}`;
    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Customer Churn Prediction
app.post('/api/ai/churn-prediction', auth, async (req, res) => {
  try {
    const accounts = await pool.query('SELECT * FROM accounts ORDER BY revenue DESC NULLS LAST LIMIT 50');
    const prompt = `You are a customer success analyst. Identify which accounts in this portfolio are at risk of churn and recommend retention plays.

Accounts (sample):
${accounts.rows.map(a => `- ${a.name} | revenue=$${a.revenue || 0} | health=${a.health_score || 'unknown'} | last_contact=${a.last_contact || 'unknown'}`).join('\n')}

Output JSON with: { atRisk: [{name, churnScore (0-1), drivers, retentionPlay}], summary, networkActions }.`;
    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Workflow Recommender
app.post('/api/ai/workflow-recommend', auth, async (req, res) => {
  try {
    const { businessProcess, painPoints } = req.body || {};
    if (!businessProcess) return res.status(400).json({ error: 'businessProcess is required' });
    const prompt = `You are a Dynamics 365 workflow architect. Propose an automation workflow for the described business process. Include trigger, steps, approvals, integrations, error handling, and KPIs.

Business Process: ${businessProcess}
Known Pain Points: ${JSON.stringify(painPoints || [])}`;
    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Lead-to-Opportunity Conversion Advisor (audit backlog: medium "Lead-to-opportunity conversion automation")
app.post('/api/ai/lead-conversion-advisor', auth, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: { message: 'AI provider not configured (OPENROUTER_API_KEY missing).' } });
    }
    const { lead, criteria } = req.body || {};
    let leadInfo = lead;
    if (!leadInfo && req.body && req.body.leadId) {
      try {
        const r = await pool.query('SELECT * FROM leads WHERE id = $1', [req.body.leadId]);
        leadInfo = r.rows[0];
      } catch (_) {}
    }
    if (!leadInfo) return res.status(400).json({ error: 'lead or leadId is required' });
    const prompt = `You are a Dynamics 365 sales advisor. Decide whether the following lead is ready to be converted into an opportunity, and if so, propose the opportunity skeleton.

Lead:
${JSON.stringify(leadInfo, null, 2)}

Conversion Criteria (BANT-like): ${JSON.stringify(criteria || { budget: 'unknown', authority: 'unknown', need: 'unknown', timeline: 'unknown' })}

Return JSON with: {convert_now: true|false, readiness_score: 0-100, gaps: [], suggested_opportunity: {name, estimated_amount, stage, probability, close_date_iso, products_to_propose, primary_contact}, next_actions: [], risks: []}.`;
    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Workflow State-Machine Designer (audit backlog: high "Real workflow engine — state machine, approvals")
app.post('/api/ai/workflow-state-machine', auth, async (req, res) => {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return res.status(503).json({ error: { message: 'AI provider not configured (OPENROUTER_API_KEY missing).' } });
    }
    const { processName, description, actors, approvalLevels } = req.body || {};
    if (!processName) return res.status(400).json({ error: 'processName is required' });
    const prompt = `You are a Dynamics 365 process architect. Design a state machine (with approval steps) for the described business process.

Process: ${processName}
Description: ${description || ''}
Actors / Roles: ${JSON.stringify(actors || [])}
Approval Levels: ${approvalLevels || 'auto-decide'}

Return JSON with: {states: [{id,name,kind:"start|task|approval|wait|end",owner_role,description,sla_hours}], transitions: [{from,to,event,guard}], approvals: [{state_id,approver_role,escalation_after_hours}], notifications: [{state_id,channel,recipient_role,template}], kpis: [], example_happy_path: []}.`;
    const result = await callAI([{ role: 'user', content: prompt }]);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api/entity-designer', require('./routes/entityDesigner')); app.use('/api/workflows', require('./routes/workflowEngine')); app.use('/api/connectors', require('./routes/connectors')); app.use('/api/record-copilot', require('./routes/recordCopilot')); app.use('/api/pipeline-forecast', require('./routes/pipelineForecast')); app.use('/api/dashboards', require('./routes/dashboards'));

app.listen(PORT, () => {
  console.log(`🚀 Dynamics 365 API Server running on port ${PORT}`);
});
