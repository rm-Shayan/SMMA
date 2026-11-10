# Complete Application Architecture & Execution Flow (`application flow.md`)

**Document Version:** 13.0 (Enterprise Multi-Tenant Autonomous Operating System)  
**Last Updated:** Current Session Setup  
**Backend Directory:** `backend/`

---

## 1. High-Level System Flow (Bird's Eye View)

```text
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                         EXTERNAL CHANNELS & PROACTIVE TIME CLOCKS                           │
 └──────────────┬──────────────────────────────┬──────────────────────────────┬────────────────┘
                │                              │                              │
                ▼                              ▼                              ▼
    Meta / WhatsApp Webhooks        Autonomous 24/7 Clock         Executive Human Commands
    (Inbound Instagram / DMs)      (Cadence Tick every 5 min)    ("Post this", "Make Sheet")
                │                              │                              │
                ▼                              ▼                              ▼
    HMAC-SHA256 Signature Verify    `runAutonomousCadenceTick()`      Express `/api/v1/agents/chat`
                │                              │                              │
                ▼                              ▼                              ▼
   BullMQ Async Inbound Queue        Autonomous Stage Evaluation        Supervisor Router Node
   (`smma-webhooks` -> <2ms 200 OK)  (08:00 AM / 10:00 / 14:00 / 23:00) (supervisor.node.ts)
                │                              │                              │
                └──────────────────────────────┼──────────────────────────────┘
                                               │
                                               ▼
     ┌──────────────────────────────────────────────────────────────────────────────────┐
     │                AUTONOMOUS MULTI-AGENT REASONING CORE (12 AGENTS)                 │
     │      - LangGraph StateGraph            - Tenant-Specific Knowledge Base (RAG)    │
     │      - Groq Qwen 2.5 Inference         - Sliding Window Token Guard (Last 6 msg) │
     │      - Quality & Anti-Bot Sanitizer    - Tool Executor Engine                    │
     └─────────────────────────────────────────┬────────────────────────────────────────┘
                                               │
                     ┌─────────────────────────┴─────────────────────────┐
                     ▼                                                   ▼
      DOMAIN 1: External / Public Facing                  DOMAIN 2: Internal / Company Operations
   - Public Channels: Instagram, WhatsApp, Twitter    - Authenticated Workspace & Internal API
   - Agents: Lead DMs, Sales Closer, Comments         - Agents: Orchestrator, Sheet Architect, Mentor
   - Context: Public Manuals & Sales Scripts only     - Context: Full Internal SOPs & Onboarding
   - Firewall: CANNOT trigger internal tools          - Actions: Sheets, Calendars, Trainee Quizzes
```

---

## 2. End-to-End Execution Lifecycles

### Cycle A: Inbound Reactive Customer Flow (Instagram / WhatsApp DMs)
1. **Webhook Ingress:**
   - Meta or WhatsApp sends raw payload to `/webhooks/meta` or `/webhooks/whatsapp`.
   - `signature.security.ts` verifies HMAC-SHA256 signature using `META_APP_SECRET`.
   - Webhook route pushes payload to BullMQ Redis Queue (`smma-webhooks`) and replies **`200 EVENT_RECEIVED` in $\le 2\text{ms}$**.
2. **Background Worker Processing:**
   - BullMQ Worker picks up the job in `webhook.processor.ts`.
   - Resolves tenant via mapped platform account ID (`findTenantByPlatformAccount`).
   - Retrieves conversation history (sliding-window bounded to last 6 messages).
   - Fetches tenant-isolated RAG Knowledge Base (`company_training_docs`).
3. **Agent Reasoning & Quality Gate:**
   - **Agent #6 (Inbound DM Handler)** reasons over customer message with tenant SOP context.
   - Extracts prospect contact info (Name, Phone, Email) with strict regex validation (`quality.validator.ts`).
   - Anti-bot filter cleans robotic buzzwords and ensures human marketing voice.
4. **Autonomous Action Execution:**
   - Dispatches live reply via `dispatchSocialMessage` using decrypted OAuth token.
   - Saves lead to PostgreSQL `client_leads`.
   - Buffers row into `google-sheets.service.ts` (batched append to Google Sheet).
   - Delivers real-time HTML alert email to agency owner via `smtp-email.service.ts`.
   - Logs conversation into `tenant_conversations` with RLS isolation.

