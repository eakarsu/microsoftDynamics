CREATE TABLE tenants (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,78}[a-z0-9]$'),
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (slug)
);

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  email VARCHAR(254) NOT NULL CHECK (email = LOWER(email)),
  password_hash VARCHAR(100) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('sales_rep', 'manager', 'admin')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email),
  UNIQUE (tenant_id, id)
);

CREATE TABLE leads (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  owner_user_id BIGINT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  company VARCHAR(200) NOT NULL,
  estimated_value NUMERIC(14,2) NOT NULL CHECK (estimated_value >= 0),
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'qualified', 'converted')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id, owner_user_id) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, id)
);

CREATE INDEX leads_tenant_owner_status_idx ON leads (tenant_id, owner_user_id, status, id DESC);

CREATE TABLE lead_qualifications (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL,
  lead_id BIGINT NOT NULL,
  actor_user_id BIGINT NOT NULL,
  rubric JSONB NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('new', 'qualified')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id, lead_id) REFERENCES leads(tenant_id, id),
  FOREIGN KEY (tenant_id, actor_user_id) REFERENCES users(tenant_id, id)
);

CREATE TABLE opportunities (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  lead_id BIGINT NOT NULL,
  owner_user_id BIGINT NOT NULL,
  name VARCHAR(250) NOT NULL,
  account_name VARCHAR(200) NOT NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount >= 0),
  stage VARCHAR(30) NOT NULL DEFAULT 'qualification' CHECK (stage IN ('qualification', 'proposal', 'negotiation', 'won', 'lost')),
  probability INTEGER NOT NULL DEFAULT 25 CHECK (probability BETWEEN 0 AND 100),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (tenant_id, lead_id) REFERENCES leads(tenant_id, id),
  FOREIGN KEY (tenant_id, owner_user_id) REFERENCES users(tenant_id, id),
  UNIQUE (tenant_id, lead_id),
  UNIQUE (tenant_id, id)
);

CREATE INDEX opportunities_tenant_owner_stage_idx ON opportunities (tenant_id, owner_user_id, stage, id DESC);

CREATE TABLE idempotency_keys (
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  route VARCHAR(120) NOT NULL,
  key VARCHAR(128) NOT NULL,
  request_hash CHAR(64) NOT NULL,
  status_code INTEGER NOT NULL,
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, route, key)
);

CREATE TABLE audit_events (
  id BIGSERIAL PRIMARY KEY,
  tenant_id BIGINT NOT NULL REFERENCES tenants(id),
  actor_user_id BIGINT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id VARCHAR(120) NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL,
  previous_hash VARCHAR(64) NOT NULL,
  event_hash CHAR(64) NOT NULL UNIQUE,
  FOREIGN KEY (tenant_id, actor_user_id) REFERENCES users(tenant_id, id)
);

CREATE INDEX audit_events_tenant_id_idx ON audit_events (tenant_id, id);

CREATE FUNCTION reject_audit_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_events_immutable
BEFORE UPDATE OR DELETE ON audit_events
FOR EACH ROW EXECUTE FUNCTION reject_audit_mutation();
