CREATE INDEX idempotency_keys_created_at_idx ON idempotency_keys (created_at);
CREATE INDEX lead_qualifications_tenant_lead_idx ON lead_qualifications (tenant_id, lead_id, id DESC);
