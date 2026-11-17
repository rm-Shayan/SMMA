# 🛡️ Styre-BOT — Developer & Agent System Directives (`agent.md`)

> **Primary Operating Principles, Team Role Definition, and Architectural Standards.**

---

## 👤 Developer Profile & Team Role Dynamics

> [!IMPORTANT]
> **Core Context:** The developer working in this repository is exclusively a **Backend Engineer** working within a cross-functional engineering team.
> - **Frontend is NOT the developer's responsibility.** Dedicated frontend engineers handle production client apps.
> - The AI assistant must **never** expect the developer to design, build, or debug complex client-side UI, styling, or frontend build setups.
> - For `apps/web`, the AI assistant should only scaffold **clean, minimal dummy/mock screens** necessary for testing APIs, demoing agent workflows, or verifying end-to-end flows.
> - **Primary Engineering Focus:** 100% of the focus, architectural rigor, and engineering effort must be directed toward the **Backend** (Node.js/TypeScript APIs, BullMQ workers, PostgreSQL database schemas, vector search, Redis caching, agent state machines, rate-limiters, and external connectors).

---

## 🏛️ Code Quality, Modularity & Scalability Standards

1. **Clean Code & Enterprise Architecture:**
   - Code must be production-ready, clean, modular, and built for massive horizontal scaling.
   - Avoid monolithic files or spaghetti logic. Adhere strictly to Single Responsibility Principle (SRP) and Separation of Concerns (SoC).
   - Business logic must reside in service classes; controllers only handle HTTP request/response mapping and validation.

2. **Strict TypeScript & Modern Standards:**
   - Every module must utilize modern ES2022+ features, strict typing, and proper TS path aliases.
   - **Zero `any` Policy:** Strict typing with Zod schemas for runtime request/response and agent payload validation.
   - Centralize shared configs via `@styre/tsconfig`.

3. **Latest Stable Technologies:**
   - **Node.js:** v20+ with ES modules / TypeScript 5.7+
   - **Frameworks:** Express / Fastify / Node for backend APIs; Next.js 14+ (App Router) strictly for minimal dummy testing screens.
   - **Databases:** PostgreSQL 16 + `pgvector` with connection pooling (`pg`).
   - **Distributed Queue:** Redis 7 + `bullmq` for asynchronous orchestration.
   - **Vector Engine:** Qdrant / `pgvector` for enterprise RAG document retrieval.

---

## 🔐 Non-Negotiable Backend Invariants

### 1. Multi-Tenancy & Tenant Isolation
* **Day-1 Principle:** Every single database table (except global master metadata) must include `company_id`.
* Every SQL query executed against business data must filter by `company_id`.
* PostgreSQL Row-Level Security (RLS) is active as a second defense line.
* Cross-tenant data leakage is considered a critical P0 security failure.

### 2. Double-Entry Append-Only Credit Ledger
* **Never mutate or update credit balances directly.**
* The `balance` field in `credit_wallets` is strictly a cached representation of the `credit_transactions` ledger table.
* Transactions must follow the immutable flow: `purchase` $\rightarrow$ `allocate` $\rightarrow$ `reserve` (pre-execution lock) $\rightarrow$ `consume` (post-execution deduction) or `release` (refund on failure).
* LLM token costs in exact USD must be logged in `agent_runs.cost_usd` for margin analytics.

### 3. Anti-Ban Social Outbox & Human-Like Pacing Engine
* **Decoupled Drafting and Sending:** Agents compose messages in parallel, but dispatching is strictly serial and throttled.
* **Never make direct synchronous outbound API calls** to Meta (Facebook/Instagram), LinkedIn, or cold email channels.
* Outbound actions must be enqueued into `outbox_jobs`:
  * **Per-Account Concurrency:** Strictly 1.
  * **Randomized Jitter:** 45 seconds to 3 minutes between consecutive dispatches.
  * **Typing Speed Delays:** +10 to 40 seconds scaled to message length.
  * **Safety Caps:** Max 20 actions/hour and 150 actions/day per connected account.
  * **Auto-Throttling:** On HTTP 429 / Action Blocked, pause the account outbox (30 min $\rightarrow$ 2 hr $\rightarrow$ admin alert).

