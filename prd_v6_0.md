# Enterprise Product Requirement Document (PRD v13.0)

## Project Title: Multi-Tenant Autonomous AI Agent Engine & Social / CRM / Operations Platform
**Document Version:** 13.0 (Enterprise Multi-Tenant Autonomous Operating System)  
**Target Architecture:** Multi-Tenant Autonomous Agent Brain as a Service (Full Execution Engine)  
**Backend Runtime:** **Node.js (v20+ LTS)** with **Express.js (Feature-First Modular Architecture)**  
**Backend Root:** `backend/`  
**Core LLM Model:** **Qwen 2.5 (32B / 72B)** via Groq Cloud API (Ultra-fast inference, exponential backoff retry)  
**Strict Codebase Rule:** **MAX 150 lines per file** across all TypeScript modules.

---

## 1. System Vision & High-Level Capabilities

The platform operates as a **Full Multi-Agent Autonomous Agency Brain**, strictly categorized into two operational domains:
1. **External / Outbound (Public-Facing):** Facing public clients, prospects, social media audiences, and competitors.
2. **Internal / Operations (Company-Facing):** Facing company owners, managers, interns, and internal workflows.

### Universal 12 Specialized AI Agents:

#### A. External / Public-Facing Agents (Strictly Zero-Tool Exposure to Internal Operations):
1. **Agent #1 (Algorithmic Reach Booster):** BullMQ 60s delayed first comment on published posts.
2. **Agent #2 (Viral Trend & Hook Architect):** Daily morning trend intelligence and hook generation.
3. **Agent #3 (Competitor Growth Hijack):** High-authority value comments on target competitor handles.
4. **Agent #4 (Omnichannel Publisher):** Character limit & formatting specialist for Instagram, LinkedIn, and Twitter.
5. **Agent #5 (Comment Closer):** Public post comment responses & gentle DM conversation nudges.
6. **Agent #6 (Inbound DM Specialist):** 24/7 lead qualification, real phone/email extraction, and public RAG knowledge chat.
7. **Agent #7 (Competitive Intelligence Analyst):** Deep gap analysis and positioning opportunities.
8. **Agent #9 (Sales Closer & Objections Specialist):** High-stakes sales negotiation, refund guard, and Calendly demo booking.

#### B. Internal / Company-Facing Agents (Authenticated Operational Execution):
9. **Master Executive Orchestrator (`executive-orchestrator.node.ts`):** Natural language command interpreter & backend tool runner (`PUBLISH_POST`, `SCHEDULE_CALENDAR`, `CREATE_SHEET`, `SEND_EMAIL_ALERT`).
10. **Agent #8 (Analytics Auditor):** Nightly internal performance audit, lead volume calibration, and strategy adjustments.
11. **Agent #10 (AI Intern Trainer & Mentor):** Document-grounded company SOP learning, onboarding, and trainee scenario quizzes.
12. **Agent #11 (Autonomous Sheet Architect):** Natural language role-based dynamic Google Sheet creator.


---

## 2. Production Architecture & Bottleneck Safeguards

| Safeguard Area | Production Implementation |
|---|---|
| **Timer Durability** | Replaced in-memory `setTimeout` with BullMQ Redis-backed delayed queue (`smma-delayed-comments`). |
| **Event Loop Protection** | Incoming webhooks offloaded to BullMQ (`smma-webhooks`), responding with `200 EVENT_RECEIVED` in $\le 2\text{ms}$. |
| **Groq Rate-Limit Resilience** | Exponential backoff retry ($1\text{s}, 2\text{s}, 4\text{s}$) with jitter on 429/503; auto-fallback to secondary model (`openai/gpt-oss-20b`); token clamp $\le 800$. |
| **Google Sheets 60 RPM Quota** | In-memory micro-batching buffer debouncer flushes up to 10 rows per single multi-row `append` request, saving 90% quota. |
| **PostgreSQL Pool Security** | Connection pool `max: 25`, connection timeout 5s, statement timeout 10s to terminate hung queries. |
| **OAuth Token Health Monitor** | Daily autonomous job scans tokens expiring within 7 days and triggers proactive email/log alerts. |
| **Token Explosion Guard** | Sliding-window memory keeps last 6 messages max with 400-char clamp per message. |
| **Quality & Anti-Hallucination** | Regex phone/email validation strips garbage leads; anti-bot sanitizer strips AI cliches; dispute/refund messages auto-flagged to human inbox. |
| **External vs Internal Firewall** | `supervisor.node.ts` hard firewall locks external public channels (`INSTAGRAM`, `WHATSAPP`, `TWITTER`, `LINKEDIN`) strictly to public engagement agents. Public users can NEVER trigger `EXECUTIVE_ORCHESTRATOR` or `SHEET_ARCHITECT`. |
| **Knowledge Base Scope Isolation** | `training.service.ts` filters documents by scope: Public agents receive only `PRODUCT_MANUAL` and `SALES_SCRIPT`. Sensitive internal `SOP` and `ONBOARDING` documents are strictly restricted to internal company agents. |

---

