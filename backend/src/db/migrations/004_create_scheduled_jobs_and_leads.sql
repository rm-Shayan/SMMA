CREATE TABLE IF NOT EXISTS scheduled_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'PUBLISHED', 'FAILED'
    published_post_id VARCHAR(255),
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS client_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    channel VARCHAR(50) NOT NULL, -- 'INSTAGRAM', 'WHATSAPP', 'CRM_INBOX', etc.
    inquiry_interest TEXT,
    lead_score INT DEFAULT 50,
    crm_stage VARCHAR(50) DEFAULT 'NEW_LEAD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE scheduled_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS isolation_scheduled_posts ON scheduled_posts;
CREATE POLICY isolation_scheduled_posts ON scheduled_posts
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

DROP POLICY IF EXISTS isolation_client_leads ON client_leads;
CREATE POLICY isolation_client_leads ON client_leads
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

