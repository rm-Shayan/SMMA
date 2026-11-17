-- 003: auth tokens for invite + password-reset flows.
-- NOTE: users.password_hash is not in ERD.sql but is required by app/modules/auth/service.py;
-- added here (idempotent) so a fresh database matches the live schema.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" varchar;

CREATE TABLE IF NOT EXISTS "auth_tokens" (
  "id" uuid PRIMARY KEY,
  "type" varchar NOT NULL,              -- 'invite' | 'reset'
  "company_id" uuid,                     -- NULL for reset
  "email" varchar NOT NULL,
  "role" user_role,                      -- invite only
  "token" varchar UNIQUE NOT NULL,
  "invited_by" uuid,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_token ON "auth_tokens" ("token");
