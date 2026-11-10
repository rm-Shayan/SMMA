# Project Memory & Progress State (`memory.md`)

**Project Title:** Multi-Tenant Social Media Management, Inbound AI Sales & Engagement Platform  
**Document Version:** 3.0 (Enterprise Multi-Tenant RBAC, Unified Inbox & 40-Company Scale Complete)  
**Last Updated:** Current Session Setup  
**Operational Rule:** Whenever any file is created, edited, or a phase task is completed, this file MUST be updated immediately. Any new turn or session must inspect this file first instead of running global codebase scans.

---

## 1. System Invariants & Stack Lockout

* **Backend Framework:** Node.js (v20+ LTS) with Express.js.
* **Entry Point:** `src/index.ts` -> compiled to `dist/index.js`.
* **Dependency Whitelist (ABSOLUTE FREEZE):**
  * `express`, `pg`, `ioredis`, `bullmq`, `@langchain/langgraph`, `@langchain/core`, `zod`, `dotenv`, `@qdrant/js-client-rest`, `telegraf`, `pino`, `crypto`, `tls`.
  * **Strict Bans:** NO NestJS, NO Prisma/TypeORM, NO heavy UI libraries.
* **File Size Constraint:** **MAX 150 lines per file** (All 45 files strictly <= 116 lines). Modularize at 130 lines. Single-responsibility principle.
* **Multi-Tenant RBAC Architecture (30-40 Companies Scale):**
  * Roles: `SUPERADMIN` (Platform Owner / Master Agency), `CLIENT_OWNER` (The Boss / Company Owner), `AGENT_OPERATOR` (Staff / Support Rep).
  * RLS Isolation: PostgreSQL Row-Level Security via `SET LOCAL app.current_tenant_id = '...'` enforces strict data isolation between companies.
  * `SUPERADMIN` can oversee all 30-40 tenants, view global meters, and switch tenant context via `x-tenant-id`.
* **Multi-Channel Social Credentials & Unified Inbox:**
  * `POST /api/v1/credentials` connects WhatsApp Cloud, Instagram Graph, Facebook Page, LinkedIn v2, and X (Twitter) per tenant.
  * `GET /api/v1/inbox/conversations` & `POST /api/v1/inbox/conversations/:id/reply` manage unified DMs/comments across platforms with AI or human operator overrides.
