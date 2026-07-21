#!/usr/bin/env node
const bcrypt = require('bcryptjs');
const { appendAudit } = require('../audit');
const { required } = require('../config');
const { createPool } = require('../db');
const { email, text } = require('../domain');
const { migrate } = require('../migrations');

async function main() {
  if (process.env.BOOTSTRAP_ACKNOWLEDGEMENT !== 'create-initial-admin') {
    throw new Error('Set BOOTSTRAP_ACKNOWLEDGEMENT=create-initial-admin to confirm the one-time bootstrap');
  }
  const tenantSlug = required('BOOTSTRAP_TENANT_SLUG');
  if (!/^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$/.test(tenantSlug)) throw new Error('BOOTSTRAP_TENANT_SLUG is invalid');
  const tenantName = text(required('BOOTSTRAP_TENANT_NAME'), 'BOOTSTRAP_TENANT_NAME', { max: 200 });
  const adminEmail = email(required('BOOTSTRAP_ADMIN_EMAIL'), 'BOOTSTRAP_ADMIN_EMAIL');
  const adminName = text(required('BOOTSTRAP_ADMIN_NAME'), 'BOOTSTRAP_ADMIN_NAME', { max: 200 });
  const password = required('BOOTSTRAP_ADMIN_PASSWORD');
  if (password.length < 16 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('BOOTSTRAP_ADMIN_PASSWORD must be at least 16 characters with upper, lower, and numeric characters');
  }

  const pool = createPool();
  try {
    await migrate(pool);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("SELECT pg_advisory_xact_lock(hashtext('microsoft-dynamics-sales-core-bootstrap'))");
      const existingUsers = await client.query('SELECT COUNT(*)::int AS count FROM users');
      if (existingUsers.rows[0].count !== 0) throw new Error('Bootstrap refused: at least one user already exists');
      const tenant = await client.query('INSERT INTO tenants (slug, name) VALUES ($1, $2) RETURNING id', [tenantSlug, tenantName]);
      const tenantId = Number(tenant.rows[0].id);
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await client.query(
        "INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1,$2,$3,$4,'admin') RETURNING id",
        [tenantId, adminEmail, passwordHash, adminName],
      );
      const userId = Number(user.rows[0].id);
      await appendAudit(client, { tenantId, actorUserId: userId, action: 'tenant.bootstrapped', entityType: 'tenant', entityId: tenantId, details: { initialRole: 'admin' } });
      await client.query('COMMIT');
      console.log(JSON.stringify({ event: 'bootstrap_complete', tenantId, userId }));
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'bootstrap_failed', message: error.message }));
  process.exitCode = 1;
});
