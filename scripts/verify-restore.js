#!/usr/bin/env node
const { Pool } = require('../backend/node_modules/pg');
const { migrationStatus } = require('../backend/migrations');
const { verifyAuditChain } = require('../backend/audit');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const schema = await migrationStatus(pool);
    if (!schema.ready) throw new Error('restored schema is not current');
    const tenants = await pool.query('SELECT id FROM tenants ORDER BY id');
    for (const tenant of tenants.rows) {
      if (!await verifyAuditChain(pool, Number(tenant.id))) throw new Error(`audit chain invalid for tenant ${tenant.id}`);
    }
    console.log(JSON.stringify({ event: 'restore_verified', tenants: tenants.rowCount, schema: schema.current }));
  } finally {
    await pool.end();
  }
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
