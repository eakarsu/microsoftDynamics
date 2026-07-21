const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { AppError } = require('./errors');

const migrationsDirectory = path.join(__dirname, 'migrations');

async function migrationFiles() {
  return (await fs.readdir(migrationsDirectory))
    .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
    .sort();
}

async function migrate(pool, { checkOnly = false } = {}) {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(200) PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await client.query("SELECT pg_advisory_lock(hashtext('microsoft-dynamics-sales-core-migrations'))");
    const files = await migrationFiles();
    const applied = await client.query('SELECT version, checksum FROM schema_migrations');
    const known = new Map(applied.rows.map((row) => [row.version, row.checksum]));
    const pending = [];

    for (const version of files) {
      const sql = await fs.readFile(path.join(migrationsDirectory, version), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      if (known.has(version) && known.get(version) !== checksum) {
        throw new AppError(500, 'MIGRATION_DRIFT', `Applied migration checksum changed: ${version}`);
      }
      if (known.has(version)) continue;
      pending.push(version);
      if (checkOnly) continue;
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)', [version, checksum]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    if (checkOnly && pending.length) throw new AppError(503, 'MIGRATIONS_PENDING', `Pending migrations: ${pending.join(', ')}`);
    return { applied: checkOnly ? [] : pending, current: files.at(-1) || null, pending };
  } finally {
    await client.query("SELECT pg_advisory_unlock(hashtext('microsoft-dynamics-sales-core-migrations'))").catch(() => {});
    client.release();
  }
}

async function migrationStatus(pool) {
  const files = await migrationFiles();
  const result = await pool.query("SELECT to_regclass('public.schema_migrations') AS table_name");
  if (!result.rows[0].table_name) return { ready: false, current: null, expected: files.at(-1) || null };
  const applied = await pool.query('SELECT version, checksum FROM schema_migrations ORDER BY version');
  const expectedChecksums = new Map();
  for (const version of files) {
    const sql = await fs.readFile(path.join(migrationsDirectory, version), 'utf8');
    expectedChecksums.set(version, crypto.createHash('sha256').update(sql).digest('hex'));
  }
  const versions = applied.rows.map((row) => row.version);
  const missing = files.filter((version) => !versions.includes(version));
  const unknown = versions.filter((version) => !expectedChecksums.has(version));
  const drift = applied.rows
    .filter((row) => expectedChecksums.has(row.version) && expectedChecksums.get(row.version) !== row.checksum)
    .map((row) => row.version);
  return {
    ready: missing.length === 0 && unknown.length === 0 && drift.length === 0,
    current: versions.at(-1) || null,
    expected: files.at(-1) || null,
    missing,
    unknown,
    drift,
  };
}

module.exports = { migrate, migrationStatus };
