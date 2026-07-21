const { canonical, digest } = require('./domain');

async function appendAudit(client, { tenantId, actorUserId = null, action, entityType, entityId, details = {} }) {
  await client.query('SELECT pg_advisory_xact_lock($1)', [tenantId]);
  const previous = await client.query(
    'SELECT event_hash FROM audit_events WHERE tenant_id = $1 ORDER BY id DESC LIMIT 1',
    [tenantId],
  );
  const previousHash = previous.rows[0]?.event_hash || 'GENESIS';
  const occurredAt = new Date().toISOString();
  const payload = { tenantId, actorUserId, action, entityType, entityId: String(entityId), details, occurredAt, previousHash };
  const eventHash = digest(payload);
  const result = await client.query(
    `INSERT INTO audit_events
      (tenant_id, actor_user_id, action, entity_type, entity_id, details, occurred_at, previous_hash, event_hash)
     VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9) RETURNING *`,
    [tenantId, actorUserId, action, entityType, String(entityId), canonical(details), occurredAt, previousHash, eventHash],
  );
  return result.rows[0];
}

async function verifyAuditChain(pool, tenantId) {
  const result = await pool.query('SELECT * FROM audit_events WHERE tenant_id = $1 ORDER BY id', [tenantId]);
  let previousHash = 'GENESIS';
  for (const row of result.rows) {
    const payload = {
      tenantId: Number(row.tenant_id),
      actorUserId: row.actor_user_id === null ? null : Number(row.actor_user_id),
      action: row.action,
      entityType: row.entity_type,
      entityId: row.entity_id,
      details: row.details,
      occurredAt: new Date(row.occurred_at).toISOString(),
      previousHash,
    };
    if (row.previous_hash !== previousHash || row.event_hash !== digest(payload)) return false;
    previousHash = row.event_hash;
  }
  return true;
}

module.exports = { appendAudit, verifyAuditChain };
