-- Migration 004: campaigns.created_at
-- Backend routers (campaigns/list, employee/campaigns, manager/oversight) ORDER BY / SELECT
-- created_at, but ERD.sql never created the column -> GET /api/v1/campaigns 500'd.
-- Idempotent: safe to run multiple times.

ALTER TABLE "campaigns" ADD COLUMN IF NOT EXISTS "created_at" timestamp NOT NULL DEFAULT now();
CREATE INDEX IF NOT EXISTS idx_campaigns_company_created ON "campaigns" (company_id, created_at DESC);
