# Step-by-Step Engineering Execution Plan (`execution_phase.md`)

## Project: Multi-Tenant Social Media Management, Inbound AI Sales & Engagement Platform
**Document Version:** 7.0 (Pure Node.js / Express & Qwen 2.5 Edition)  
**Target Stack:** Node.js (v20+ LTS) + Express.js + Native `pg` Pool (RLS) + `ioredis` + `@qdrant/js-client-rest` + Direct Qwen 2.5 API + Zod  
**Strict Code Constraints:** Max 150 lines per file (modularize at 130 lines), zero-bloat whitelist only, native SQL, continuous `memory.md` synchronization.  
**Operational Strategy:** Phase-by-Phase Modular Execution. **Har phase ko complete aur verify kiye baghair aglay phase par nahi jana.**

---

## Execution Roadmap Overview

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Phase 0    │ ──> │   Phase 1    │ ──> │   Phase 2    │ ──> │   Phase 3    │
│  Setup &     │     │  Native pg   │     │  Redis       │     │  Quota &     │
│  Docker Env  │     │  Tenant RLS  │     │  Metering    │     │  Velocity    │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                       │
┌──────────────┐     ┌──────────────┐     ┌──────────────┐             │
│   Phase 7    │ <── │   Phase 6    │ <── │   Phase 5    │ <── ────────┘
│  Telegram    │     │  Social      │     │  Direct Qwen │     ┌──────────────┐
│  Control Bot │     │  Webhooks    │     │  10-Agents   │ <── │   Phase 4    │
└──────┬───────┘     └──────────────┘     └──────────────┘     │ Qdrant Vector│
       │                                                       │ KnowledgeBase│
       ▼                                                       └──────────────┘
┌──────────────┐
│   Phase 8    │
│  Production  │
│  Deployment  │
└──────────────┘
```

---

## Phase 0: Project Scaffolding, Whitelist Packages & Docker Setup

### Objective:
Node.js + Express repository structure setup karna with pure whitelisted packages, Dockerized local services (PostgreSQL, Redis, Qdrant), aur continuous `memory.md` logging.

### Step-by-Step Tasks:
1. **Package Setup (Approved Whitelist Only):**
   * Initialize npm project:
     ```bash
     npm init -y
     ```
   * Install strictly whitelisted runtime dependencies:
     ```bash
     npm install express pg ioredis zod dotenv @qdrant/js-client-rest telegraf pino
     ```
   * Install minimal dev dependencies (TypeScript & dev runtime):
     ```bash
     npm install -D typescript @types/node @types/express @types/pg ts-node nodemon rimraf pino-pretty
     ```
   * Configure `tsconfig.json` (strict mode, target ES2022).
2. **Environment Configuration (`.env.example` & `.env`):**
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smma_saas
   REDIS_URL=redis://localhost:6379
   QDRANT_URL=http://localhost:6333
   GROQ_API_KEY=gsk_...
   TELEGRAM_BOT_TOKEN=...
   TELEGRAM_ADMIN_CHAT_ID=...
   ENFORCE_SUBSCRIPTION_QUOTAS=false
   COMMERCIAL_SAAS_MODE=false
   ```
3. **Docker Compose Setup (`docker-compose.yml`):**
   * `postgres`: PostgreSQL 16 Alpine with persistent volume.
   * `redis`: Redis 7 Alpine with persistent volume.
   * `qdrant`: Qdrant OSS vector database (`image: qdrant/qdrant:latest`, port 6333).
4. **Express App Scaffolding (150-Line Limit Rule):**
   * `src/app.ts` (< 100 lines): Middleware, routes mounting, error handling.
   * `src/server.ts` (< 50 lines): Server bootstrap and graceful shutdown.
   * `src/config/logger.ts` (< 40 lines): Structured Pino logger.
5. **Update `memory.md`:** Log Phase 0 completion and record all created files.

### Verification Criteria:
- [ ] `docker compose up -d` boots PostgreSQL, Redis, and Qdrant without errors.
- [ ] `npm run dev` starts Express server on `http://localhost:3000`.
- [ ] `GET /health` returns `{ status: "ok" }`.
- [ ] Every created file is strictly under 150 lines.

---

## Phase 1: Database Architecture, Native `pg` Pool & Multi-Tenant RLS

### Objective:
PostgreSQL schema create karna using native parameterized SQL migrations, connection pooling via `pg`, aur tenant Row-Level Security (RLS) enforce karna.

### Step-by-Step Tasks:
1. **Native PostgreSQL Pool Module:**
   * `src/db/pool.ts` (< 60 lines): Singleton `pg.Pool` with connection timeout and error handling.
   * `src/db/tenantQuery.ts` (< 70 lines): Helper that acquires a client, executes `SET LOCAL app.current_tenant_id = $1`, runs the query, and releases the client.
