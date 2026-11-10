-- Migration 009: Company Training Documents & Intern Knowledge Base

CREATE TABLE IF NOT EXISTS company_training_docs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'SOP', -- 'SOP', 'SALES_SCRIPT', 'PRODUCT_MANUAL', 'ONBOARDING'
    document_content TEXT NOT NULL,
    key_takeaways JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS intern_training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    intern_name VARCHAR(255) NOT NULL,
    intern_email VARCHAR(255),
    question TEXT NOT NULL,
    ai_mentor_response TEXT NOT NULL,
    referenced_doc_id UUID REFERENCES company_training_docs(id) ON DELETE SET NULL,
    comprehension_score INT DEFAULT 85, -- Quiz/Evaluation score 0-100
    mentor_feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_company_training_tenant 
ON company_training_docs (tenant_id, category);

CREATE INDEX IF NOT EXISTS idx_intern_sessions_tenant 
ON intern_training_sessions (tenant_id, intern_name);

