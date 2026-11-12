-- Migration 012: Outbound egress hardening metadata for tenant external tools
ALTER TABLE tenant_external_tools
  ADD COLUMN IF NOT EXISTS allowed_roles JSONB DEFAULT '["SUPERADMIN","CLIENT_OWNER"]'::jsonb,
  ADD COLUMN IF NOT EXISTS side_effect VARCHAR(20) DEFAULT 'WRITE'::varchar,
  ADD COLUMN IF NOT EXISTS is_destructive BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rate_limit_per_min INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS timeout_ms INTEGER DEFAULT 15000;

CREATE TABLE IF NOT EXISTS outbound_call_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID,
    actor_role user_role,
    tool_name VARCHAR(100),
    method VARCHAR(10),
    destination_host VARCHAR(255),
    destination_path_redacted TEXT,
    decision VARCHAR(20) NOT NULL, -- ALLOW, DENY, NEEDS_APPROVAL
    decision_reason TEXT,
    status VARCHAR(20), -- SUCCESS, FAILED, SKIPPED
    status_code INTEGER,
    latency_ms INTEGER,
    error_redacted TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outbound_call_logs_tenant_created ON outbound_call_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outbound_call_logs_tool ON outbound_call_logs(tool_name, created_at DESC);
