CREATE TABLE runtime_ai_results (
  id UUID PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  user_id BIGINT NOT NULL,
  feature VARCHAR(64) NOT NULL,
  prompt TEXT NOT NULL,
  content TEXT NOT NULL,
  provider VARCHAR(32) NOT NULL CHECK (provider = 'openrouter'),
  model VARCHAR(160) NOT NULL,
  provider_response_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id, user_id) REFERENCES users(tenant_id, id)
);

CREATE INDEX runtime_ai_results_tenant_user_created_idx
  ON runtime_ai_results(tenant_id, user_id, created_at DESC);