* **Leads Delivery Pipeline:**
  1. Internal PostgreSQL `client_leads` table.
  2. Live Google Sheets API row append (tenant's sheet or master agency fallback).
  3. Real-Time RFC 5321 TLS SMTP HTML Email Alert with direct Google Sheet link.

---

## 2. File Registry & Purpose

| File Path | Description | Status | Line Count |
| :--- | :--- | :--- | :--- |
| `prd_v6_0.md` | Master Product Requirement Document (PRD v7.2) | ✅ Approved | 282 lines |
| `agent.md` | Master AI Agent Governance & Engineering Rules | ✅ Approved | 318 lines |
| `execution_phase.md` | 9-Phase Step-by-Step Roadmap | ✅ Approved | 306 lines |
| `memory.md` | Live Single Source of Truth for Progress & Decisions | ✅ Active | — |
| `package.json` | Whitelisted dependencies and scripts | ✅ Validated | 39 lines |
| `tsconfig.json` | TypeScript configuration (strict mode, outDir dist) | ✅ Validated | 16 lines |
| `docker-compose.yml` | PostgreSQL 16, Redis 7, Qdrant OSS containers | ✅ Validated | 34 lines |
| `.env` | Environment configuration (Live DB, Redis, Qdrant, Groq, Sheets & Verified SMTP) | ✅ Configured | 33 lines |
| `google-credentials.json` | Google Service Account Private Key and Client Config | ✅ Active | — |
| `src/config/env.ts` | Zod-validated environment config loader | ✅ Validated | 25 lines |
| `src/config/logger.ts` | Pino structured JSON logging module | ✅ Validated | 16 lines |
| `src/app.ts` | Express application instance mounting Agents, Posts, Tenants, Auth, Credentials, Inbox & Webhooks | ✅ Validated | 46 lines |
| `src/index.ts` | Application entry point and graceful shutdown bootstrap | ✅ Validated | 19 lines |
| `src/services/auth/authService.ts` | PBKDF2 password hashing, HMAC-SHA256 JWT tokens & user login | ✅ Validated | 61 lines |
| `src/middleware/rbacMiddleware.ts` | Bearer token verification & role enforcement (SUPERADMIN, CLIENT_OWNER, AGENT_OPERATOR) | ✅ Validated | 39 lines |
| `src/controllers/auth.controller.ts` | Login, user creation & session endpoints | ✅ Validated | 64 lines |
| `src/routes/auth.routes.ts` | REST routes for /api/v1/auth | ✅ Validated | 7 lines |
| `src/controllers/tenant.controller.ts` | Full Tenant CRUD (Register, List, GetById, Update, Deactivate) | ✅ Validated | 95 lines |
| `src/routes/tenant.routes.ts` | REST routes for /api/v1/tenants | ✅ Validated | 17 lines |
| `src/controllers/credentials.controller.ts` | Social media account connection (WhatsApp, IG, FB, LinkedIn, X) | ✅ Validated | 61 lines |
| `src/routes/credentials.routes.ts` | REST routes for /api/v1/credentials | ✅ Validated | 12 lines |
| `src/controllers/inbox.controller.ts` | Unified multi-platform inbox viewer, manual reply dispatcher & escalation | ✅ Validated | 81 lines |
| `src/routes/inbox.routes.ts` | REST routes for /api/v1/inbox | ✅ Validated | 12 lines |
| `src/services/email/smtpService.ts` | Pure Node.js TLS SMTP lead alert email dispatcher | ✅ Tested Live | 109 lines |
| `src/middleware/tenantContext.ts` | Express middleware parsing `x-tenant-id` header | ✅ Validated | 26 lines |
| `src/db/pool.ts` | Native PostgreSQL connection pool singleton | ✅ Validated | 23 lines |
| `src/db/tenantQuery.ts` | RLS isolation query execution | ✅ Validated | 39 lines |
| `src/db/migrations/001-006` | SQL migrations (tenants, meters, conversations, scheduled jobs, leads, integrations, users & RBAC) | ✅ Configured | ~190 lines |
| `src/db/migrate.ts` | Automated runner for SQL migrations | ✅ Validated | 35 lines |
| `src/db/seed.ts` | Seed script for subscription plans and master internal agency | ✅ Seeded | 48 lines |
| `src/ai/qwenClient.ts` | Direct Groq Cloud API client with automatic model fallback & token safeguards | ✅ Tested Live | 67 lines |
| `src/ai/schemaValidator.ts` | Safe JSON parser with auto-repair and Zod validation | ✅ Validated | 40 lines |
| `src/rag/knowledgeBase.ts` | Qdrant vector database tenant-isolated KB & cosine search | ✅ Verified | 39 lines |
| `src/agents/state/agentState.ts` | Universal LangGraph AgentStateAnnotation with scalar reducers & bookingCalendarUrl | ✅ Validated | 68 lines |
| `src/agents/nodes/supervisorNode.ts` | Master router (#10) with direct-agent bypass | ✅ Validated | 50 lines |
| `src/agents/nodes/inboundDmNode.ts` | Inbound DM lead qualification & dynamic calendar booking link (#6) | ✅ Tested Live | 58 lines |
| `src/agents/nodes/supportCloserNode.ts` | Sales closer, CRM stage & dynamic calendar scheduling (#9) | ✅ Tested Live | 63 lines |
| `src/agents/nodes/contentNodes.ts` | Self-Comment (#1), Trend Planner (#5), Publisher (#8) | ✅ Tested Live | 48 lines |
| `src/agents/nodes/researchAndCommentNodes.ts` | Researcher (#2), Comment Reply (#3), Analytics (#4), Competitor (#7) | ✅ Tested Live | 59 lines |
| `src/agents/agentWorkflow.ts` | LangGraph StateGraph with auto tenant integration resolution | ✅ Tested Live | 79 lines |
| `src/controllers/agent.controller.ts` | Inbound chat, direct agent execution, lead viewer API | ✅ Tested Live | 116 lines |
| `src/routes/agent.routes.ts` | REST endpoints for /chat, /direct/:agentName, /leads | ✅ Validated | 9 lines |
| `src/services/tenant/tenantSettingsService.ts` | Per-client Google Sheet & Calendar resolution with agency fallback | ✅ Tested Live | 73 lines |
| `src/services/google/googleAuth.ts` | Pure Node.js RS256 JWT Token generator for Google APIs | ✅ Tested Live | 53 lines |
| `src/services/google/googleSheetsService.ts` | Direct Google Sheets API v4 row appender with override support | ✅ Tested Live | 46 lines |
| `src/services/google/googleCalendarService.ts` | Google Calendar API v3 event creator with Google Meet links | ✅ Validated | 56 lines |
| `src/services/leads/googleSheetsService.ts` | Google Sheets webhook dispatcher | ✅ Tested Live | 41 lines |
| `src/services/leads/leadService.ts` | Multi-destination lead saver (DB + Google Sheet + Real-Time Email Alert) | ✅ Tested Live | 91 lines |
| `src/services/scheduler/timingConfig.ts` | Peak-hour platform schedule & getNextOptimalSlot() | ✅ Tested Live | 46 lines |
| `src/services/scheduler/postSchedulerService.ts` | Database-backed scheduled posts management | ✅ Tested Live | 66 lines |
| `src/services/scheduler/cronEngine.ts` | 60-second autonomous tick: dispatches posts, triggers self-comments | ✅ Validated | 78 lines |

---

## 3. Verified Live Features

1. **Full Tenant CRUD:** Create, List, View, Update, Deactivate for 30-40+ companies.
2. **Platform Roles & RBAC:** `SUPERADMIN` (Platform Owner / Agency), `CLIENT_OWNER` (Company Boss), `AGENT_OPERATOR` (Support Staff).
3. **Multi-Channel Social Credentials:** Connects WhatsApp, IG, FB, LinkedIn, Twitter per client.
4. **Unified Multi-Platform Inbox:** Real-time conversation tracking with human-in-the-loop manual reply dispatching.
5. **Multi-Destination Leads Pipeline:** PostgreSQL DB -> Google Sheet -> Real-Time SMTP Email Alert with clickable sheet button.
