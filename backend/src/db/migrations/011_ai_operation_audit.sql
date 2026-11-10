-- Migration 011: AI operation audit logging for agent/tool actions

CREATE TABLE IF NOT EXISTS ai_operation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    actor_user_id UUID,
    actor_role user_role,
    channel VARCHAR(50),
    intent TEXT,
    proposed_tool VARCHAR(100),
    proposed_params JSONB DEFAULT '{}'::jsonb,
    decision VARCHAR(20) NOT NULL, -- ALLOW, DENY, NEEDS_APPROVAL, ERROR
    decision_reason TEXT,
    executed_tool VARCHAR(100),
    result_status VARCHAR(20), -- SUCCESS, FAILED, SKIPPED
    result_message TEXT,
    result_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_operation_logs_tenant_created ON ai_operation_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operation_logs_actor ON ai_operation_logs(actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_operation_logs_decision ON ai_operation_logs(decision, created_at DESC);
