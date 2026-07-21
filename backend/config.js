const path = require('node:path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

function required(name, value = process.env[name]) {
  if (!value || !value.trim()) throw new Error(`${name} is required`);
  return value.trim();
}

function databaseConfig(env = process.env) {
  const connection = env.DATABASE_URL?.trim()
    ? { connectionString: env.DATABASE_URL.trim() }
    : {
        host: required('PGHOST', env.PGHOST),
        port: Number.parseInt(env.PGPORT || '5432', 10),
        database: required('PGDATABASE', env.PGDATABASE),
        user: required('PGUSER', env.PGUSER),
        password: required('PGPASSWORD', env.PGPASSWORD),
      };
  if ('port' in connection && (!Number.isInteger(connection.port) || connection.port < 1 || connection.port > 65535)) {
    throw new Error('PGPORT is invalid');
  }
  return {
    ...connection,
    ssl: env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : false,
    max: Number.parseInt(env.DATABASE_POOL_MAX || '10', 10),
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  };
}

function serverConfig(env = process.env) {
  const jwtSecret = required('JWT_SECRET', env.JWT_SECRET);
  if (Buffer.byteLength(jwtSecret) < 32) throw new Error('JWT_SECRET must be at least 32 bytes');

  const port = Number.parseInt(env.BACKEND_PORT || '4001', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('BACKEND_PORT is invalid');

  const allowedOrigins = (env.ALLOWED_ORIGINS || 'http://127.0.0.1:3000,http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    port,
    host: env.BACKEND_HOST || '127.0.0.1',
    jwtSecret,
    jwtIssuer: env.JWT_ISSUER || 'microsoft-dynamics-sales-core',
    jwtAudience: env.JWT_AUDIENCE || 'microsoft-dynamics-sales-console',
    allowedOrigins,
    trustProxy: env.TRUST_PROXY === '1',
  };
}

module.exports = { databaseConfig, required, serverConfig };
