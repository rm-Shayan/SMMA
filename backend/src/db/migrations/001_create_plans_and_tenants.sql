CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE plan_tier AS ENUM ('INTERNAL_UNLIMITED', 'FREE_STARTER', 'GROWTH_PRO', 'AGENCY_ENTERPRISE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name plan_tier NOT NULL UNIQUE,
    monthly_price_cents INT NOT NULL,
    max_social_accounts INT NOT NULL,
    max_inbound_replies INT NOT NULL,
    max_scheduled_posts INT NOT NULL,
    max_outreach_messages INT NOT NULL,
    max_rag_documents INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    brand_voice TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    current_plan plan_tier DEFAULT 'FREE_STARTER' NOT NULL,
    billing_provider VARCHAR(50) DEFAULT 'MANUAL',
    external_customer_id VARCHAR(255),
    external_subscription_id VARCHAR(255),
    cycle_start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cycle_end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

