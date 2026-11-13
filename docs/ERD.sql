CREATE TYPE "user_role" AS ENUM (
  'super_admin',
  'company_admin',
  'manager',
  'employee'
);

CREATE TYPE "agent_mode" AS ENUM (
  'draft',
  'auto'
);

CREATE TYPE "credit_tx_type" AS ENUM (
  'purchase',
  'allocate',
  'reserve',
  'consume',
  'release',
  'revoke',
  'expire'
);

CREATE TYPE "run_status" AS ENUM (
  'queued',
  'running',
  'awaiting_approval',
  'completed',
  'failed',
  'cancelled'
);

CREATE TYPE "outbox_status" AS ENUM (
  'queued',
  'sending',
  'sent',
  'failed',
  'expired',
  'paused'
);

CREATE TYPE "msg_direction" AS ENUM (
  'inbound',
  'outbound'
);

CREATE TABLE "companies" (
  "id" uuid PRIMARY KEY,
  "name" varchar NOT NULL,
  "timezone" varchar,
  "status" varchar,
  "created_at" timestamp
);

CREATE TABLE "teams" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "manager_id" uuid,
  "name" varchar
);

CREATE TABLE "users" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid,
  "team_id" uuid,
  "email" varchar UNIQUE NOT NULL,
  "name" varchar,
  "role" user_role NOT NULL,
  "status" varchar,
  "created_at" timestamp
);

CREATE TABLE "agents" (
  "id" int PRIMARY KEY,
  "code" varchar UNIQUE,
  "name" varchar,
  "default_mode" agent_mode DEFAULT 'draft'
);

CREATE TABLE "agent_actions" (
  "id" uuid PRIMARY KEY,
  "agent_id" int NOT NULL,
  "action" varchar,
  "credit_cost" int
);

CREATE TABLE "company_agents" (
  "company_id" uuid NOT NULL,
  "agent_id" int NOT NULL,
  "enabled_by" uuid,
  "enabled_at" timestamp,
  PRIMARY KEY ("company_id", "agent_id")
);

CREATE TABLE "user_agent_access" (
  "user_id" uuid NOT NULL,
  "agent_id" int NOT NULL,
  "mode" agent_mode DEFAULT 'draft',
  "granted_by" uuid,
  "granted_at" timestamp,
  PRIMARY KEY ("user_id", "agent_id")
);

CREATE TABLE "credit_wallets" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid,
  "balance" int DEFAULT 0,
  "reserved" int DEFAULT 0,
  "low_balance_alerted" bool
);

CREATE TABLE "credit_transactions" (
  "id" uuid PRIMARY KEY,
  "wallet_id" uuid NOT NULL,
  "counter_wallet_id" uuid,
  "type" credit_tx_type NOT NULL,
  "amount" int NOT NULL,
  "agent_run_id" uuid,
  "task_id" uuid,
  "created_by" uuid,
  "note" varchar,
  "created_at" timestamp
);

CREATE TABLE "connected_accounts" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid,
  "provider" varchar,
  "display_name" varchar,
  "token_enc" text,
  "status" varchar,
  "created_at" timestamp
);

CREATE TABLE "account_limits" (
  "connected_account_id" uuid PRIMARY KEY,
  "min_gap_sec" int,
  "max_gap_sec" int,
  "per_hour" int,
  "per_day" int,
  "work_hours" varchar,
  "paused_until" timestamp,
  "backoff_level" int
);

CREATE TABLE "connectors" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "type" varchar,
  "name" varchar,
  "config_enc" json,
  "write_enabled" bool DEFAULT false,
  "status" varchar
);

CREATE TABLE "connector_mappings" (
  "id" uuid PRIMARY KEY,
  "connector_id" uuid NOT NULL,
  "resource" varchar,
  "semantic_name" varchar,
  "mapping" json,
  "confirmed_by" uuid
);

CREATE TABLE "tasks" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "request" text,
  "plan" json,
  "credit_budget" int,
  "status" run_status,
  "created_at" timestamp
);

CREATE TABLE "agent_runs" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "task_id" uuid,
  "agent_action_id" uuid NOT NULL,
  "user_id" uuid,
  "thread_key" varchar,
  "prompt_version" varchar,
  "status" run_status,
  "credits_used" int,
  "cost_usd" decimal(10,5),
  "input" json,
  "output" json,
  "started_at" timestamp,
  "finished_at" timestamp
);