### 4. Zero Plaintext Secrets (KMS Encryption)
* Any database column ending in `_enc` (e.g., `token_enc`, `config_enc`) must be encrypted at rest using AES-256-GCM.
* OAuth access tokens, refresh tokens, and SMTP credentials must never appear in logs or plaintext DB dumps.

### 5. Deterministic Idempotency
* Every outward action (email sent, post published, comment reply) must carry a deterministic `idempotency_key` based on `(company_id, platform, target_id, run_id)`.
* Retried BullMQ jobs must never duplicate customer-facing messages.

### 6. Supervisor Orchestration Pattern
* All 12 agents must inherit from `BaseAgent` located in `@packages/agent-core`.
* **Agent #12 (Supervisor)** acts as the orchestrator: it breaks down natural language goals, verifies credit availability, creates child `agent_runs`, and manages execution queues.
* Supervisor never executes external side-effects directly; it delegates exclusively to specialized child agents.

---

## 📁 Monorepo Structure & Ownership Map

```text
Styre-BOT/
├── apps/
│   ├── api/                    # [BACKEND] Core REST API server, Auth, RBAC, Webhooks
│   ├── worker/                 # [BACKEND] BullMQ distributed queue workers & outbox pacer
│   └── web/                    # [DUMMY UI] Minimal Next.js testing screens (for demo only)
├── packages/
│   ├── db/                     # [BACKEND] Postgres pool, migrations, queries (ERD.sql source)
│   ├── agent-core/             # [BACKEND] BaseAgent class, Tool Registry, Credit Guard
│   ├── connectors/             # [BACKEND] Gmail, Outlook, SMTP, Meta, LinkedIn, ERP adapters
│   ├── llm/                    # [BACKEND] LLM providers (Qwen/Claude), token costing
│   └── tsconfig/               # Shared TypeScript configurations
├── agents/                     # [BACKEND] 12 Independent Agent Plugins
│   ├── 01-own-post-engager/
│   ├── 02-competitor-researcher/
│   ├── 03-comment-responder/
│   ├── 04-analytics/
│   ├── 05-daily-brief/
│   ├── 06-outreach/
│   ├── 07-competitor-engager/
│   ├── 08-publisher/
│   ├── 09-inbox-responder/
│   ├── 10-trainee-sop/
│   ├── 11-company-ops/
│   └── 12-supervisor/
└── docs/
    ├── prd.md                  # Comprehensive Product Requirements Document
    └── ERD.sql                 # Production Database Schema & Single Source of Truth
```

### Standard Agent Plugin Convention
Har agent folder (`agents/XX-...`) must implement:
* `agent.ts`: Extends `BaseAgent` (`plan()`, `run()`, `estimateCredits()`).
* `tools.ts`: Whitelisted execution tools strictly restricted to this agent.
* `prompts/`: System prompts with explicit versioning (`v1.0.0.ts`).
* `schema.ts`: Zod validation schemas for input/output payloads.
* `agent.test.ts`: Unit/integration tests with mocked connectors.
* `README.md`: Agent documentation and operational specifications.

---

## ⚙️ Engineering Directives Summary for AI Assistant

1. **Focus on Backend Excellence:** When asked to implement features, prioritize bulletproof Node.js/TypeScript services, controllers, queues, database queries, and test coverage.
2. **Handle Dummy Frontend Autonomously:** For any required frontend parts, build simple, clean Next.js mock pages in `apps/web` with minimal friction and no burden on the backend user.
3. **Reference Single Sources of Truth:**
   - Database schemas $\rightarrow$ **[`ERD.sql`](file:///d:/saas/Styre-BOT/ERD.sql)**
   - Product requirements $\rightarrow$ **[`prd.md`](file:///d:/saas/Styre-BOT/prd.md)**
4. **Resilience & Graceful Failures:** Ensure all async operations have structured error logging (Pino), dead-letter queues (BullMQ), and descriptive error responses.

