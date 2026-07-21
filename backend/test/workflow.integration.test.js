const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const { after, before, test } = require('node:test');
const { Pool } = require('pg');
const { createApp } = require('../app');
const { migrate } = require('../migrations');

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationEnabled = Boolean(databaseUrl);
if (integrationEnabled) {
  const parsed = new URL(databaseUrl);
  const database = parsed.pathname.slice(1);
  if (!['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname) || !database.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must target loopback and a database ending in _test');
  }
}

const pool = integrationEnabled ? new Pool({ connectionString: databaseUrl }) : null;
const config = {
  jwtSecret: 'integration-only-secret-with-at-least-32-characters',
  jwtIssuer: 'microsoft-dynamics-sales-core',
  jwtAudience: 'microsoft-dynamics-sales-console',
  allowedOrigins: ['http://127.0.0.1:3000'],
  trustProxy: false,
};
let server;
let baseUrl;
let users;

async function json(path, { token, method = 'GET', body, key, origin } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (key) headers['Idempotency-Key'] = key;
  if (origin) headers.Origin = origin;
  const response = await fetch(`${baseUrl}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

async function login(tenant, email, password = 'StrongPassword123') {
  const result = await json('/api/auth/login', { method: 'POST', body: { tenant, email, password } });
  assert.equal(result.status, 200);
  return result.body.token;
}

before(async () => {
  if (!integrationEnabled) return;
  await migrate(pool);
  await migrate(pool);
  await pool.query('TRUNCATE audit_events, idempotency_keys, opportunities, lead_qualifications, leads, users, tenants RESTART IDENTITY CASCADE');
  const passwordHash = await bcrypt.hash('StrongPassword123', 4);
  const alpha = await pool.query("INSERT INTO tenants(slug,name) VALUES ('alpha-sales','Alpha Sales') RETURNING id");
  const beta = await pool.query("INSERT INTO tenants(slug,name) VALUES ('beta-sales','Beta Sales') RETURNING id");
  users = {};
  for (const [key, tenantId, email, role] of [
    ['rep', alpha.rows[0].id, 'rep@alpha.example', 'sales_rep'],
    ['manager', alpha.rows[0].id, 'manager@alpha.example', 'manager'],
    ['admin', alpha.rows[0].id, 'admin@alpha.example', 'admin'],
    ['other', beta.rows[0].id, 'rep@beta.example', 'sales_rep'],
  ]) {
    const result = await pool.query(
      'INSERT INTO users(tenant_id,email,password_hash,full_name,role) VALUES($1,$2,$3,$4,$5) RETURNING id',
      [tenantId, email, passwordHash, key, role],
    );
    users[key] = Number(result.rows[0].id);
  }
  server = createApp({ pool, config }).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!integrationEnabled) return;
  if (server) await new Promise((resolve) => server.close(resolve));
  await pool.end();
});

test('tenant-scoped lead completes deterministic qualification and replay-safe conversion', { skip: !integrationEnabled }, async () => {
  const rep = await login('alpha-sales', 'rep@alpha.example');
  const other = await login('beta-sales', 'rep@beta.example');
  const leadBody = { firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.com', company: 'Compiler Co', estimatedValue: 50000, notes: 'Inbound conference lead' };
  const created = await json('/api/leads', { token: rep, method: 'POST', key: 'lead-create-001', body: leadBody });
  assert.equal(created.status, 201);
  const replay = await json('/api/leads', { token: rep, method: 'POST', key: 'lead-create-001', body: leadBody });
  assert.deepEqual(replay.body, created.body);
  const conflict = await json('/api/leads', { token: rep, method: 'POST', key: 'lead-create-001', body: { ...leadBody, company: 'Changed Co' } });
  assert.equal(conflict.status, 409);
  assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT');
  assert.deepEqual((await json('/api/leads', { token: other })).body.data, []);

  const qualified = await json(`/api/leads/${created.body.lead.id}/qualify`, {
    token: rep, method: 'POST',
    body: { budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 60, expectedVersion: 1 },
  });
  assert.equal(qualified.status, 200);
  assert.equal(qualified.body.lead.status, 'qualified');
  const stale = await json(`/api/leads/${created.body.lead.id}/qualify`, {
    token: rep, method: 'POST',
    body: { budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 60, expectedVersion: 1 },
  });
  assert.equal(stale.status, 409);
  assert.equal(stale.body.error.code, 'VERSION_CONFLICT');

  const converted = await json(`/api/leads/${created.body.lead.id}/convert`, { token: rep, method: 'POST', key: 'lead-convert-001', body: { expectedVersion: 2 } });
  assert.equal(converted.status, 201);
  assert.equal(converted.body.lead.status, 'converted');
  const conversionReplay = await json(`/api/leads/${created.body.lead.id}/convert`, { token: rep, method: 'POST', key: 'lead-convert-001', body: { expectedVersion: 2 } });
  assert.deepEqual(conversionReplay.body, converted.body);
  assert.equal((await json('/api/opportunities', { token: rep })).body.data.length, 1);
});

test('authorization, origin, revocation, audit-chain and append-only controls fail closed', { skip: !integrationEnabled }, async () => {
  const rep = await login('alpha-sales', 'rep@alpha.example');
  const manager = await login('alpha-sales', 'manager@alpha.example');
  const admin = await login('alpha-sales', 'admin@alpha.example');
  assert.equal((await json('/api/audit-events', { token: rep })).status, 403);
  assert.equal((await json('/api/leads', { token: rep, origin: 'https://evil.example' })).status, 403);
  const verified = await json('/api/audit-events/verify', { token: manager });
  assert.deepEqual(verified, { status: 200, body: { valid: true } });
  await assert.rejects(() => pool.query("UPDATE audit_events SET action='tampered'"), /append-only/);
  const revoked = await json(`/api/users/${users.rep}/deactivate`, { token: admin, method: 'PATCH' });
  assert.equal(revoked.status, 200);
  assert.equal((await json('/api/auth/me', { token: rep })).status, 401);
});
