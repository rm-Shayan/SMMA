-- PostgreSQL Row-Level Security (RLS) Setup for Styre-BOT
-- Enforces kernel-level multi-tenant isolation across all tables.

CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Tables requiring strict company_id isolation
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'users', 'connected_accounts', 'campaigns', 'credit_wallets',
        'social_posts', 'social_comments', 'competitors', 'knowledge_documents',
        'document_chunks', 'sops', 'conversations', 'contacts', 'deals',
        'email_suppressions', 'tasks', 'agent_runs', 'audit_logs', 'schedules'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);
        EXECUTE format('
            CREATE POLICY tenant_isolation_policy ON %I
                FOR ALL
                USING (company_id = current_tenant_id() OR current_setting(''app.is_superadmin'', true) = ''true'')
                WITH CHECK (company_id = current_tenant_id() OR current_setting(''app.is_superadmin'', true) = ''true'');
        ', tbl);
    END LOOP;
END $$;

