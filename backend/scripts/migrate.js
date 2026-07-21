#!/usr/bin/env node
const { createPool } = require('../db');
const { migrate } = require('../migrations');

async function main() {
  const pool = createPool();
  try {
    const result = await migrate(pool, { checkOnly: process.argv.includes('--check') });
    console.log(JSON.stringify({ event: 'migrations_ok', ...result }));
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ event: 'migrations_failed', code: error.code || 'ERROR', message: error.message }));
  process.exitCode = 1;
});
