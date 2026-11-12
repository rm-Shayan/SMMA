-- Migration 013: approval queue, rate limits, idempotency, and endpoint domain allowlists

CREATE TABLE IF NOT EXISTS ai_action_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID,
    actor_role user_role,
    tool_name VARCHAR(100) NOT NULL,
    proposed_params JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, EXECUTED, FAILED, EXPIRED
    decision_reason TEXT,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    execution_result JSONB,
    idempotency_key VARCHAR(120),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_action_approvals_tenant_status ON ai_action_approvals(tenant_id, status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_action_approvals_idem ON ai_action_approvals(tenant_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS ai_rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID,
    tool_name VARCHAR(100) NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    UNIQUE (tenant_id, actor_user_id, tool_name, window_start)
);

ALTER TABLE tenant_external_tools
  ADD COLUMN IF NOT EXISTS allowed_domains JSONB DEFAULT '[]'::jsonb;

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS outbound_allowed_domains JSONB DEFAULT '[]'::jsonb;