2. **SQL Migration Scripts (`src/db/migrations/`):**
   * `001_create_extensions_and_plans.sql`: `uuid-ossp`, `plan_tier` enum, `subscription_plans`.
   * `002_create_tenants_and_invoices.sql`: `tenants`, `tenant_invoices`.
   * `003_create_meters_and_credentials.sql`: `tenant_usage_meters`, `tenant_metered_events`, `tenant_credentials`.
   * `004_create_conversations_and_rls.sql`: `tenant_conversations`, `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, isolation policies.
3. **AsyncLocalStorage Tenant Middleware:**
   * `src/middleware/tenantContext.ts` (< 60 lines): Resolves `x-tenant-id` from header/token and binds it to request context.
4. **Seed Script (`src/db/seed.ts`):**
   * Seeds default plans (`INTERNAL_UNLIMITED`, `FREE_STARTER`, `GROWTH_PRO`, `AGENCY_ENTERPRISE`).
   * Seeds the founding master agency tenant (`is_internal = true`).
5. **Update `memory.md`:** Log Phase 1 completion, database tables, and RLS policies.

### Verification Criteria:
- [ ] Migration runner executes all `.sql` files cleanly.
- [ ] Seed script executes and populates master agency tenant.
- [ ] RLS Isolation Test: Query under Tenant A context cannot see Tenant B's credentials or conversation rows.
- [ ] Every file strictly under 150 lines.

---

## Phase 2: Redis Client, Atomic Metering & Idempotency Engine

### Objective:
High-speed Redis 7 client (`ioredis`) setup karna for atomic usage counters (`INCR`), 48-hour webhook idempotency deduplication, and anti-ban throttling.

### Step-by-Step Tasks:
1. **Redis Client Singleton:**
   * `src/redis/client.ts` (< 50 lines): Singleton `ioredis` instance with reconnection strategy.
2. **Atomic Metering Service:**
   * `src/services/metering.service.ts` (< 110 lines):
     * `incrementUsage(tenantId, metricType)` using atomic `INCR tenant:{id}:usage:{metric}:{YYYY-MM}`.
     * `getMonthlyUsage(tenantId, metricType)` using Redis `GET`.
     * `syncToDatabase(tenantId)` persists Redis counters to PostgreSQL `tenant_usage_meters`.
3. **Webhook Idempotency Middleware:**
   * `src/middleware/idempotency.ts` (< 60 lines):
     * Checks `SET idempotency:{eventId} 1 EX 172800 NX` (48-hour TTL).
     * If key already exists, returns `HTTP 200 OK` immediately (prevents duplicate execution).
4. **Anti-Ban Outbound Throttler:**
   * `src/services/throttler.service.ts` (< 90 lines):
     * Enforces maximum 15 outbound messages per hour per social account using sliding window rate limiting.
5. **Update `memory.md`:** Log Phase 2 completion and Redis key schemas.

### Verification Criteria:
- [ ] Atomic `incrementUsage` correctly increments Redis key under concurrent calls.
- [ ] Sending duplicate event ID returns `200 OK` and aborts processing.
- [ ] Throttler blocks 16th message within a 1-hour window.
- [ ] Every file strictly under 150 lines.

---

## Phase 3: Pluggable Universal Agent API & CRM Integration Core

### Objective:
Agents ko channel-agnostic banana taake wo Meta/WhatsApp ke ilawa kisi bhi existing ya future CRM (GoHighLevel, HubSpot, custom CRM) se direct connect ho sakein. Pricing aur quota gating ko disabled/deferred mode par rakhna.

### Step-by-Step Tasks:
1. **Universal Ingress/Egress Zod Schemas:**
   * `src/schemas/universalAgent.schema.ts` (< 90 lines):
     * `UniversalAgentRequestSchema` (normalizes incoming messages from CRM or Social).
     * `UniversalAgentResponseSchema` (returns replyText, leadScore, suggestedStage, crmContactUpdates).
2. **Universal Agent REST Endpoint:**
   * `src/controllers/agentApi.controller.ts` (< 110 lines):
     * `POST /api/v1/agents/chat`: Enables any external CRM to send message history + current query and get back an instant intelligent response.
3. **CRM Lead Handoff & Webhook Dispatcher:**
   * `src/services/crmDispatcher.service.ts` (< 100 lines):
     * Automatically dispatches `LEAD_QUALIFIED` event with extracted contact details (Phone, Email, Tags) to `tenants.crm_webhook_url`.
4. **Update `memory.md`:** Log Phase 3 completion and CRM integration contracts.

### Verification Criteria:
- [ ] Direct `POST /api/v1/agents/chat` with mock CRM chat returns valid structured response and lead score.
- [ ] If prospect shares phone or email, `crmContactUpdates` correctly extracts them.
- [ ] Qualified lead triggers mock CRM webhook call.
- [ ] Every file strictly under 150 lines.

---

## Phase 4: Qdrant Vector Knowledge Base (RAG Module)

### Objective:
Tenant business FAQs, services, aur pricing docs ko dedicated Qdrant vector namespace me embed karna using `@qdrant/js-client-rest`.

### Step-by-Step Tasks:
1. **Qdrant Client & Collection Provisioner:**
   * `src/rag/qdrant.client.ts` (< 60 lines): Initializes Qdrant REST client.
   * `src/rag/collectionManager.ts` (< 80 lines): Creates collection `tenant_{tenant_id}_kb` with cosine distance if it doesn't exist.
2. **Document Ingestion & Chunking:**
   * `src/rag/documentChunker.ts` (< 90 lines): Splits text/FAQs into 500-token chunks with 50-token overlap.
   * `src/rag/embedder.ts` (< 70 lines): Generates vector embeddings via direct API call.
3. **Vector Search Service:**
   * `src/rag/knowledgeSearch.ts` (< 80 lines):
     * Queries `tenant_{tenant_id}_kb` collection.
     * Filters chunks with cosine similarity $\ge 0.72$. If score $< 0.72$, returns empty results (triggers human fallback).
4. **Update `memory.md`:** Log Phase 4 completion and Qdrant collection conventions.

### Verification Criteria:
- [ ] Upload sample tenant FAQ (e.g. "Dental cleaning costs $120").
- [ ] Querying "How much is cleaning?" returns chunk with score $> 0.80$.
- [ ] Querying "Do you sell car tires?" returns empty results (score $< 0.50$).
- [ ] Tenant A cannot search Tenant B's collection.
- [ ] Every file strictly under 150 lines.

---

## Phase 5: The 10-Agent Operational Engine (Qwen 2.5 Backbone)

### Objective:
All 10 specialized agents implement karna using direct HTTP calls to Qwen 2.5 API with strict Zod JSON output validation and auto-repair.

### Step-by-Step Tasks:
1. **Direct Qwen 2.5 API Client:**
   * `src/ai/qwenClient.ts` (< 90 lines): Direct `fetch` call to Groq / Ollama Qwen 2.5 endpoint with `response_format: { type: "json_object" }`.
2. **Schema Validator & Auto-Repair Engine:**
   * `src/ai/schemaValidator.ts` (< 80 lines): Validates raw LLM response with target Zod schema. If invalid, auto-retries once with error context injected.
3. **Implement All 10 Agent Handlers:**
   * `src/agents/agent10.supervisor.ts` (< 110 lines): Routes event to Agents #1–#9.
   * `src/agents/agent1.selfComment.ts` (< 80 lines): Generates value-add initial post comments.
   * `src/agents/agent2.researcher.ts` (< 90 lines): Public positioning and content gap analysis.
   * `src/agents/agent3.commentReply.ts` (< 80 lines): Public comment engagement & DM nudges.
   * `src/agents/agent4.analytics.ts` (< 90 lines): Weekly engagement digest reports.
   * `src/agents/agent5.trendPlanner.ts` (< 90 lines): 4-pillar daily post concepts.
   * `src/agents/agent6.dmHandler.ts` (< 90 lines): Inbound DM qualification under 30s.
   * `src/agents/agent7.competitorBot.ts` (< 90 lines): Thought leader public commentary.
   * `src/agents/agent8.publisher.ts` (< 90 lines): Platform-specific post formatting.
   * `src/agents/agent9.supportCloser.ts` (< 110 lines): RAG-grounded sales closer.
4. **Update `memory.md`:** Log Phase 5 completion and all agent modules.

### Verification Criteria:
- [ ] Simulated incoming DM correctly executes: Supervisor $\rightarrow$ RAG Search $\rightarrow$ Qwen 2.5 $\rightarrow$ Validated Zod JSON response.
- [ ] Malformed output auto-retries once and heals successfully.
- [ ] Out-of-bounds adversarial prompt flags `escalateToHuman = true`.
- [ ] Every file strictly under 150 lines.

---

## Phase 6: Inbound Social Webhook Listeners & Dispatchers

### Objective:
Meta Graph (Instagram & Facebook), WhatsApp Cloud API, LinkedIn, aur X (Twitter) ke real webhooks ko Express me connect karna.

### Step-by-Step Tasks:
1. **Meta Webhook Router (Instagram & Facebook):**
   * `src/routes/webhooks/meta.routes.ts` (< 100 lines):
     * `GET /webhooks/meta`: Verification challenge (`hub.challenge`).
     * `POST /webhooks/meta`: Signature verification (`X-Hub-Signature-256`) via native `crypto`.
2. **WhatsApp Cloud API Router:**
   * `src/routes/webhooks/whatsapp.routes.ts` (< 100 lines): Processes incoming 24-hour chats and interactive button taps.
3. **LinkedIn & X Event Routers:**
   * `src/routes/webhooks/linkedin.routes.ts` (< 90 lines): Page post comment webhooks.
   * `src/routes/webhooks/twitter.routes.ts` (< 90 lines): Account activity API webhook.
4. **Social API Dispatcher:**
   * `src/services/socialDispatcher.ts` (< 110 lines): Sends approved replies back to social platform APIs using tenant's credentials.
5. **Update `memory.md`:** Log Phase 6 completion and webhook routes.

### Verification Criteria:
- [ ] Meta webhook verification challenge returns `hub.challenge` with `200 OK`.
- [ ] Simulated Instagram DM payload routes to Agent #10 and dispatches reply.
- [ ] Every file strictly under 150 lines.

---

## Phase 7: Human-in-the-Loop Telegram Mobile Control Bot

### Objective:
`telegraf` bot banana jo mobile admin control center ke tor par kaam kare: instant high-stakes approvals, alerts, aur plan activations.

### Step-by-Step Tasks:
1. **Telegraf Bot Setup:**
   * `src/bot/telegramBot.ts` (< 100 lines): Initializes bot with secret token and admin chat ID restriction.
2. **Approval Card Dispatcher:**
   * `src/bot/approvalDispatcher.ts` (< 90 lines): Dispatches interactive markdown card with `[✅ Approve & Send]` and `[❌ Reject & Takeover]` buttons.
3. **Callback Query Handler:**
   * `src/bot/callbackHandler.ts` (< 100 lines):
     * `APPROVE:msgId`: Sends approved response to social platform API.
     * `REJECT:msgId`: Marks conversation as manual takeover (mutes bot for 7 days).
4. **Admin Mobile Commands:**
   * `src/bot/adminCommands.ts` (< 80 lines):
     * `/status`: Displays active tenants and server health.
     * `/approve_plan <invoice_id>`: Activates client's Pro plan directly from phone.
5. **Update `memory.md`:** Log Phase 7 completion and Telegram commands.

### Verification Criteria:
- [ ] High-stakes action triggers interactive card in Telegram group.
- [ ] Tapping `[✅ Approve & Send]` dispatches message to social platform.
- [ ] `/approve_plan <id>` activates tenant's plan in PostgreSQL.
- [ ] Every file strictly under 150 lines.

---

## Phase 8: Production Hardening & Deployment

### Objective:
Production environment hardening, health check endpoints, multi-stage Dockerfile, aur automated database backup cron.

### Step-by-Step Tasks:
1. **Health Check Module:**
   * `src/routes/health.routes.ts` (< 70 lines): `GET /health` verifies PostgreSQL pool, Redis client, and Qdrant connectivity.
2. **Production Multi-Stage Dockerfile:**
   * Node.js 20 Alpine, strips devDependencies, non-root user.
3. **Caddy / Nginx Reverse Proxy with Auto SSL:**
   * Caddyfile configuration for automatic Let's Encrypt certificates.
4. **Automated Database Backup Script:**
   * Shell cron script executing `pg_dump` compressed to S3/R2.
5. **Update `memory.md`:** Log Phase 8 completion and production deployment details.

### Verification Criteria:
- [ ] `GET /health` returns `{ status: "ok", postgres: "up", redis: "up", qdrant: "up" }`.
- [ ] Container boots cleanly in production Docker environment.
- [ ] Every file strictly under 150 lines.

---

## Phase Progress Tracking Sheet

| Phase | Description | Status | Completion Date |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Project Scaffolding & Local Infrastructure | ⏳ Pending | — |
| **Phase 1** | Native `pg` Pool & Multi-Tenant RLS | ⏳ Pending | — |
| **Phase 2** | Redis Atomic Metering & Throttling | ⏳ Pending | — |
| **Phase 3** | Quota Engine, Burn-Rate & Invoicing | ⏳ Pending | — |
| **Phase 4** | Qdrant Vector Knowledge Base (RAG) | ⏳ Pending | — |
| **Phase 5** | The 10-Agent Engine (Qwen 2.5 Backbone) | ⏳ Pending | — |
| **Phase 6** | Social Webhooks & Dispatchers | ⏳ Pending | — |
| **Phase 7** | Telegram Mobile Control Bot | ⏳ Pending | — |
| **Phase 8** | Production Hardening & Deployment | ⏳ Pending | — |
