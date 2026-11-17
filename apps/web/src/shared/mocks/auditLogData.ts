export interface AuditEvent {
  id: string;
  timestamp: string;
  actor: {
    name: string;
    avatar?: string;
    role: string;
    initials?: string;
    isAi?: boolean;
  };
  action: 'Updated' | 'Approved' | 'Impersonation' | 'Created' | 'Revoked' | 'Exported' | 'Deleted';
  target: string;
  details: string;
  ipAddress: string;
  location: string;
  status: '200 OK' | '403 Forbidden' | '500 Error';
  userAgent: string;
  changesDiff?: {
    field: string;
    before: string;
    after: string;
  }[];
  rawPayload: Record<string, unknown>;
}

export const initialAuditEvents: AuditEvent[] = [
  {
    id: 'EVT-90421',
    timestamp: 'Nov 14, 14:32:18',
    actor: {
      name: 'Alex Vance',
      role: 'Company Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    },
    action: 'Updated',
    target: 'Workforce Hub: Sarah Jenkins',
    details: 'Modified agent access matrix and increased credit quota to 1,500',
    ipAddress: '110.38.24.120',
    location: 'Karachi, PK',
    status: '200 OK',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36',
    changesDiff: [
      { field: 'credit_monthly_limit', before: '1,000', after: '1,500' },
      { field: 'allowed_agents[Agent #8]', before: 'false', after: 'true' },
      { field: 'role', before: 'Member', after: 'Editor' },
    ],
    rawPayload: {
      event_type: 'user.permissions.update',
      target_user_id: 'usr_883921',
      tenant_id: 'ten_apex_growth',
      modified_by: 'usr_alex_vance',
      timestamp_unix: 1731580338,
      security_context: {
        mfa_verified: true,
        session_id: 'sess_993120ab8',
      },
    },
  },
  {
    id: 'EVT-90420',
    timestamp: 'Nov 14, 13:50:02',
    actor: {
      name: 'Sarah Jenkins',
      role: 'Editor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    },
    action: 'Approved',
    target: 'Post Draft #882 (LinkedIn)',
    details: 'Scheduled autonomous distribution for Nov 15 09:00 PKT',
    ipAddress: '198.51.100.8',
    location: 'Lahore, PK',
    status: '200 OK',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0',
    changesDiff: [
      { field: 'approval_status', before: 'pending_review', after: 'approved' },
      { field: 'scheduled_at', before: 'null', after: '2026-11-15T09:00:00Z' },
    ],
    rawPayload: {
      event_type: 'campaign.post.approved',
      post_id: 'post_882',
      approver_id: 'usr_sarah_j',
      estimated_reach: 8400,
    },
  },
  {
    id: 'EVT-90419',
    timestamp: 'Nov 14, 12:15:40',
    actor: {
      name: 'Marcus Brody',
      role: 'Super Admin',
      initials: 'MB',
    },
    action: 'Impersonation',
    target: 'Tenant: Apex Growth',
    details: 'SuperAdmin started impersonation session to troubleshoot credit ledger',
    ipAddress: '192.0.2.14',
    location: 'London, UK',
    status: '200 OK',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4) Safari/605.1.15',
    changesDiff: [
      { field: 'impersonated_tenant_id', before: 'null', after: 'ten_apex_growth' },
      { field: 'audit_escalation_reason', before: 'null', after: 'Ledger discrepancy ticket #T-884' },
    ],
    rawPayload: {
      event_type: 'security.impersonation.start',
      admin_user_id: 'usr_super_marcus',
      tenant_slug: 'apex-growth',
      session_ttl_minutes: 60,
    },
  },
  {
    id: 'EVT-90418',
    timestamp: 'Nov 14, 11:04:19',
    actor: {
      name: 'Agent #8 (Outreach)',
      role: 'Autonomous Fleet',
      isAi: true,
    },
    action: 'Created',
    target: 'Lead batch #104',
    details: 'Ingested and qualified 42 enterprise prospects matching ICP filter',
    ipAddress: '10.0.4.12',
    location: 'Internal Cluster',
    status: '200 OK',
    userAgent: 'StyreBot-Agent-Fleet/v2.4 (WorkerPool-3)',
    changesDiff: [
      { field: 'leads_created', before: '0', after: '42' },
      { field: 'credits_consumed', before: '0', after: '210' },
    ],
    rawPayload: {
      event_type: 'agent.batch.executed',
      agent_id: 8,
      agent_name: 'Publisher & Distributor',
      credits_used: 210,
    },
  },
  {
    id: 'EVT-90417',
    timestamp: 'Nov 14, 09:40:55',
    actor: {
      name: 'Alex Vance',
      role: 'Company Admin',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    },
    action: 'Revoked',
    target: 'User: Hamza Tariq (Intern)',
    details: 'Revoked autonomous publishing and Trainee agent access due to quota breach',
    ipAddress: '110.38.24.120',
    location: 'Karachi, PK',
    status: '200 OK',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)',
    changesDiff: [
      { field: 'account_status', before: 'active', after: 'restricted' },
      { field: 'autonomous_mode', before: 'enabled', after: 'disabled' },
    ],
    rawPayload: {
      event_type: 'user.access.revoked',
      target_user_id: 'usr_hamza_t',
      reason: 'over_budget_throttling',
    },
  },
  {
    id: 'EVT-90416',
    timestamp: 'Nov 14, 08:12:00',
    actor: {
      name: 'Zaid Akhtar',
      role: 'Member',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    },
    action: 'Exported',
    target: 'Full Leads Database (CSV)',
    details: 'Exported 1,420 filtered leads with verified phone and email records',
    ipAddress: '39.50.198.44',
    location: 'Islamabad, PK',
    status: '200 OK',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
    changesDiff: [],
    rawPayload: {
      event_type: 'data.export.csv',
      records_count: 1420,
      export_filter: 'status=qualified',
    },
  },
];
