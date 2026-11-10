CREATE TABLE IF NOT EXISTS tenant_usage_meters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    inbound_replies_used INT DEFAULT 0,
    scheduled_posts_used INT DEFAULT 0,
    outreach_messages_used INT DEFAULT 0,
    rag_documents_uploaded INT DEFAULT 0,
    cycle_start TIMESTAMP WITH TIME ZONE NOT NULL,
    cycle_end TIMESTAMP WITH TIME ZONE NOT NULL,
    burn_alert_sent BOOLEAN DEFAULT FALSE,
    eighty_percent_alert_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_tenant_cycle UNIQUE (tenant_id, cycle_start)
);

CREATE TABLE IF NOT EXISTS tenant_metered_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    units_consumed INT DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenant_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    plan_tier plan_tier NOT NULL,
    amount_paid_cents INT NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_proof_url TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    approved_by_admin_id UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

