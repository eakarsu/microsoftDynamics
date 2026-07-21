const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { createApp } = require('../app');
const { migrate } = require('../migrations');

const connectionString = process.env.TEST_DATABASE_URL;

function guardedTestDatabase(url) {
  const parsed = new URL(url);
  const database = parsed.pathname.slice(1);
  const loopback = new Set(['127.0.0.1', 'localhost', '::1']);
  if (!loopback.has(parsed.hostname) || !database.endsWith('_test')) {
    throw new Error('TEST_DATABASE_URL must target a loopback database ending in _test');
  }
}

async function json(base, path, { token, method = 'GET', body, key } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (key) headers['Idempotency-Key'] = key;
  const response = await fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: response.status, body: await response.json() };
}

test('tenant-scoped lead lifecycle is durable, authorized, versioned, idempotent, and audited', { skip: !connectionString }, async () => {
  guardedTestDatabase(connectionString);
  const pool = new Pool({ connectionString, max: 4 });
  await pool.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public');
  await migrate(pool);

  const password = 'ValidIntegration9Password';
  const passwordHash = await bcrypt.hash(password, 4);
  const firstTenant = await pool.query("INSERT INTO tenants (slug,name) VALUES ('alpha-test','Alpha Test') RETURNING id");
  const secondTenant = await pool.query("INSERT INTO tenants (slug,name) VALUES ('beta-test','Beta Test') RETURNING id");
  const tenantId = Number(firstTenant.rows[0].id);
  const otherTenantId = Number(secondTenant.rows[0].id);
  const admin = await pool.query("INSERT INTO users (tenant_id,email,password_hash,full_name,role) VALUES ($1,'admin@alpha.test',$2,'Alpha Admin','admin') RETURNING id", [tenantId, passwordHash]);
  const rep = await pool.query("INSERT INTO users (tenant_id,email,password_hash,full_name,role) VALUES ($1,'rep@alpha.test',$2,'Alpha Rep','sales_rep') RETURNING id", [tenantId, passwordHash]);
  const other = await pool.query("INSERT INTO users (tenant_id,email,password_hash,full_name,role) VALUES ($1,'rep@beta.test',$2,'Beta Rep','sales_rep') RETURNING id", [otherTenantId, passwordHash]);
  assert.ok(admin.rows[0].id && rep.rows[0].id && other.rows[0].id);

  const config = {
    jwtSecret: crypto.randomBytes(32).toString('hex'),
    jwtIssuer: 'integration-suite',
    jwtAudience: 'integration-client',
    allowedOrigins: ['http://127.0.0.1:3000'],
    trustProxy: false,
  };
  const server = http.createServer(createApp({ pool, config }));
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    const failedLogin = await json(base, '/api/auth/login', { method: 'POST', body: { tenant: 'alpha-test', email: 'rep@alpha.test', password: 'wrong' } });
    assert.equal(failedLogin.status, 401);
    assert.equal(failedLogin.body.error.code, 'INVALID_CREDENTIALS');

    const repLogin = await json(base, '/api/auth/login', { method: 'POST', body: { tenant: 'alpha-test', email: 'rep@alpha.test', password } });
    const adminLogin = await json(base, '/api/auth/login', { method: 'POST', body: { tenant: 'alpha-test', email: 'admin@alpha.test', password } });
    const otherLogin = await json(base, '/api/auth/login', { method: 'POST', body: { tenant: 'beta-test', email: 'rep@beta.test', password } });
    assert.equal(repLogin.status, 200);
    assert.equal(adminLogin.status, 200);

    const leadInput = { firstName: 'Grace', lastName: 'Hopper', email: 'grace@example.test', company: 'Compiler Co', estimatedValue: 125000, notes: 'Inbound request' };
    const created = await json(base, '/api/leads', { token: repLogin.body.token, method: 'POST', key: 'lead-create-0001', body: leadInput });
    assert.equal(created.status, 201);
    assert.equal(created.body.lead.status, 'new');
    const leadId = created.body.lead.id;

    const replay = await json(base, '/api/leads', { token: repLogin.body.token, method: 'POST', key: 'lead-create-0001', body: leadInput });
    assert.equal(replay.status, 201);
    assert.equal(replay.body.lead.id, leadId);
    const conflict = await json(base, '/api/leads', { token: repLogin.body.token, method: 'POST', key: 'lead-create-0001', body: { ...leadInput, company: 'Different' } });
    assert.equal(conflict.status, 409);
    assert.equal(conflict.body.error.code, 'IDEMPOTENCY_CONFLICT');

    const crossTenant = await json(base, `/api/leads/${leadId}`, { token: otherLogin.body.token });
    assert.equal(crossTenant.status, 404);
    const visibleToAdmin = await json(base, '/api/leads', { token: adminLogin.body.token });
    assert.equal(visibleToAdmin.body.data.length, 1);

    const low = await json(base, `/api/leads/${leadId}/qualify`, { token: repLogin.body.token, method: 'POST', body: { budgetConfirmed: true, authorityIdentified: false, needDefined: false, timelineDays: 200, expectedVersion: 1 } });
    assert.equal(low.status, 200);
    assert.equal(low.body.lead.status, 'new');
    assert.equal(low.body.lead.version, 2);

    const stale = await json(base, `/api/leads/${leadId}/qualify`, { token: repLogin.body.token, method: 'POST', body: { budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 90, expectedVersion: 1 } });
    assert.equal(stale.status, 409);
    assert.equal(stale.body.error.code, 'VERSION_CONFLICT');

    const qualified = await json(base, `/api/leads/${leadId}/qualify`, { token: repLogin.body.token, method: 'POST', body: { budgetConfirmed: true, authorityIdentified: true, needDefined: true, timelineDays: 90, expectedVersion: 2 } });
    assert.equal(qualified.body.lead.status, 'qualified');
    assert.equal(qualified.body.lead.score, 100);

    const converted = await json(base, `/api/leads/${leadId}/convert`, { token: repLogin.body.token, method: 'POST', key: 'lead-convert-0001', body: { expectedVersion: 3 } });
    assert.equal(converted.status, 201);
    assert.equal(converted.body.lead.status, 'converted');
    assert.equal(converted.body.opportunity.amount, 125000);
    const convertedReplay = await json(base, `/api/leads/${leadId}/convert`, { token: repLogin.body.token, method: 'POST', key: 'lead-convert-0001', body: { expectedVersion: 3 } });
    assert.deepEqual(convertedReplay.body, converted.body);
    const opportunityCount = await pool.query('SELECT COUNT(*)::int AS count FROM opportunities');
    assert.equal(opportunityCount.rows[0].count, 1);

    const audit = await json(base, '/api/audit-events/verify', { token: adminLogin.body.token });
    assert.equal(audit.status, 200);
    assert.equal(audit.body.valid, true);
    const repAudit = await json(base, '/api/audit-events', { token: repLogin.body.token });
    assert.equal(repAudit.status, 403);
    await assert.rejects(pool.query("UPDATE audit_events SET action='tampered' WHERE tenant_id=$1", [tenantId]), /append-only/);

    const migration = await pool.query("SELECT checksum FROM schema_migrations WHERE version='001_sales_core.sql'");
    await pool.query("UPDATE schema_migrations SET checksum=repeat('0',64) WHERE version='001_sales_core.sql'");
    const driftReadiness = await json(base, '/api/health/ready');
    assert.equal(driftReadiness.status, 503);
    assert.deepEqual(driftReadiness.body.schema.drift, ['001_sales_core.sql']);
    await pool.query("UPDATE schema_migrations SET checksum=$1 WHERE version='001_sales_core.sql'", [migration.rows[0].checksum]);
    assert.equal((await json(base, '/api/health/ready')).status, 200);

    const newUser = await json(base, '/api/users', { token: adminLogin.body.token, method: 'POST', body: { email: 'new@alpha.test', name: 'New Rep', role: 'sales_rep', password } });
    assert.equal(newUser.status, 201);
    const newLogin = await json(base, '/api/auth/login', { method: 'POST', body: { tenant: 'alpha-test', email: 'new@alpha.test', password } });
    assert.equal(newLogin.status, 200);
    const ownerScoped = await json(base, '/api/leads', { token: newLogin.body.token });
    assert.deepEqual(ownerScoped.body.data, []);
    const deactivated = await json(base, `/api/users/${newUser.body.user.id}/deactivate`, { token: adminLogin.body.token, method: 'PATCH' });
    assert.equal(deactivated.status, 200);
    const disabledToken = await json(base, '/api/auth/me', { token: newLogin.body.token });
    assert.equal(disabledToken.status, 401);
    assert.equal((await json(base, '/api/audit-events/verify', { token: adminLogin.body.token })).body.valid, true);

    const events = await pool.query('SELECT action FROM audit_events WHERE tenant_id=$1 ORDER BY id', [tenantId]);
    assert.deepEqual(events.rows.map((row) => row.action), ['lead.created', 'lead.qualified', 'lead.qualified', 'lead.converted', 'user.created', 'user.deactivated']);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
  }
});
