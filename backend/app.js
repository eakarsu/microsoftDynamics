const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const express = require('express');
const jwt = require('jsonwebtoken');
const { appendAudit, verifyAuditChain } = require('./audit');
const { AppError, assert } = require('./errors');
const {
  digest,
  email,
  parseId,
  publicUser,
  qualifyLead,
  text,
  toLead,
  toOpportunity,
  validateLead,
  validateRole,
} = require('./domain');
const { migrationStatus } = require('./migrations');
const { auth, requireRole } = require('./middleware/auth');

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function strongPassword(value) {
  assert(typeof value === 'string' && value.length >= 16 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value), 400, 'VALIDATION_ERROR', 'password must be at least 16 characters with upper, lower, and numeric characters');
  return value;
}

function idempotencyKey(req) {
  const value = req.get('Idempotency-Key');
  assert(typeof value === 'string' && /^[A-Za-z0-9._:-]{8,128}$/.test(value), 400, 'IDEMPOTENCY_KEY_REQUIRED', 'Idempotency-Key must be 8-128 safe characters');
  return value;
}

function ownershipSql(user, startIndex = 2) {
  return user.role === 'sales_rep' ? { clause: ` AND owner_user_id = $${startIndex}`, values: [user.id] } : { clause: '', values: [] };
}

async function loadLead(client, user, leadId, { lock = false } = {}) {
  const owner = ownershipSql(user, 3);
  const result = await client.query(
    `SELECT * FROM leads WHERE tenant_id = $1 AND id = $2${owner.clause}${lock ? ' FOR UPDATE' : ''}`,
    [user.tenantId, leadId, ...owner.values],
  );
  if (!result.rows[0]) throw new AppError(404, 'LEAD_NOT_FOUND', 'Lead was not found');
  return result.rows[0];
}

function createLoginLimiter() {
  const attempts = new Map();
  return {
    check(key) {
      const now = Date.now();
      if (attempts.size >= 10_000) {
        for (const [candidate, value] of attempts) {
          if (value.resetAt <= now) attempts.delete(candidate);
        }
        while (attempts.size >= 10_000) attempts.delete(attempts.keys().next().value);
      }
      const record = attempts.get(key);
      if (!record || record.resetAt <= now) {
        attempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
        return;
      }
      record.count += 1;
      if (record.count > 5) throw new AppError(429, 'LOGIN_RATE_LIMITED', 'Too many login attempts; try again later');
    },
    clear(key) { attempts.delete(key); },
  };
}

