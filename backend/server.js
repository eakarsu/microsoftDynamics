const http = require('node:http');
const { createApp } = require('./app');
const { serverConfig } = require('./config');
const { createPool } = require('./db');
const { migrationStatus } = require('./migrations');

async function main() {
  const config = serverConfig();
  const pool = createPool();
  await pool.query('SELECT 1');
  const schema = await migrationStatus(pool);
  if (!schema.ready) throw new Error(`Database migrations are not current (current=${schema.current}, expected=${schema.expected})`);
  const server = http.createServer(createApp({ pool, config }));
  server.requestTimeout = 15_000;
  server.headersTimeout = 20_000;
  server.keepAliveTimeout = 5_000;

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, config.host, resolve);
  });
  console.log(JSON.stringify({ level: 'info', event: 'server_started', host: config.host, port: config.port }));

  let stopping = false;
  const stop = async (signal) => {
    if (stopping) return;
    stopping = true;
    console.log(JSON.stringify({ level: 'info', event: 'server_stopping', signal }));
    const force = setTimeout(() => process.exit(1), 10_000).unref();
    await new Promise((resolve) => server.close(resolve));
    await pool.end();
    clearTimeout(force);
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));
}

main().catch((error) => {
  console.error(JSON.stringify({ level: 'error', event: 'startup_failed', message: error.message }));
  process.exitCode = 1;
});
