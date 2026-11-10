# Project Memory & Progress State (`memory.md`)

**Project Title:** Multi-Tenant Social Media Management, Inbound AI Sales & Engagement Platform  
**Document Version:** 6.0 (SaaS Monorepo Reorganization: Dedicated `backend/` Directory)  
**Last Updated:** Current Session Setup  
**Operational Rule:** Whenever any file is created, edited, or a phase task is completed, this file MUST be updated immediately. Any new turn or session must inspect this file first instead of running global codebase scans.

---

## 1. System Invariants & Stack Lockout

* **Backend Directory:** `backend/` (All server source code, packages, configs, and scripts).
* **Framework:** Node.js (v20+ LTS) with Express.js.
* **Architecture Style:** **Feature-First / Domain-Driven Modular Architecture**.
* **Standard Naming Invariants:**
  * `*.controller.ts`: HTTP request validation, status codes, controller orchestration.
  * `*.service.ts`: Business logic, database queries, external API integrations.
  * `*.routes.ts`: Express router definitions.
  * `*.middleware.ts`: Request pipeline guards (Tenant, RBAC, Error, Security).
  * `*.config.ts`: Environment and schedule configurations.
* **Strict File Size Constraint:** **MAX 150 lines per file** (All 58 files strictly $\le 119$ lines). Single-responsibility principle.
* **Security & Data Protection:**
  * **AES-256-GCM Authenticated Encryption** (`backend/src/core/security/encryption.security.ts`) encrypts all client social tokens before storing in PostgreSQL.
  * **HMAC-SHA256 Signature Verification** (`backend/src/core/security/signature.security.ts`) on all inbound Meta and WhatsApp webhooks.
  * **RBAC & Authentication** (`backend/src/core/middlewares/rbac.middleware.ts`): `SUPERADMIN`, `CLIENT_OWNER`, `AGENT_OPERATOR`.
  * **PostgreSQL RLS:** Multi-tenant database isolation via `app.current_tenant_id`.
* **Lead Delivery Pipeline:**
  1. Internal PostgreSQL `client_leads` table.
  2. Live Google Sheets API batched micro-queue append (`appendLeadToGoogleSheet`).
  3. Real-Time RFC 5321 TLS SMTP HTML Email Alert with direct Google Sheet link (`sendLeadAlertEmail`).

---

## 2. Directory Structure (`backend/`)

```text
SMMA/
├── docker-compose.yml                          (PostgreSQL 16, Redis 7, Qdrant)
├── memory.md                                   (System state and architecture memory)
├── testing-procedure.md                        (End-to-end testing guide)
└── backend/
    ├── package.json
    ├── tsconfig.json
    ├── .env
    ├── .env.example
    ├── .gitignore
    ├── google-credentials.json
    ├── dist/                                   (Compiled JavaScript build)
    ├── scratch/                                (Testing scripts)
    └── src/
        ├── app.ts                              (43 lines)
        ├── index.ts                            (20 lines)
        ├── core/
        │   ├── ai/ (qwen.client.ts, schema.validator.ts)
        │   ├── config/ (env.config.ts, logger.config.ts)
        │   ├── database/ (pool.database.ts, tenant-query.database.ts, vector.database.ts)
        │   ├── middlewares/ (error.middleware.ts, rbac.middleware.ts, tenant.middleware.ts)
        │   └── security/ (encryption.security.ts, signature.security.ts)
        ├── db/ (migrate.ts, seed.ts, migrations 001-007)
        └── modules/
            ├── agents/ (workflow, supervisor, nodes)
            ├── analytics/ (controller, service, routes)
            ├── auth/ (controller, service, routes)
            ├── credentials/ (controller, service, routes, token-monitor)
            ├── inbox/ (controller, conversation.service, routes)
            ├── integrations/ (google-auth, google-sheets, google-calendar, smtp-email)
            ├── leads/ (lead.service.ts)
            ├── scheduler/ (queue.service.ts, cron, controller, routes, service)
            ├── social/ (dispatcher, meta, linkedin, twitter, whatsapp)
            └── webhooks/ (meta, whatsapp, processor)
```

---

## 3. Verification Checkpoints

1. **Compilation:** `cd backend && npm run build` exits with code 0 (zero errors).
2. **File Size Compliance:** 100% of files strictly comply with the $\le 150$ lines ceiling.
3. **Execution Ready:** To start the backend server, run `cd backend && npm start` or `npm run dev`.
