# Styre-BOT — Complete API & Roles Documentation

## 1. Executive Summary
- **Architecture:** Modular Monolith (FastAPI + SQLAlchemy + PostgreSQL RLS + Redis Pub/Sub)
- **Total Registered Endpoints:** **157 Unique Paths / 183 HTTP Operations**
- **Real-Time WebSockets:** **4 Dedicated Topic Streams**
- **File & Line Standard:** All Python files strictly **< 140 lines** (Single Responsibility Principle)
- **Storage Driver:** Unified driver supporting local storage (`storage/{company_id}/`), Cloudflare R2, and AWS S3 with zero code change.
- **Stripe Integration:** Production Stripe Checkout + Webhook with instant environment bypass toggle (`ENABLE_STRIPE=false`).

---

## 2. Real-Time WebSockets & Streaming Architecture

| Channel / Topic | URL | Protocol | Purpose |
|---|---|---|---|
| **Master Stream** | `/api/v1/ws/{company_id}?token={jwt}` | WebSocket | All real-time tenant events (outbox, agents, approvals) |
| **Agent Executions** | `/api/v1/ws/agents/{company_id}?token={jwt}` | WebSocket | Live agent planning, token counters, plan step statuses |
| **Copilot Chat** | `/api/v1/ws/copilot/{company_id}?token={jwt}` | WebSocket | Bi-directional conversational chat with master assistant |
| **Notifications** | `/api/v1/ws/notifications/{company_id}?token={jwt}` | WebSocket | Urgent alerts, approval requests, credit limit warnings |
| **Agent SSE Stream** | `/api/v1/agents/{agent_id}/stream` | SSE (HTTP/2) | Server-Sent Events token & progress stream for agent run |
| **Copilot SSE Stream**| `/api/v1/orchestration/copilot/chat/stream` | SSE (HTTP/2) | Live word-by-word LLM token streaming |

---

## 3. Roles & Permissions Hierarchy (PRD Section 2)

### A. Super Admin (Platform Owner) — 26 Endpoints
1. `GET /api/v1/admin/companies` — List all onboarded tenant organizations
2. `POST /api/v1/admin/companies` — Onboard new company
3. `PATCH /api/v1/admin/companies/{company_id}` — Update company status & tier
4. `GET /api/v1/admin/tenants` & `POST /api/v1/admin/tenants` — Global tenant management
5. `POST /api/v1/admin/impersonate` — Impersonate any tenant organization for support
6. `GET /api/v1/admin/metrics` — Global platform metrics & throughput
7. `GET /api/v1/admin/token-usage` — LLM token costs & prompt burn across tenants
8. `GET /api/v1/admin/audit-logs` — Master platform-wide security audit trail
9. `GET /api/v1/admin/credits/overview` — Total platform credits minted, reserved, and spent
10. `POST /api/v1/admin/credits/companies/{company_id}/grant` — Direct Super Admin credit grant
11. `GET /api/v1/admin/credits/rates` & `POST /api/v1/admin/credits/rates` — Credit consumption rates per action
12. `GET /api/v1/admin/credits/ledger` — Master credit ledger across all companies
13. `GET /api/v1/admin/system/health-deep` — Live connectivity check: DB pool, S3/R2, Groq LLM
14. `GET /api/v1/admin/system/queues` — Outbox pacing queues status (`queued`, `sending`, `failed`)
15. `POST /api/v1/admin/system/queues/retry-failed` — 1-click global failed jobs retry
16. `POST /api/v1/admin/system/maintenance-mode` — Global platform maintenance mode toggle
17. `GET /api/v1/admin/billing/revenue` — Total credit sales volume & estimated USD revenue
18. `GET /api/v1/admin/billing/invoices` — Global tenant wallets & invoice registry
19. `POST /api/v1/admin/billing/companies/{company_id}/subscription` — Upgrade/downgrade tenant tier
20. `POST /api/v1/admin/governance/companies/{company_id}/suspend` — Instant tenant freeze with WebSocket alert
21. `POST /api/v1/admin/governance/companies/{company_id}/reactivate` — Unfreeze suspended tenant
22. `PUT /api/v1/admin/governance/companies/{company_id}/feature-flags` — Lock/unlock beta features per tenant
23. `POST /api/v1/admin/governance/broadcast` — Real-time announcement blast to all active dashboards
24. `GET /api/v1/admin/governance/agents/stats` — 12-agent leaderboard by popularity and token usage

