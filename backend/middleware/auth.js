const jwt = require('jsonwebtoken');
const { AppError } = require('../errors');

function auth(config, pool) {
  return async (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization || '').split(' ');
    if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'AUTH_REQUIRED', 'Authentication is required'));
    try {
      const claims = jwt.verify(token, config.jwtSecret, {
        algorithms: ['HS256'],
        issuer: config.jwtIssuer,
        audience: config.jwtAudience,
      });
      const userId = Number(claims.sub);
      const tenantId = Number(claims.tid);
      if (!Number.isInteger(userId) || !Number.isInteger(tenantId)) {
        throw new Error('invalid identity claims');
      }
      const result = await pool.query(
        'SELECT id, tenant_id, email, full_name, role FROM users WHERE id = $1 AND tenant_id = $2 AND active = TRUE',
        [userId, tenantId],
      );
      if (!result.rows[0]) throw new Error('inactive identity');
      const row = result.rows[0];
      req.user = { id: Number(row.id), tenantId: Number(row.tenant_id), email: row.email, role: row.role, name: row.full_name };
      return next();
    } catch (_error) {
      return next(new AppError(401, 'INVALID_TOKEN', 'The access token is invalid or expired'));
    }
  };
}

function requireRole(...allowed) {
  return (req, _res, next) => {
    if (!allowed.includes(req.user.role)) return next(new AppError(403, 'FORBIDDEN', 'This action is not permitted'));
    return next();
  };
}

module.exports = { auth, requireRole };