---

### Cycle B: Proactive 24/7 Autonomous Daily Operating Cadence
Every tenant with `autonomous_mode_enabled = true` runs on a 24-hour business rhythm managed by `cadence.service.ts`:

* **08:00 AM (Morning Intelligence):**
  - **Agent #2 (Trend Identifier) + Agent #7 (Competitive Researcher)** scan niche trends.
  - Generates 2 high-converting post hooks for the day.
  - Inserts posts into `scheduled_posts` table with status `PENDING` (scheduled for 10:00 AM & 06:00 PM).
* **10:00 AM (Peak Publishing #1):**
  - Scheduler cron claims due post with row-locking.
  - **Agent #4 (Publisher)** formats and publishes to connected social channel.
  - Enqueues BullMQ delayed job (`smma-delayed-comments`) with `{ delay: 60000 }`.
* **10:01 AM (Algorithmic Boost):**
  - **Agent #1 (Self-Commenter)** wakes up 60s later and posts first high-value comment.
* **02:00 PM (Competitor Growth Hijack):**
  - **Agent #3 (Competitor Engagement)** targets configured `competitor_handles` and generates authoritative value-add comments.
* **06:00 PM (Peak Publishing #2):**
  - Evening post auto-published for high-traffic engagement.
* **11:00 PM (Nightly Performance Audit):**
  - **Agent #8 (Analytics Auditor)** evaluates leads captured, conversation volume, and calibrates tomorrow's content pillars.

---

### Cycle C: Executive Tool Execution (Natural Language Human Commands)
When an agency owner or manager commands the AI Assistant via chat:

* **"Instagram par ye post kardo: [Content]"**
  - `supervisor.node.ts` routes to `EXECUTIVE_ORCHESTRATOR`.
  - `executive-orchestrator.node.ts` selects tool `PUBLISH_POST`.
  - `tools.executor.ts` queues post into `scheduled_posts` table.
* **"Kal subah 11 baje client ke sath strategy call book kardo"**
  - Selects tool `SCHEDULE_CALENDAR`.
  - `tools.executor.ts` calls Google Calendar API and generates meeting with Google Meet link.
* **"Accounts department ke liye payments aur invoices ki sheet bana do"**
  - Selects tool `CREATE_SHEET`.
  - `sheet-architect.node.ts` designs role-specific headers (`Date`, `Client Name`, `Invoice #`, `Amount`, `Status`).
  - `google-sheets-creator.service.ts` calls Google Sheets API v4 to generate live spreadsheet and returns link.

---

### Cycle D: Document-Grounded Intern Training & Mentoring
* **Company Uploads SOP:**
  - Owner uploads training manual via `POST /api/v1/training/docs` -> stored in `company_training_docs`.
* **Intern Q&A / Scenario Testing:**
  - Trainee asks questions via `POST /api/v1/training/ask`.
  - **Agent #10 (Intern Trainer & Guardrail Mentor)** answers strictly grounded in the company's uploaded document.
  - Evaluates trainee with a scenario quiz and logs comprehension score (0-100) into `intern_training_sessions`.
* **Guardrail & Off-Topic Redirection:**
  - If a trainee asks weird, off-topic, or jailbreak questions, `intern-mentor.node.ts` flags `isRelevantToWork: false`, firmly refuses off-topic chatter, posts a workplace standard rule, challenges them with an SOP quiz question to bring them back on track, and drops the comprehension score to `25/100`.

---

## 3. External Platform Integration & MCP (Model Context Protocol) Flow

1. **Third-Party LMS / External App Embedding:**
   - External platforms connect to `POST /api/v1/training/ask` using their scoped Company Token (`x-api-key` / `Bearer <jwt>`).
   - `tenant.middleware.ts` enforces PostgreSQL tenant isolation (`WHERE tenant_id = $1`), preventing any cross-company knowledge leakage.
2. **Future MCP Server Integration:**
   - Universal JSON-RPC MCP tools (`query_training_kb`, `submit_intern_quiz`, `publish_social_post`, `create_lead_sheet`).
   - Role-Based Access Control (RBAC): Trainee tokens can ONLY invoke training tools; Manager tokens unlock executive publishing and sheet generation tools.

