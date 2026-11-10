-- Migration 008: Tenant Autonomous Operating Cadence & Intelligence Config

ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS niche VARCHAR(255) DEFAULT 'General Marketing & Sales Automation',
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'Business owners and prospective clients',
ADD COLUMN IF NOT EXISTS competitor_handles JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS autonomous_mode_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS posting_frequency_per_day INT DEFAULT 2,
ADD COLUMN IF NOT EXISTS cadence_state JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS last_cadence_run_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_tenants_autonomous 
ON tenants (autonomous_mode_enabled, is_active);