CREATE TABLE "approvals" (
  "id" uuid PRIMARY KEY,
  "agent_run_id" uuid NOT NULL,
  "approver_id" uuid,
  "status" varchar,
  "decided_at" timestamp
);

CREATE TABLE "schedules" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "agent_id" int NOT NULL,
  "user_id" uuid,
  "cron" varchar,
  "payload" json,
  "next_run_at" timestamp,
  "enabled" bool
);

CREATE TABLE "outbox_jobs" (
  "id" uuid PRIMARY KEY,
  "connected_account_id" uuid NOT NULL,
  "agent_run_id" uuid,
  "thread_key" varchar,
  "target_type" varchar,
  "target_post_id" varchar,
  "priority" int,
  "reply_text" text,
  "status" outbox_status,
  "not_before" timestamp,
  "expires_at" timestamp,
  "idempotency_key" varchar UNIQUE
);

CREATE TABLE "contacts" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "name" varchar,
  "email" varchar,
  "company_name" varchar,
  "topic" varchar,
  "unsubscribed" bool DEFAULT false,
  "created_at" timestamp
);

CREATE TABLE "contact_lists" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid,
  "name" varchar
);

CREATE TABLE "contact_list_members" (
  "list_id" uuid NOT NULL,
  "contact_id" uuid NOT NULL,
  PRIMARY KEY ("list_id", "contact_id")
);

CREATE TABLE "email_suppressions" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "email" varchar,
  "reason" varchar,
  "created_at" timestamp
);

CREATE TABLE "campaigns" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "connected_account_id" uuid,
  "list_id" uuid,
  "goal" varchar,
  "tone" varchar,
  "followup_rules" json,
  "credit_limit" int,
  "status" varchar
);

CREATE TABLE "campaign_recipients" (
  "id" uuid PRIMARY KEY,
  "campaign_id" uuid NOT NULL,
  "contact_id" uuid NOT NULL,
  "topic" varchar,
  "status" varchar,
  "followups_sent" int DEFAULT 0
);

CREATE TABLE "conversations" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "contact_id" uuid,
  "connected_account_id" uuid,
  "channel" varchar,
  "external_thread_id" varchar,
  "intent" varchar
);

CREATE TABLE "messages" (
  "id" uuid PRIMARY KEY,
  "conversation_id" uuid NOT NULL,
  "campaign_recipient_id" uuid,
  "agent_run_id" uuid,
  "direction" msg_direction,
  "body" text,
  "status" varchar,
  "sent_at" timestamp
);

CREATE TABLE "deals" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "contact_id" uuid NOT NULL,
  "campaign_id" uuid,
  "owner_id" uuid,
  "stage" varchar,
  "value" decimal(12,2),
  "updated_at" timestamp
);

CREATE TABLE "social_posts" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "connected_account_id" uuid,
  "created_by_run" uuid,
  "platform" varchar,
  "external_id" varchar,
  "content" text,
  "image_prompt" text,
  "status" varchar,
  "scheduled_at" timestamp,
  "published_at" timestamp
);

CREATE TABLE "social_comments" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "post_id" uuid,
  "competitor_post_ref" varchar,
  "agent_run_id" uuid,
  "platform" varchar,
  "target_type" varchar,
  "external_id" varchar UNIQUE,
  "parent_external_id" varchar,
  "thread_key" varchar,
  "body" text,
  "sentiment" varchar,
  "direction" msg_direction,
  "created_at" timestamp
);

CREATE TABLE "competitors" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "name" varchar,
  "website" varchar,
  "social_handles" json,
  "keywords" json
);

CREATE TABLE "competitor_insights" (
  "id" uuid PRIMARY KEY,
  "competitor_id" uuid NOT NULL,
  "agent_run_id" uuid,
  "type" varchar,
  "data" json,
  "captured_at" timestamp
);

CREATE TABLE "knowledge_documents" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "title" varchar,
  "source" varchar,
  "storage_path" varchar,
  "uploaded_by" uuid
);

CREATE TABLE "document_chunks" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "document_id" uuid NOT NULL,
  "content" text,
  "embedding" vector(1536)
);

