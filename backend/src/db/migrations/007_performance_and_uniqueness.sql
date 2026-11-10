-- Migration 007: Uniqueness constraints and hot-path indexes

-- Required by credentials.service.ts ON CONFLICT (tenant_id, platform)
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_credentials_tenant_platform
    ON tenant_credentials (tenant_id, platform);

-- Webhook tenant resolution by platform account
CREATE INDEX IF NOT EXISTS idx_tenant_credentials_platform_account
    ON tenant_credentials (platform, account_id);

-- Leads & conversations listing/analytics
CREATE INDEX IF NOT EXISTS idx_client_leads_tenant_created
    ON client_leads (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created
    ON tenant_conversations (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_platform_created
    ON tenant_conversations (tenant_id, platform, created_at DESC);

-- Scheduler due-post claiming
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_due
    ON scheduled_posts (status, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_scheduled_posts_tenant_created
    ON scheduled_posts (tenant_id, created_at DESC);
