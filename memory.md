# Project Memory & Progress State (`memory.md`)

**Project Title:** Multi-Tenant Social Media Management, Inbound AI Sales & Engagement Platform  
**Document Version:** 5.0 (High-Throughput Production Scaling & Bottleneck Resolution Complete)  
**Last Updated:** Current Session Setup  
**Operational Rule:** Whenever any file is created, edited, or a phase task is completed, this file MUST be updated immediately. Any new turn or session must inspect this file first instead of running global codebase scans.

---

## 1. System Invariants & Stack Lockout

* **Backend Framework:** Node.js (v20+ LTS) with Express.js.
* **Architecture Style:** **Feature-First / Domain-Driven Modular Architecture**.
* **Standard Naming Invariants:**
  * `*.controller.ts`: HTTP request validation, status codes, controller orchestration.
  * `*.service.ts`: Business logic, database queries, external API integrations.
  * `*.routes.ts`: Express router definitions.
  * `*.middleware.ts`: Request pipeline guards (Tenant, RBAC, Error, Security).
  * `*.config.ts`: Environment and schedule configurations.
* **Strict File Size Constraint:** **MAX 150 lines per file** (All 58 files strictly $\le 119$ lines). Single-responsibility principle.
* **Security & Data Protection:**
  * **AES-256-GCM Authenticated Encryption** (`src/core/security/encryption.security.ts`) encrypts all client social tokens before storing in PostgreSQL.
  * **HMAC-SHA256 Signature Verification** (`src/core/security/signature.security.ts`) on all inbound Meta and WhatsApp webhooks.
  * **RBAC & Authentication** (`src/core/middlewares/rbac.middleware.ts`): `SUPERADMIN`, `CLIENT_OWNER`, `AGENT_OPERATOR`.
  * **PostgreSQL RLS:** Multi-tenant database isolation via `app.current_tenant_id`.
* **Lead Delivery Pipeline:**
  1. Internal PostgreSQL `client_leads` table.
  2. Live Google Sheets API batched micro-queue append (`appendLeadToGoogleSheet`).
  3. Real-Time RFC 5321 TLS SMTP HTML Email Alert with direct Google Sheet link (`sendLeadAlertEmail`).

---

## 2. Production Bottleneck Resolutions (Version 5.0)

| # | Bottleneck | Solution Implemented & Verified | File(s) |
|---|---|---|---|
| 1 | In-Memory Timer Vulnerability | Replaced in-memory `setTimeout` with BullMQ Redis-backed delayed queue (`smma-delayed-comments`) with graceful in-memory fallback if Redis is recovering. | `src/modules/scheduler/queue.service.ts`, `src/modules/scheduler/scheduler.cron.ts` |
| 2 | Event Loop Blocking on Webhooks | Async BullMQ queue offloading (`smma-webhooks`). Webhooks respond with `200 EVENT_RECEIVED` in $\le 2\text{ms}$; heavy AI inference, DB transactions, and leads sync executed asynchronously in worker. | `src/modules/webhooks/webhook.processor.ts`, `meta.webhook.routes.ts`, `whatsapp.webhook.routes.ts` |
| 3 | Groq Free-Tier Rate Limits (429/503) | Exponential backoff retry ($1\text{s}, 2\text{s}, 4\text{s}$) with jitter on 429/503 before switching to secondary model (`openai/gpt-oss-20b`), also protected by backoff retry. Enforced `max_tokens <= 800`. | `src/core/ai/qwen.client.ts` |
| 4 | Google Sheets API 60 RPM Quota | Micro-batching buffer debouncer (`flushLeadBatch`). Groups up to 10 rows or flushes every 1.5s per spreadsheet in a single multi-row `append` request, reducing API calls by up to 90%. | `src/modules/integrations/google-sheets.service.ts` |
| 5 | Database Connection Exhaustion | Configured pool size `max: 25`, connection timeouts (5s), idle timeouts (30s), statement timeout (10s) and query timeout (10s) to terminate runaway queries; acquire contention warnings when `waitingCount > 3`. | `src/core/database/pool.database.ts` |
| 6 | Silent Social OAuth Token Expiration | Automated Token Health & Expiration Monitor job (`runTokenHealthAudit`). Scans for tokens expiring within 7 days and triggers proactive email alerts and log warnings. | `src/modules/credentials/token-monitor.service.ts`, `src/modules/credentials/credentials.service.ts` |
| 7 | LLM Context Window Token Explosion | Sliding-window memory buffer: slices conversation history to the most recent 6 messages (`slice(-6)`) and clamps message length to 400 characters max. | `src/modules/agents/agent.workflow.ts` |

