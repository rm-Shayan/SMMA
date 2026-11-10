CREATE TABLE IF NOT EXISTS tenant_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    access_token TEXT NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    sender_id VARCHAR(255) NOT NULL,
    incoming_text TEXT NOT NULL,
    intent_category VARCHAR(50),
    agent_response TEXT,
    is_escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row-Level Security
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_usage_meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_metered_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;

-- Create Policies (Drop if exists first to be idempotent)
DROP POLICY IF EXISTS isolation_credentials ON tenant_credentials;
CREATE POLICY isolation_credentials ON tenant_credentials
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS isolation_conversations ON tenant_conversations;
CREATE POLICY isolation_conversations ON tenant_conversations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS isolation_meters ON tenant_usage_meters;
CREATE POLICY isolation_meters ON tenant_usage_meters
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS isolation_events ON tenant_metered_events;
CREATE POLICY isolation_events ON tenant_metered_events
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS isolation_invoices ON tenant_invoices;
CREATE POLICY isolation_invoices ON tenant_invoices
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