---

### B. Company Admin (Organization Owner) — 25+ Endpoints
1. `GET /api/v1/company/profile` & `PATCH /api/v1/company/profile` — Organization profile & default language
2. `GET /api/v1/company/profile/branding` & `PUT /api/v1/company/profile/branding` — Custom brand kit (colors, fonts, email signature)
3. `GET /api/v1/company/teams` & `POST /api/v1/company/teams` — Department & team structure creation
4. `POST /api/v1/company/teams/assign` — Assign employee to a department team
5. `GET /api/v1/company/quotas` — View employee monthly credit quotas & balance
6. `POST /api/v1/company/quotas` — Set monthly auto-refresh credit allowance for employee
7. `POST /api/v1/company/quotas/reclaim-unused` — Month-end unspent employee credits reclamation
8. `GET /api/v1/company/security/connectors-health` — Connected Meta/LinkedIn/Email health & warmup stage
9. `PATCH /api/v1/company/security/connectors/{account_id}/limits` — Daily sending caps & allowed work hours
10. `GET /api/v1/company/security/audit-trail` — Organization-level employee activity history
11. `PUT /api/v1/company/security/approval-policy` — Manager approval threshold rules
12. `GET /api/v1/users` & `POST /api/v1/users` — Employee onboarding & management
13. `PATCH /api/v1/users/{user_id}` & `DELETE /api/v1/users/{user_id}` — User updates & offboarding
14. `POST /api/v1/users/{user_id}/agent-access` — Grant employee access to specific AI agents
15. `DELETE /api/v1/users/{user_id}/agent-access/{agent_id}` — Revoke employee agent access
16. `POST /api/v1/credits/checkout-session` — Purchase credits via Stripe (or direct grant if `ENABLE_STRIPE=false`)
17. `GET /api/v1/credits/balance` & `GET /api/v1/credits/wallets` — Company wallet status
18. `POST /api/v1/credits/allocate` & `POST /api/v1/credits/revoke` — Allocate credits from company wallet
19. `GET /api/v1/credits/ledger/export` — Download company credit transaction ledger as CSV

---

### C. Manager (Department Lead / Team Supervisor) — 10 Endpoints
1. `GET /api/v1/manager/team/members` — Team members directory and activity
2. `GET /api/v1/manager/team/credits` — Team credit balances, consumption & reserved limits
3. `POST /api/v1/manager/team/credits/allocate` — Manager delegating credits to team member
4. `POST /api/v1/manager/team/credits/revoke` — Revoking credits back to manager balance
5. `GET /api/v1/manager/approvals/pending` — Pending posts, emails, and agent approvals queue
6. `POST /api/v1/manager/approvals/{approval_id}/review` — Approve or reject with review note + WebSocket notification
7. `GET /api/v1/manager/oversight/campaigns` — Team-specific active campaigns
8. `POST /api/v1/manager/oversight/campaigns/{campaign_id}/pause` — Emergency pause runaway campaign
9. `GET /api/v1/manager/oversight/analytics/summary` — Team scorecard: posts sent, agent runs, leads captured
10. `POST /api/v1/manager/oversight/agent-override` — Lock employee agent execution to draft-only mode

---

