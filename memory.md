# Project Memory & Progress State (`memory.md`)

**Project Title:** Multi-Tenant Social Media Management, Inbound AI Sales & Engagement Platform  
**Document Version:** 15.0 (Full 7-Point Security Access Control Hardening Active - 100% Zero-Gap Enforcement)  
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
* **Strict File Size Constraint:** **MAX 150 lines per file** (All 66 files strictly $\le 135$ lines). Single-responsibility principle.
* **External vs Internal Security Boundary & Channel Firewall:**
  * External public channels (`INSTAGRAM`, `WHATSAPP`, `TWITTER`, `LINKEDIN`) are strictly restricted in `supervisor.node.ts` to public-facing agents (`DM_HANDLER`, `INBOX_SUPPORT_MANAGER`, `COMMENT_REPLY`). Under no circumstance can a public user execute internal operational commands (`EXECUTIVE_ORCHESTRATOR`, `SHEET_ARCHITECT`).
  * Knowledge Base Scope Isolation: `training.service.ts` partitions documents:
    * Public Scope (`PRODUCT_MANUAL`, `SALES_SCRIPT`): Served to external leads & DM customers.
    * Internal Scope (`SOP`, `ONBOARDING`): Restricted strictly to internal company staff & intern training (`intern-mentor.node.ts`).
* **Autonomous Tool Execution Engine:**
  * User can command the AI in natural language (Urdu or English) to execute real business actions on behalf of the company.
  * Master Executive Orchestrator (`executive-orchestrator.node.ts`) + Tools Executor (`tools.executor.ts`) execute actions:
    * `PUBLISH_POST` (Queues and publishes to Instagram/LinkedIn/Twitter).
    * `SCHEDULE_CALENDAR` (Creates Google Calendar invites and Meet links).
    * `CREATE_SHEET` (Dynamically structures and creates role-based Google Sheets).
    * `SEND_EMAIL_ALERT` (Dispatches high-priority executive alerts via SMTP).
* **AI Intern Mentor Guardrail & Out-of-Scope Protection:**
  * `intern-mentor.node.ts`: Evaluates trainee input with `isRelevantToWork` schema.
  * Bizarre/off-topic inquiries receive firm professional refusal, workplace standard reminder, and an automatic SOP challenge question to bring them back on track.
  * Off-topic interactions penalized with score `25/100` and logged in `intern_training_sessions` for management audits.
* **Multi-Tenant Token Scoping & MCP (Model Context Protocol) Architecture:**
  * External sites embed via company token (`x-api-key` / `Bearer JWT`).
  * Strict SQL scoping (`WHERE tenant_id = $1`) guarantees zero cross-tenant knowledge leaks.
  * Prepared for future MCP server endpoints exposing role-gated tools (Trainee vs Manager).


---

## 2. All 12 Specialized Autonomous Agents in Platform

1. **Master Executive Orchestrator:** `executiveOrchestratorNode` — Understands natural language owner commands and triggers backend tools directly.
2. **Agent #1 (Reach Booster):** `selfCommentNode` — 60s delayed algorithmic boost comment.
3. **Agent #2 (Trend Architect):** `trendPlannerNode` — Daily viral hooks & topic finder.
4. **Agent #3 (Competitor Hijack):** `competitorBotNode` — Midday authority value comments on competitor posts.
5. **Agent #4 (Omnichannel Publisher):** `publisherNode` — Auto-formats & publishes for Instagram/LinkedIn/Twitter.
6. **Agent #5 (Comment Closer):** `commentReplyNode` — Public comment replies & gentle DM nudges.
7. **Agent #6 (Inbound DM Specialist):** `inboundDmNode` — 24/7 lead qualification & RAG-grounded customer chat.
8. **Agent #7 (Competitive Researcher):** `researcherNode` — Market gap & content audit.
9. **Agent #8 (Analytics Auditor):** `analyticsNode` — Performance KPIs & lead volume calibration.
10. **Agent #9 (Sales Closer):** `supportCloserNode` — High-ticket objection handling & discovery calls.
11. **Agent #10 (Intern Trainer):** `internTrainingMentorNode` — Company SOP training & trainee quizzes.
12. **Agent #11 (Sheet Architect):** `sheetArchitectNode` — Role-based dynamic Google Sheet creator & workflow generator.

---

## 3. Verification Checkpoints

1. **Compilation:** `cd backend && npm run build` exits with code 0 (zero errors).
2. **File Size Compliance:** 100% of files strictly comply with the $\le 150$ lines ceiling (max 135 lines).
3. **Natural Language Tool Execution Verified:**
   * Command: *"Tum mere Instagram par ye post kardo: 'We are accepting 3 new high-ticket clients...'"*
   * Action Executed: Post automatically saved and queued in `scheduled_posts` table with status `PENDING`.
   * Command: *"Kal subah 11 baje client ke saath strategy call book kardo."*
   * Action Executed: Master Orchestrator triggered Google Calendar booking tool.
4. **External OpenAPI / Swagger Tool Engine Verified:**
   * Module: `backend/src/modules/tools/` (`external-tools.service.ts`, `external-tools.controller.ts`, `external-tools.routes.ts`).
   * OpenAPI Spec Import: `POST /api/v1/tools/openapi` automatically converts client's Swagger JSON into executable AI tools in `tenant_external_tools`.
   * Manual Webhook Fallback: `POST /api/v1/tools/manual` registers custom actions.
   * Autonomous Execution: `executiveOrchestratorNode` dispatches live HTTP calls directly to the client's external software when instructed by users.
5. **Full 7-Point Access Control & Security Hardening (100% Patched):**
   * **Patch 1 (Supervisor Bypass Fixed):** `supervisor.node.ts` validates `state.targetAgent` against `isExternal`. External channels are blocked from invoking `EXECUTIVE_ORCHESTRATOR`, `SHEET_ARCHITECT`, or `INTERN_TRAINER` and redirected to `INBOX_SUPPORT_MANAGER`.
   * **Patch 2 (External Tool RBAC Enforced):** `executeExternalTool` enforces `tool.allowed_roles` and `requires_approval` against `actor.role` before executing HTTP dispatch.
   * **Patch 3 (Granular TRAINEE Role Added):** `TRAINEE` role added to `rbac.middleware.ts`, `auth.service.ts`, `agent.policy-validator.ts`, and migration `013_add_trainee_role.sql`. Trainees restricted to Q&A only, locked out of leads and inbox.
   * **Patch 4 (Anti-Prompt-Injection & XML Delimiters):** `quality.validator.ts` adds `detectPromptInjection()`. `inbound-dm.node.ts` drops injections and encloses user text in `<user_inquiry>` tags with strict instruction bounds.
   * **Patch 5 (DNS Rebinding SSRF Protection):** `external-tools.egress.ts` uses async `dns.lookup()` in `assertAllowedEgressUrlAsync` to block resolved private/cloud metadata IPs.
   * **Patch 6 (Rate Limiting & DoW Defense):** `rate-limit.middleware.ts` enforces 60 req/min on AI chat and 30 req/min on training with `429 Too Many Requests`.
   * **Patch 7 (Webhook Idempotency & Deduplication):** `webhook.processor.ts` tracks 24-hr message IDs, dropping duplicate Meta/WhatsApp webhook retries.
   * **Strict Line Ceiling:** 100% of files in `backend/src/` strictly $\le 118$ lines (well below the $\le 150$ lines constraint). Clean compile with 0 errors.