## 3. Database Schema Blueprint (`001` - `009` Migrations)

* **`tenants`:** Multi-tenant master table with `brand_voice`, `niche`, `target_audience`, `competitor_handles`, `autonomous_mode_enabled`, `cadence_state`, `google_sheet_id`, `notification_email`.
* **`tenant_credentials`:** AES-256-GCM encrypted OAuth social credentials with `token_expires_at`.
* **`tenant_conversations`:** Threaded RLS conversation history with `intent_category` and `is_escalated`.
* **`client_leads`:** Captured prospects with `name`, `phone`, `email`, `lead_score`, `crm_stage`.
* **`scheduled_posts`:** Posts queue with `platform`, `content`, `scheduled_at`, `status` (`PENDING`, `PUBLISHED`, `FAILED`).
* **`company_training_docs`:** Internal knowledge base (`SOP`, `SALES_SCRIPT`, `PRODUCT_MANUAL`, `ONBOARDING`).
* **`intern_training_sessions`:** Trainee Q&A logs with `comprehension_score` (0-100) and AI feedback.
* **`platform_users`:** RBAC accounts (`SUPERADMIN`, `CLIENT_OWNER`, `AGENT_OPERATOR`).

---

## 4. Universal REST API Surface

```text
POST /api/v1/auth/login                  -> Authenticate user & issue JWT
POST /api/v1/tenants/register            -> Register new company with autonomous configuration
GET  /api/v1/inbox/conversations         -> Retrieve tenant threaded inbox
POST /api/v1/credentials                -> Encrypt and bind social media credentials
POST /api/v1/training/docs               -> Upload company SOP / knowledge base document
POST /api/v1/training/ask                -> Intern trainee Q&A and scenario quiz
GET  /api/v1/training/sessions           -> Audit trainee comprehension scores
POST /api/v1/agents/chat                 -> Universal conversational & natural command interface
POST /webhooks/meta                      -> Inbound Meta Instagram/Facebook webhook (HMAC verified)
POST /webhooks/whatsapp                  -> Inbound WhatsApp webhook (HMAC verified)
GET  /health                             -> Uptime and system health status
```

---

## 5. External 3rd-Party Embeddings & Multi-Tenant Token Isolation

When external companies embed our AI agents into their third-party platforms (e.g. proprietary LMS, intranet portals, Slack apps, custom web applications):
1. **Authentication & Ingestion:** External platforms make requests providing a tenant-scoped API Key or Bearer JWT via `Authorization: Bearer <tenant_jwt>` or `x-api-key`.
2. **Context Binding:** `tenant.middleware.ts` extracts and verifies the `tenantId`.
3. **Database-Level Isolation:** All knowledge queries (`company_training_docs`), intern session logs (`intern_training_sessions`), and conversation histories enforce strict SQL scoping `WHERE tenant_id = $1`. Cross-tenant data contamination is mathematically impossible.

---

## 6. AI Intern Mentor Guardrail & Out-of-Scope Security Policy

Agent #10 (`intern-mentor.node.ts`) enforces strict guardrails to handle non-serious, off-topic, or adversarial trainee inputs:
1. **Relevance Scope Filter (`isRelevantToWork`):** Every incoming trainee inquiry is evaluated against workplace relevance.
2. **Refusal & Redirection:** If a trainee attempts prompt injection, asks for poems, jokes, personal chit-chat, or off-topic entertainment:
   * The agent firmly refuses off-topic discussion.
   * Cites standard workplace professionalism.
   * Automatically extracts a scenario question from company SOPs to redirect the intern back to training (`Back on Track Question`).
3. **Comprehension Audit & Penalization:** Off-topic chatter reduces the intern's session score to `25/100` and logs `"Off-topic inquiry flagged by AI Guardrail"` in `intern_training_sessions` for HR / management oversight.

---

## 7. Future MCP (Model Context Protocol) Server & RBAC Architecture

To support distributed deployment across heterogeneous third-party environments, the platform provides an MCP Server blueprint:
1. **Standardized Tool Contracts:** Agents and tools are exposed via standardized JSON-RPC Model Context Protocol (MCP) schemas (`query_training_kb`, `submit_intern_quiz`, `publish_social_post`, `create_lead_sheet`).
2. **Role-Based Access Control (RBAC):**
   * **`TRAINEE` Role:** Restricted strictly to knowledge base queries (`query_training_kb`) and quiz evaluations (`submit_intern_quiz`).
   * **`MANAGER` / `OWNER` Role:** Unlocks executive actions (`publish_social_post`, `generate_roi_sheet`, `schedule_calendar`).
3. **Zero Tool Poisoning:** Strict Zod schema validation ensures arguments conform to exact types, completely eliminating unauthorized actions.

---

## 8. Verification & Strict File Constraints

* **Maximum Line Ceiling:** No `.ts` file exceeds **150 lines** (strictly modular, single-responsibility services).
* **Build Integrity:** Clean compile with `tsc` (0 errors).
* **Environment Resilience:** Dockerized PostgreSQL 16, Redis 7, Qdrant Vector Engine.