### D. Employee (Operator / Executive / Intern) — 9 Endpoints
1. `GET /api/v1/employee/overview/dashboard` — Personal dashboard: available credits, pending drafts, published posts
2. `GET /api/v1/employee/overview/wallet` — Personal credit balance and reserved status
3. `POST /api/v1/employee/overview/credits/request` — Request credit top-up from manager
4. `GET /api/v1/employee/work/connectors` — Personal connected work accounts (personal email/LinkedIn)
5. `GET /api/v1/employee/work/drafts` — Personal drafts submitted and awaiting review
6. `POST /api/v1/employee/work/submit-approval` — Submit post/email/campaign for manager approval
7. `GET /api/v1/employee/learning/quizzes` — Training SOP quizzes generated by Trainee Agent
8. `POST /api/v1/employee/learning/quizzes/{quiz_id}/submit` — Submit quiz answers for automated AI grading
9. `GET /api/v1/employee/learning/activity-log` — Personal action audit log

---

## 4. The 12 AI Agents & Core Functional Modules

### 12 Specialized Agents (`/api/v1/agents`)
- **Agent #1 (Own-Post Engager):** Post comments for conversation starting.
- **Agent #2 (Competitor Researcher):** Research competitor content, pricing, and offers.
- **Agent #3 (Comment Responder):** Smart FAQ/knowledge-based comment responder.
- **Agent #4 (Analytics):** Platform metrics, token consumption, and campaign ROI.
- **Agent #5 (Daily Brief):** Daily morning action plan generator.
- **Agent #6 (Outreach DM/Email):** Cold lead outreach with personalized follow-up sequences.
- **Agent #7 (Competitor Engager):** High-value competitor post comments for lead acquisition.
- **Agent #8 (Publisher & Distributor):** Content calendar creator, scheduler, and publisher.
- **Agent #9 (Inbox Responder):** Omnichannel email & DM inbox triage & draft generator.
- **Agent #10 (Trainee & SOP Agent):** Internal team SOP trainer, quiz generator & evaluator.
- **Agent #11 (Company Ops Agent):** RAG internal knowledge engine and operational doc answers.
- **Agent #12 (Supervisor):** Master orchestrator managing agents, workflows, and credit limits.

### Unified Omnichannel Inbox (`/api/v1/inbox`)
- `GET /api/v1/inbox/threads` — Unified inbox across Gmail, Outlook, LinkedIn, and Meta
- `GET /api/v1/inbox/threads/{id}/messages` — Message conversation history
- `POST /api/v1/inbox/threads/{id}/ai-reply` — Context-aware AI draft response (Roman Urdu & English)
- `POST /api/v1/inbox/threads/{id}/reply` — Dispatch reply through outbox queue

### Multi-Agent Workflows (`/api/v1/workflows`)
- `POST /api/v1/workflows` — Define multi-agent pipeline
- `POST /api/v1/workflows/run-pipeline` — 1-click execution: Competitor Research $\to$ Content Writing $\to$ Media Engine Graphic $\to$ Approval

### Neural Media Generation (`/api/v1/media`)
- `POST /api/v1/media/image` — High-res marketing visual generation via Flux neural engine
- `POST /api/v1/media/voiceover` — Bilingual audio synthesis via Edge-TTS
- `POST /api/v1/media/video` — 1080p MP4 motion video rendering with image + voiceover sync
- `GET /api/v1/media/assets` — Storage assets registry

### Contacts & Leads Directory (`/api/v1/contacts`)
- `GET /api/v1/contacts` & `GET /api/v1/contacts/{id}` — Lead directory with paginated query
- `PATCH /api/v1/contacts/{id}` & `DELETE /api/v1/contacts/{id}` — Lead updates & deletions
- `GET /api/v1/contacts/export` — Instant CSV export of contacts

### Bot & External Connectors (`/api/v1/approvals-bot`)
- `POST /api/v1/telegram-webhook` — Telegram/WhatsApp approval callback receiver (`[Approve]` / `[Reject]`)
- `POST /api/v1/notify-manager` — Push approval alert to manager's connected chat app

---

## 5. Postman & API Client Integration
- **Postman Collection Location:** `docs/Styre-BOT.postman_collection.json`
- **Total Requests Included:** **183 endpoints organized into 30 folders**
- **Import Instructions:** Open Postman $\to$ Click **Import** $\to$ Select `docs/Styre-BOT.postman_collection.json` $\to$ Set environment variable `baseUrl = http://localhost:8000` and `token = <your_jwt>`.

