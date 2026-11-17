-- Migration 005: seed agent registry (agents 0-12 + agent_actions)
-- Why: code hardcodes action IDs (e.g. campaigns router uses
-- "a0000000-0000-0000-0000-000000000006" for agent 6 "outreach"), but nothing
-- ever inserted rows into "agents"/"agent_actions" -> POST /api/v1/campaigns
-- failed with ForeignKeyViolation on agent_runs.agent_action_id.
-- Idempotent: ON CONFLICT DO NOTHING.

INSERT INTO "agents" (id, code, name, default_mode) VALUES
  (0,  'copilot',              'Copilot',                  'auto'),
  (1,  'own-post-engager',      'Own-Post Engager',         'auto'),
  (2,  'competitor-researcher', 'Competitor Researcher',    'draft'),
  (3,  'comment-responder',     'Comment Responder',        'auto'),
  (4,  'analytics',             'Analytics Agent',          'auto'),
  (5,  'daily-brief',           'Daily Brief',              'auto'),
  (6,  'outreach',              'Outreach (DM / Email)',    'draft'),
  (7,  'competitor-engager',    'Competitor Engager',       'draft'),
  (8,  'publisher',             'Publisher & Distributor',  'draft'),
  (9,  'inbox_responder',       'Inbox Responder',          'draft'),
  (10, 'trainee-sop',           'Trainee & SOP Agent',      'draft'),
  (11, 'company-ops',           'Company Ops Agent',        'draft'),
  (12, 'supervisor',            'Supervisor',               'auto')
ON CONFLICT (id) DO NOTHING;

-- Action IDs are the deterministic a0000000-...-00NN values referenced in code.
INSERT INTO "agent_actions" (id, agent_id, action, credit_cost) VALUES
  ('a0000000-0000-0000-0000-000000000000', 0,  'run_copilot',            1),
  ('a0000000-0000-0000-0000-000000000001', 1,  'engage_own_post',        1),
  ('a0000000-0000-0000-0000-000000000002', 2,  'research_competitor',    1),
  ('a0000000-0000-0000-0000-000000000003', 3,  'respond_comment',        1),
  ('a0000000-0000-0000-0000-000000000004', 4,  'generate_analytics',     1),
  ('a0000000-0000-0000-0000-000000000005', 5,  'daily_brief',            1),
  ('a0000000-0000-0000-0000-000000000006', 6,  'send_email',             1),
  ('a0000000-0000-0000-0000-000000000007', 7,  'engage_competitor',      1),
  ('a0000000-0000-0000-0000-000000000008', 8,  'publish_post',           1),
  ('a0000000-0000-0000-0000-000000000009', 9,  'respond_inbox',          1),
  ('a0000000-0000-0000-0000-000000000010', 10, 'train_sop',              1),
  ('a0000000-0000-0000-0000-000000000011', 11, 'company_ops_task',       1),
  ('a0000000-0000-0000-0000-000000000012', 12, 'orchestrate',            1)
ON CONFLICT (id) DO NOTHING;
