-- 016_credits_allocation_and_tracking.sql
-- Multi-tenant and employee credit distribution with 50% & 80% usage threshold monitoring

-- 1. Add credit pool tracking to tenants table
ALTER TABLE tenants
ADD COLUMN IF NOT EXISTS allocated_credits INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS used_credits INTEGER NOT NULL DEFAULT 0;

-- 2. Add credit allocation and usage tracking to platform_users (employees)
ALTER TABLE platform_users
ADD COLUMN IF NOT EXISTS allocated_credits INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS used_credits INTEGER NOT NULL DEFAULT 0;

-- 3. Audit trail for credit allocations and agent deductions
CREATE TABLE IF NOT EXISTS tenant_credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES platform_users(id) ON DELETE SET NULL,
    amount INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'SUPERADMIN_ALLOCATION', 'EMPLOYEE_DISTRIBUTION', 'AGENT_CONSUMPTION', 'REFUND'
    description TEXT NOT NULL,
    tenant_remaining_credits INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_tenant ON tenant_credit_transactions(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON tenant_credit_transactions(user_id);

