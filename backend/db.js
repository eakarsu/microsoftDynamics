const { Pool } = require('pg');
const { databaseConfig } = require('./config');

function createPool(env = process.env) {
  const pool = new Pool(databaseConfig(env));
  pool.on('error', (error) => {
    console.error(JSON.stringify({ level: 'error', event: 'postgres_pool_error', message: error.message }));
  });
  return pool;
}

module.exports = { createPool };