function createApp({ pool, config }) {
  const app = express();
  const loginLimiter = createLoginLimiter();
  if (config.trustProxy) app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use((req, res, next) => {
    req.requestId = req.get('X-Request-Id')?.slice(0, 100) || crypto.randomUUID();
    res.set('X-Request-Id', req.requestId);
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'no-referrer');
    res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.set('Cache-Control', 'no-store');
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const durationMs = Number(process.hrtime.bigint() - started) / 1e6;
      console.log(JSON.stringify({ level: 'info', event: 'http_request', requestId: req.requestId, method: req.method, path: req.path, status: res.statusCode, durationMs: Math.round(durationMs) }));
    });
    next();
  });
  app.use(cors({
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'Origin is not allowed'));
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'Idempotency-Key', 'X-Request-Id'],
    maxAge: 600,
  }));
  app.use(express.json({ limit: '64kb', strict: true }));

  app.get('/api/health/live', (_req, res) => res.json({ status: 'ok', service: 'sales-core' }));
  app.get('/api/health/ready', asyncRoute(async (_req, res) => {
    await pool.query('SELECT 1');
    const schema = await migrationStatus(pool);
    if (!schema.ready) return res.status(503).json({ status: 'not_ready', schema });
    return res.json({ status: 'ready', schema });
  }));

  app.post('/api/auth/login', asyncRoute(async (req, res) => {
    const tenantSlug = text(req.body?.tenant, 'tenant', { min: 3, max: 80 }).toLowerCase();
    const normalizedEmail = email(req.body?.email);
    assert(typeof req.body?.password === 'string' && req.body.password.length <= 1_000, 400, 'VALIDATION_ERROR', 'password is invalid');
    const limitKey = `${req.ip}:${tenantSlug}:${normalizedEmail}`;
    loginLimiter.check(limitKey);
    const result = await pool.query(
      `SELECT u.* FROM users u JOIN tenants t ON t.id = u.tenant_id
       WHERE t.slug = $1 AND u.email = $2 AND u.active = TRUE`,
      [tenantSlug, normalizedEmail],
    );
    const user = result.rows[0];
    const valid = user && await bcrypt.compare(req.body.password, user.password_hash);
    if (!valid) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
    loginLimiter.clear(limitKey);
    const identity = publicUser(user);
    const token = jwt.sign(
      { tid: identity.tenantId, email: identity.email, role: identity.role, name: identity.name },
      config.jwtSecret,
      { algorithm: 'HS256', subject: String(identity.id), issuer: config.jwtIssuer, audience: config.jwtAudience, expiresIn: '15m' },
    );
    return res.json({ token, expiresInSeconds: 900, user: identity });
  }));

  const authenticate = auth(config, pool);
  app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: req.user }));

  app.post('/api/runtime-ai/sales-readiness', authenticate, asyncRoute(async (req, res) => {
    const prompt = text(req.body?.prompt, 'prompt', { min: 1, max: 8000 });
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL;
    const baseUrl = process.env.OPENROUTER_BASE_URL;
    assert(apiKey && model && baseUrl, 503, 'AI_NOT_CONFIGURED', 'OpenRouter is not configured');
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: 'Review a governed sales workflow. Return concise risks, evidence gaps, next actions, uncertainty, and decisions requiring human sales/compliance approval.' },
          { role: 'user', content: prompt },
        ],
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new AppError(502, 'AI_PROVIDER_ERROR', `OpenRouter returned ${response.status}`);
    const payload = await response.json();
    const content = String(payload?.choices?.[0]?.message?.content || '').trim();
    const receipt = String(payload?.id || response.headers.get('x-request-id') || '').trim();
    if (!content || !receipt) throw new AppError(502, 'AI_PROVIDER_ERROR', 'OpenRouter returned an incomplete response');
    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO runtime_ai_results
        (id,tenant_id,user_id,feature,prompt,content,provider,model,provider_response_id)
       VALUES($1,$2,$3,'sales-readiness',$4,$5,'openrouter',$6,$7)`,
      [id, req.user.tenantId, req.user.id, prompt, content, model, receipt],
    );
    return res.json({ id, content, provider: 'openrouter', model, providerReceipt: { id: receipt } });
  }));

  app.post('/api/users', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
    const values = {
      email: email(req.body?.email),
      name: text(req.body?.name, 'name', { max: 200 }),
      role: validateRole(req.body?.role),
      password: strongPassword(req.body?.password),
    };
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const passwordHash = await bcrypt.hash(values.password, 12);
      const created = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
         VALUES ($1,$2,$3,$4,$5) RETURNING id, tenant_id, email, full_name, role`,
        [req.user.tenantId, values.email, passwordHash, values.name, values.role],
      );
      const user = publicUser(created.rows[0]);
      await appendAudit(client, { tenantId: req.user.tenantId, actorUserId: req.user.id, action: 'user.created', entityType: 'user', entityId: user.id, details: { role: user.role } });
      await client.query('COMMIT');
      return res.status(201).json({ user });
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') throw new AppError(409, 'USER_EXISTS', 'A user with this email already exists in the tenant');
      throw error;
    } finally {
      client.release();
    }
  }));

  app.patch('/api/users/:id/deactivate', authenticate, requireRole('admin'), asyncRoute(async (req, res) => {
    const userId = parseId(req.params.id, 'userId');
    assert(userId !== req.user.id, 409, 'SELF_DEACTIVATION_FORBIDDEN', 'An administrator cannot deactivate their own account');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        'UPDATE users SET active = FALSE WHERE tenant_id = $1 AND id = $2 AND active = TRUE RETURNING id, role',
        [req.user.tenantId, userId],
      );
      if (!result.rows[0]) throw new AppError(404, 'USER_NOT_FOUND', 'Active user was not found');
      await appendAudit(client, { tenantId: req.user.tenantId, actorUserId: req.user.id, action: 'user.deactivated', entityType: 'user', entityId: userId, details: { role: result.rows[0].role } });
      await client.query('COMMIT');
      return res.json({ userId, active: false });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }));

  app.post('/api/leads', authenticate, asyncRoute(async (req, res) => {
    const lead = validateLead(req.body);
    const key = idempotencyKey(req);
    const route = 'leads.create';
    const requestHash = digest(lead);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${req.user.tenantId}:${route}:${key}`]);
      const existing = await client.query('SELECT request_hash, status_code, response_body FROM idempotency_keys WHERE tenant_id=$1 AND route=$2 AND key=$3', [req.user.tenantId, route, key]);
      if (existing.rows[0]) {
        if (existing.rows[0].request_hash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was already used with a different request');
        await client.query('COMMIT');
        return res.status(existing.rows[0].status_code).json(existing.rows[0].response_body);
      }
      const result = await client.query(
        `INSERT INTO leads (tenant_id, owner_user_id, first_name, last_name, email, company, estimated_value, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [req.user.tenantId, req.user.id, lead.firstName, lead.lastName, lead.email, lead.company, lead.estimatedValue, lead.notes],
      );
      const body = { lead: toLead(result.rows[0]) };
      await appendAudit(client, { tenantId: req.user.tenantId, actorUserId: req.user.id, action: 'lead.created', entityType: 'lead', entityId: body.lead.id, details: { ownerUserId: req.user.id } });
      await client.query('INSERT INTO idempotency_keys (tenant_id, route, key, request_hash, status_code, response_body) VALUES ($1,$2,$3,$4,201,$5::jsonb)', [req.user.tenantId, route, key, requestHash, JSON.stringify(body)]);
      await client.query('COMMIT');
      return res.status(201).json(body);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }));

  app.get('/api/leads', authenticate, asyncRoute(async (req, res) => {
    const allowedStatuses = new Set(['new', 'qualified', 'converted']);
    const status = req.query.status || null;
    if (status) assert(allowedStatuses.has(status), 400, 'VALIDATION_ERROR', 'status is invalid');
    const limit = Math.min(parseId(req.query.limit || '50', 'limit'), 100);
    const after = req.query.after ? parseId(req.query.after, 'after') : null;
    const owner = ownershipSql(req.user, 2);
    const values = [req.user.tenantId, ...owner.values];
    let where = `tenant_id = $1${owner.clause}`;
    if (status) { values.push(status); where += ` AND status = $${values.length}`; }
    if (after) { values.push(after); where += ` AND id < $${values.length}`; }
    values.push(limit);
    const result = await pool.query(`SELECT * FROM leads WHERE ${where} ORDER BY id DESC LIMIT $${values.length}`, values);
    return res.json({ data: result.rows.map(toLead), nextAfter: result.rows.length === limit ? Number(result.rows.at(-1).id) : null });
  }));

  app.get('/api/leads/:id', authenticate, asyncRoute(async (req, res) => {
    const lead = await loadLead(pool, req.user, parseId(req.params.id));
    return res.json({ lead: toLead(lead) });
  }));

  app.post('/api/leads/:id/qualify', authenticate, asyncRoute(async (req, res) => {
    const leadId = parseId(req.params.id);
    const assessment = qualifyLead(req.body);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const current = await loadLead(client, req.user, leadId, { lock: true });
      assert(current.status !== 'converted', 409, 'LEAD_ALREADY_CONVERTED', 'Converted leads cannot be requalified');
      assert(Number(current.version) === assessment.expectedVersion, 409, 'VERSION_CONFLICT', 'Lead changed; reload before qualifying', { currentVersion: Number(current.version) });
      const updated = await client.query(
        `UPDATE leads SET status=$1, score=$2, version=version+1, updated_at=NOW()
         WHERE tenant_id=$3 AND id=$4 AND version=$5 RETURNING *`,
        [assessment.outcome, assessment.score, req.user.tenantId, leadId, assessment.expectedVersion],
      );
      await client.query(
        `INSERT INTO lead_qualifications (tenant_id, lead_id, actor_user_id, rubric, score, outcome, notes)
         VALUES ($1,$2,$3,$4::jsonb,$5,$6,$7)`,
        [req.user.tenantId, leadId, req.user.id, JSON.stringify(assessment.rubric), assessment.score, assessment.outcome, assessment.notes],
      );
      const body = { lead: toLead(updated.rows[0]), qualification: { score: assessment.score, outcome: assessment.outcome, rubric: assessment.rubric } };
      await appendAudit(client, { tenantId: req.user.tenantId, actorUserId: req.user.id, action: 'lead.qualified', entityType: 'lead', entityId: leadId, details: { score: assessment.score, outcome: assessment.outcome, version: body.lead.version } });
      await client.query('COMMIT');
      return res.json(body);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }));

  app.post('/api/leads/:id/convert', authenticate, asyncRoute(async (req, res) => {
    const leadId = parseId(req.params.id);
    const expectedVersion = parseId(req.body?.expectedVersion, 'expectedVersion');
    const key = idempotencyKey(req);
    const route = 'leads.convert';
    const requestHash = digest({ leadId, expectedVersion });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`${req.user.tenantId}:${route}:${key}`]);
      const existing = await client.query('SELECT request_hash, status_code, response_body FROM idempotency_keys WHERE tenant_id=$1 AND route=$2 AND key=$3', [req.user.tenantId, route, key]);
      if (existing.rows[0]) {
        if (existing.rows[0].request_hash !== requestHash) throw new AppError(409, 'IDEMPOTENCY_CONFLICT', 'Idempotency-Key was already used with a different request');
        await client.query('COMMIT');
        return res.status(existing.rows[0].status_code).json(existing.rows[0].response_body);
      }
      const lead = await loadLead(client, req.user, leadId, { lock: true });
      assert(lead.status === 'qualified', 409, 'LEAD_NOT_QUALIFIED', 'Only qualified leads can be converted');
      assert(Number(lead.version) === expectedVersion, 409, 'VERSION_CONFLICT', 'Lead changed; reload before converting', { currentVersion: Number(lead.version) });
      const created = await client.query(
        `INSERT INTO opportunities (tenant_id, lead_id, owner_user_id, name, account_name, amount)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.user.tenantId, leadId, lead.owner_user_id, `${lead.company} opportunity`, lead.company, lead.estimated_value],
      );
      const updated = await client.query(
        'UPDATE leads SET status=\'converted\', version=version+1, updated_at=NOW() WHERE tenant_id=$1 AND id=$2 AND version=$3 RETURNING *',
        [req.user.tenantId, leadId, expectedVersion],
      );
      const body = { lead: toLead(updated.rows[0]), opportunity: toOpportunity(created.rows[0]) };
      await appendAudit(client, { tenantId: req.user.tenantId, actorUserId: req.user.id, action: 'lead.converted', entityType: 'lead', entityId: leadId, details: { opportunityId: body.opportunity.id, version: body.lead.version } });
      await client.query('INSERT INTO idempotency_keys (tenant_id, route, key, request_hash, status_code, response_body) VALUES ($1,$2,$3,$4,201,$5::jsonb)', [req.user.tenantId, route, key, requestHash, JSON.stringify(body)]);
      await client.query('COMMIT');
      return res.status(201).json(body);
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505' && error.constraint?.includes('lead_id')) throw new AppError(409, 'LEAD_ALREADY_CONVERTED', 'Lead already has an opportunity');
      throw error;
    } finally {
      client.release();
    }
  }));

  app.get('/api/opportunities', authenticate, asyncRoute(async (req, res) => {
    const limit = Math.min(parseId(req.query.limit || '50', 'limit'), 100);
    const owner = ownershipSql(req.user, 2);
    const result = await pool.query(
      `SELECT * FROM opportunities WHERE tenant_id=$1${owner.clause} ORDER BY id DESC LIMIT $${2 + owner.values.length}`,
      [req.user.tenantId, ...owner.values, limit],
    );
    return res.json({ data: result.rows.map(toOpportunity) });
  }));

  app.get('/api/audit-events/verify', authenticate, requireRole('manager', 'admin'), asyncRoute(async (req, res) => {
    const valid = await verifyAuditChain(pool, req.user.tenantId);
    return res.status(valid ? 200 : 500).json({ valid });
  }));

  app.get('/api/audit-events', authenticate, requireRole('manager', 'admin'), asyncRoute(async (req, res) => {
    const limit = Math.min(parseId(req.query.limit || '50', 'limit'), 100);
    const result = await pool.query(
      `SELECT id, actor_user_id, action, entity_type, entity_id, details, occurred_at, previous_hash, event_hash
       FROM audit_events WHERE tenant_id=$1 ORDER BY id DESC LIMIT $2`,
      [req.user.tenantId, limit],
    );
    return res.json({ data: result.rows.map((row) => ({ ...row, id: Number(row.id), actor_user_id: row.actor_user_id === null ? null : Number(row.actor_user_id) })) });
  }));

  app.use((_req, _res, next) => next(new AppError(404, 'NOT_FOUND', 'Route was not found')));
  app.use((error, req, res, _next) => {
    if (error instanceof SyntaxError && error.status === 400) error = new AppError(400, 'INVALID_JSON', 'Request body is not valid JSON');
    const known = error instanceof AppError;
    const status = known ? error.status : 500;
    if (!known) console.error(JSON.stringify({ level: 'error', event: 'request_failed', requestId: req.requestId, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }));
    const body = { error: { code: known ? error.code : 'INTERNAL_ERROR', message: known ? error.message : 'Unexpected server error', requestId: req.requestId } };
    if (known && error.details) body.error.details = error.details;
    res.status(status).json(body);
  });
  return app;
}

module.exports = { createApp };