CREATE TABLE "sops" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "document_id" uuid,
  "title" varchar,
  "modules" json
);

CREATE TABLE "training_progress" (
  "id" uuid PRIMARY KEY,
  "sop_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "module_no" int,
  "quiz_score" int,
  "status" varchar,
  "updated_at" timestamp
);

CREATE TABLE "generated_files" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid,
  "agent_run_id" uuid,
  "file_name" varchar,
  "storage_path" varchar,
  "created_at" timestamp
);

CREATE TABLE "analytics_snapshots" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid,
  "scope" varchar,
  "period" varchar,
  "metrics" json,
  "ai_summary" text,
  "created_at" timestamp
);

CREATE TABLE "daily_briefs" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "agent_run_id" uuid,
  "brief_date" date,
  "items" json
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY,
  "company_id" uuid,
  "user_id" uuid,
  "action" varchar,
  "entity" varchar,
  "entity_id" uuid,
  "meta" json,
  "created_at" timestamp
);

CREATE INDEX ON "agent_runs" ("thread_key");

CREATE UNIQUE INDEX ON "contacts" ("company_id", "email");

CREATE INDEX ON "social_comments" ("thread_key");

COMMENT ON COLUMN "companies"."status" IS 'active / suspended';

COMMENT ON COLUMN "teams"."manager_id" IS 'Manager role user';

COMMENT ON COLUMN "users"."company_id" IS 'NULL for SuperAdmin';

COMMENT ON COLUMN "agents"."id" IS '1..12';

COMMENT ON COLUMN "agent_actions"."action" IS 'e.g. send_email, publish_post';

COMMENT ON COLUMN "agent_actions"."credit_cost" IS 'pricing config yahin, code mein nahi';

COMMENT ON COLUMN "company_agents"."enabled_by" IS 'SuperAdmin';

COMMENT ON COLUMN "credit_wallets"."user_id" IS 'NULL = company wallet';

COMMENT ON COLUMN "credit_wallets"."balance" IS 'cache of ledger';

COMMENT ON COLUMN "credit_transactions"."counter_wallet_id" IS 'allocate/revoke: dusra wallet';

COMMENT ON COLUMN "credit_transactions"."created_at" IS 'append-only: kabhi update/delete nahi';

COMMENT ON COLUMN "connected_accounts"."user_id" IS 'NULL = company-level (Page)';

COMMENT ON COLUMN "connected_accounts"."provider" IS 'gmail / outlook / smtp / meta / linkedin';

COMMENT ON COLUMN "connected_accounts"."token_enc" IS 'KMS encrypted';

COMMENT ON COLUMN "connected_accounts"."status" IS 'active / reconnect_required';

COMMENT ON COLUMN "connectors"."type" IS 'rest / db / file / webhook / mcp';

COMMENT ON COLUMN "connector_mappings"."resource" IS 'table / endpoint';

COMMENT ON COLUMN "connector_mappings"."semantic_name" IS 'e.g. invoices = sales';

COMMENT ON COLUMN "agent_runs"."thread_key" IS 'company+platform+post+root_comment';

COMMENT ON COLUMN "agent_runs"."cost_usd" IS 'real LLM cost';

COMMENT ON COLUMN "agent_runs"."output" IS 'exact text log';

COMMENT ON COLUMN "approvals"."status" IS 'pending / approved / rejected';

COMMENT ON COLUMN "outbox_jobs"."target_type" IS 'own_post / competitor_post / email / dm';

COMMENT ON COLUMN "email_suppressions"."reason" IS 'unsubscribe / bounce / complaint';

COMMENT ON COLUMN "campaigns"."credit_limit" IS 'max credits is campaign par';

COMMENT ON COLUMN "campaign_recipients"."followups_sent" IS 'max 3';

COMMENT ON COLUMN "conversations"."channel" IS 'email / meta_dm / linkedin_dm';

COMMENT ON COLUMN "conversations"."intent" IS 'lead / support / spam';

COMMENT ON COLUMN "deals"."stage" IS 'Interested / Won / Lost ...';

COMMENT ON COLUMN "social_posts"."status" IS 'draft/approved/scheduled/published';

COMMENT ON COLUMN "social_comments"."post_id" IS 'own post, if own_post';