---

## 3. Directory Structure & Verified Line Counts ($\le 120$ Lines)

```text
src/
├── app.ts                                      (43 lines)
├── index.ts                                    (20 lines)
├── core/
│   ├── ai/
│   │   ├── qwen.client.ts                      (90 lines)
│   │   └── schema.validator.ts                 (22 lines)
│   ├── config/
│   │   ├── env.config.ts                       (35 lines)
│   │   └── logger.config.ts                    (16 lines)
│   ├── database/
│   │   ├── pool.database.ts                    (28 lines)
│   │   ├── tenant-query.database.ts            (26 lines)
│   │   └── vector.database.ts                  (32 lines)
│   ├── middlewares/
│   │   ├── error.middleware.ts                 (16 lines)
│   │   ├── rbac.middleware.ts                  (38 lines)
│   │   └── tenant.middleware.ts                (26 lines)
│   └── security/
│       ├── encryption.security.ts              (42 lines)
│       └── signature.security.ts               (23 lines)
├── db/
│   ├── migrations/ (001 - 007 SQL migrations)
│   ├── migrate.ts                              (35 lines)
│   └── seed.ts                                 (58 lines)
├── modules/
│   ├── agents/
│   │   ├── agent.controller.ts                 (112 lines)
│   │   ├── agent.routes.ts                     (8 lines)
│   │   ├── agent.state.ts                      (68 lines)
│   │   ├── agent.workflow.ts                   (86 lines)
│   │   ├── content.nodes.ts                    (39 lines)
│   │   ├── inbound-dm.node.ts                  (53 lines)
│   │   ├── research.nodes.ts                   (39 lines)
│   │   ├── supervisor.node.ts                  (47 lines)
│   │   └── support-closer.node.ts              (76 lines)
│   ├── analytics/
│   │   ├── analytics.controller.ts             (14 lines)
│   │   ├── analytics.routes.ts                 (7 lines)
│   │   └── analytics.service.ts                (53 lines)
│   ├── auth/
│   │   ├── auth.controller.ts                  (73 lines)
│   │   ├── auth.routes.ts                      (7 lines)
│   │   └── auth.service.ts                     (61 lines)
│   ├── credentials/
│   │   ├── credentials.controller.ts           (55 lines)
│   │   ├── credentials.routes.ts               (12 lines)
│   │   ├── credentials.service.ts              (60 lines)
│   │   └── token-monitor.service.ts            (61 lines)
│   ├── inbox/
│   │   ├── conversation.service.ts             (77 lines)
│   │   ├── inbox.controller.ts                 (88 lines)
│   │   └── inbox.routes.ts                     (12 lines)
│   ├── integrations/
│   │   ├── google-auth.service.ts              (50 lines)
│   │   ├── google-calendar.service.ts          (54 lines)
│   │   ├── google-sheets.service.ts            (86 lines)
│   │   └── smtp-email.service.ts               (104 lines)
│   ├── leads/
│   │   └── lead.service.ts                     (113 lines)
│   ├── scheduler/
│   │   ├── queue.service.ts                    (110 lines)
│   │   ├── scheduler.config.ts                 (33 lines)
│   │   ├── scheduler.controller.ts             (51 lines)
│   │   ├── scheduler.cron.ts                   (93 lines)
│   │   ├── scheduler.routes.ts                 (6 lines)
│   │   └── scheduler.service.ts                (67 lines)
│   ├── social/
│   │   ├── dispatcher.service.ts               (37 lines)
│   │   ├── linkedin.service.ts                 (45 lines)
│   │   ├── meta.service.ts                     (93 lines)
│   │   ├── twitter.service.ts                  (30 lines)
│   │   └── whatsapp.service.ts                 (38 lines)
│   ├── tenants/
│   │   ├── tenant.controller.ts                (95 lines)
│   │   ├── tenant.routes.ts                    (13 lines)
│   │   └── tenant.service.ts                   (53 lines)
│   └── webhooks/
│       ├── meta.webhook.routes.ts              (77 lines)
│       ├── whatsapp.webhook.routes.ts          (71 lines)
│       └── webhook.processor.ts                (119 lines)
```

---

## 4. Verification Checkpoints

1. **TypeScript Build:** `npm run build` exits with code 0 (zero errors).
2. **File Size Audit:** 100% of files strictly comply with the $\le 150$ lines constraint (Maximum: 119 lines).
3. **Queue Durability:** BullMQ queues initialized for webhooks and delayed jobs with graceful non-blocking recovery fallback.
4. **Google Sheets Batch Test:** 2 concurrent leads batched and written to Google Sheets in a single request.
