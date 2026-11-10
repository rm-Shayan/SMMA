-- Migration 010: Tenant External Tools & OpenAPI / Swagger Integration

CREATE TABLE IF NOT EXISTS tenant_external_tools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    tool_name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    method VARCHAR(10) DEFAULT 'POST',
    endpoint_url TEXT NOT NULL,
    auth_header_name VARCHAR(100) DEFAULT 'Authorization',
    auth_header_value TEXT,
    parameters_schema JSONB DEFAULT '{}'::jsonb,
    source_type VARCHAR(50) DEFAULT 'MANUAL',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tenant_tool_name UNIQUE (tenant_id, tool_name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_tools_active
ON tenant_external_tools (tenant_id, is_active);