COMMENT ON COLUMN "social_comments"."competitor_post_ref" IS 'external id, if competitor_post';

COMMENT ON COLUMN "social_comments"."target_type" IS 'own_post / competitor_post';

COMMENT ON COLUMN "social_comments"."external_id" IS 'idempotency';

COMMENT ON COLUMN "competitor_insights"."type" IS 'post / offer / pricing / report';

COMMENT ON COLUMN "knowledge_documents"."storage_path" IS 's3://bucket/{company_id}/...';

COMMENT ON COLUMN "document_chunks"."company_id" IS 'vector search bhi company_id se filter';

COMMENT ON COLUMN "analytics_snapshots"."scope" IS 'campaign / post / credits / agent';

COMMENT ON COLUMN "daily_briefs"."items" IS 'har item par Do it -> Supervisor task';

COMMENT ON COLUMN "audit_logs"."action" IS 'login / grant / revoke / credit / connector / approval';

ALTER TABLE "users" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "teams" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "teams" ADD FOREIGN KEY ("manager_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "users" ADD FOREIGN KEY ("team_id") REFERENCES "teams" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "agent_actions" ADD FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "company_agents" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "company_agents" ADD FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_agent_access" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_agent_access" ADD FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "user_agent_access" ADD FOREIGN KEY ("granted_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "credit_wallets" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "credit_wallets" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "credit_transactions" ADD FOREIGN KEY ("wallet_id") REFERENCES "credit_wallets" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "credit_transactions" ADD FOREIGN KEY ("counter_wallet_id") REFERENCES "credit_wallets" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "credit_transactions" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "credit_transactions" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "connected_accounts" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "connected_accounts" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "account_limits" ADD FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "connectors" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "connector_mappings" ADD FOREIGN KEY ("connector_id") REFERENCES "connectors" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "tasks" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "agent_runs" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "agent_runs" ADD FOREIGN KEY ("task_id") REFERENCES "tasks" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "agent_runs" ADD FOREIGN KEY ("agent_action_id") REFERENCES "agent_actions" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "agent_runs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "approvals" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "approvals" ADD FOREIGN KEY ("approver_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "schedules" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "schedules" ADD FOREIGN KEY ("agent_id") REFERENCES "agents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "outbox_jobs" ADD FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "outbox_jobs" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "contacts" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "contact_lists" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "contact_list_members" ADD FOREIGN KEY ("list_id") REFERENCES "contact_lists" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "contact_list_members" ADD FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "email_suppressions" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "campaigns" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "campaigns" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "campaigns" ADD FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "campaigns" ADD FOREIGN KEY ("list_id") REFERENCES "contact_lists" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "campaign_recipients" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "campaign_recipients" ADD FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversations" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversations" ADD FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "conversations" ADD FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "messages" ADD FOREIGN KEY ("conversation_id") REFERENCES "conversations" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "messages" ADD FOREIGN KEY ("campaign_recipient_id") REFERENCES "campaign_recipients" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "messages" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "deals" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "deals" ADD FOREIGN KEY ("contact_id") REFERENCES "contacts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "deals" ADD FOREIGN KEY ("campaign_id") REFERENCES "campaigns" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "deals" ADD FOREIGN KEY ("owner_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "social_posts" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "social_posts" ADD FOREIGN KEY ("connected_account_id") REFERENCES "connected_accounts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "social_posts" ADD FOREIGN KEY ("created_by_run") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "social_comments" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "social_comments" ADD FOREIGN KEY ("post_id") REFERENCES "social_posts" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "social_comments" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "competitors" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "competitor_insights" ADD FOREIGN KEY ("competitor_id") REFERENCES "competitors" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "competitor_insights" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "knowledge_documents" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "document_chunks" ADD FOREIGN KEY ("document_id") REFERENCES "knowledge_documents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sops" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "sops" ADD FOREIGN KEY ("document_id") REFERENCES "knowledge_documents" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "training_progress" ADD FOREIGN KEY ("sop_id") REFERENCES "sops" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "training_progress" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "generated_files" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "generated_files" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "analytics_snapshots" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "daily_briefs" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "daily_briefs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "daily_briefs" ADD FOREIGN KEY ("agent_run_id") REFERENCES "agent_runs" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("company_id") REFERENCES "companies" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "audit_logs" ADD FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;
