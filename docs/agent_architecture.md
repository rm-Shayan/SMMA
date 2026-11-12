# Master AI Agent Governance & Engineering Rules (`agent.md`)

**Document Version:** 7.0 (Production Master Rules)  
**Target Framework:** Node.js (v20+ LTS) with Express.js (Zero-Bloat Modular Architecture)  
**Database:** PostgreSQL 16 (Native `pg` Pool with Row-Level Security - RLS)  
**Caching & Metering:** Redis 7 (`ioredis` Atomic Counters & Velocity Rate Limiter)  
**Vector DB / Knowledge Base:** Qdrant OSS (`tenant_{tenant_id}_kb` via `@qdrant/js-client-rest`)  
**AI Brain:** **Qwen 2.5 (32B / 72B)** via Groq API / Self-Hosted Ollama (Structured JSON Mode)  
**Status:** Canonical Rulebook & Engineering Invariants for All 10 Specialized Agents  

---

## SECTION 1: System Architecture & Stack Lockout

### 1.1 Strict Dependency Freeze & Approved Package Whitelist
To guarantee ultra-low latency, zero dependency bloat, and total predictability, the codebase is strictly locked to the following whitelist:

```text
ALLOWED PACKAGES ONLY:
├── express               (Lightweight HTTP routing & middleware)
├── pg                    (Native PostgreSQL client with connection pooling)
├── ioredis               (High-speed Redis client for atomic counters & locks)
├── bullmq                (Enterprise job queues & anti-ban throttling)
├── @langchain/langgraph  (StateGraph multi-agent orchestration)
├── @langchain/core       (Core primitives & message state definitions)
├── zod                   (Compile-time & runtime schema validation)
├── dotenv                (Environment configuration loading)
├── @qdrant/js-client-rest(Direct Qdrant REST client for RAG queries)
├── telegraf              (Telegram Bot API for human-in-the-loop control)
├── pino                  (Ultra-fast structured JSON logger)
└── crypto                (Native Node.js module for HMAC webhook signatures)
```

> [!CAUTION]
> **ABSOLUTE BAN — PROHIBITED DEPENDENCIES:**
> * ❌ **NO NestJS:** Do not install `@nestjs/*`. Use pure Node.js + Express modular controllers/services.
> * ❌ **NO Prisma / TypeORM:** Do not install heavy ORMs. Use native `pg` client with parameterized SQL queries.
> * ❌ **NO LangChain / High-Level Frameworks:** Do not install `@langchain/*`. Use direct, lightweight HTTP/fetch calls to the Qwen 2.5 inference endpoint with strict Zod parsing.
> * ❌ **NO Heavy UI Toolkits:** The backend is completely headless. No React/Vue/Next.js dependencies in the backend repo.
> * ❌ **NO Unauthorized Installs:** The AI assistant MUST NOT execute `npm install` for any package outside this whitelist without explicit human confirmation.

---

### 1.2 File Modularization & 150-Line Limit (CRITICAL INVARIANT)
* **MAXIMUM FILE LENGTH:** **150 lines per file** (comments and whitespace included).
* **Early Modularization Trigger:** If any file reaches **130 lines**, it MUST immediately be modularized into sub-services, controllers, helpers, or route fragments.
* **One Component / One Function per File Policy:** Keep every class, middleware, or handler single-purpose, clean, and easily testable.

---

### 1.3 Multi-Tenant Row-Level Security (RLS) Mandate
* Database tables storing tenant data MUST have Row-Level Security enabled (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
* Every database transaction or query connection MUST establish the tenant context prior to execution:
  ```sql
  SET LOCAL app.current_tenant_id = 'tenant_uuid_here';
  ```
* **ZERO raw SQL queries** are allowed without an explicit `tenant_id` filter or an active RLS session setting.

---

## SECTION 2: The 10-Agent Operational Boundaries

The system must STRICTLY implement only the following 10 specialized agents. No generic nodes or omitted roles are permitted.

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     AGENT #10: SUPERVISOR & SYSTEM ROUTER (Express/Node)    │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
 ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
 │   Content & Push  │        │  Comment Engine   │        │ Inbox & Research  │
 └─────────┬─────────┘        └─────────┬─────────┘        └─────────┬─────────┘
           │                            │                            │
 ┌─────────┴─────────┐        ┌─────────┴─────────┐        ┌─────────┴─────────┐
 │ Agent #1: Self-   │        │ Agent #3: Comment │        │ Agent #2: Market  │
 │ Commenter         │        │ Reply Agent       │        │ Competitive Res.  │
 │                   │        │                   │        │                   │
 │ Agent #5: Today's │        │ Agent #7: Comp.   │        │ Agent #6: DM      │
 │ Trend Identifier  │        │ Post Engagement   │        │ Handler           │
 │                   │        │                   │        │                   │
 │ Agent #8: Post    │        │ Agent #4: Analytics│       │ Agent #9: Inbox / │
 │ & Distribution    │        │ & Tracking        │        │ Support Manager   │
 └───────────────────┘        └───────────────────┘        └───────────────────┘
```

---

### Agent #1: Self-Comment Agent
* **Purpose:** Generates value-add initial comments or follow-up insights on client posts to trigger social media platform engagement algorithms.
* **Core Rule:** Max 1 self-comment per post. Must sound authentic, non-spammy, and add real value (e.g. key takeaway summary, question to audience, or resource link).
* **Zod Schema:**
  ```typescript
  export const SelfCommentSchema = z.object({
    postId: z.string().min(1),
    platform: z.enum(['INSTAGRAM', 'LINKEDIN', 'TWITTER', 'FACEBOOK']),
    commentText: z.string().min(10).max(280),
    delaySeconds: z.number().int().min(30).max(300),
  });
  ```

---

### Agent #2: Market Competitive Researcher Agent
* **Purpose:** Analyzes publicly available industry topics, competitor post structures, and engagement patterns to identify positioning gaps.
* **Core Rule:** Strictly read-only analysis for content ideation. ZERO automated scraping or prohibited data harvesting.
* **Zod Schema:**
  ```typescript
  export const CompetitiveResearchSchema = z.object({
    niche: z.string().min(2),
    trendingTopics: z.array(z.string().min(3)).max(5),
    competitorAngles: z.array(z.string()).max(5),
    contentGapOpportunities: z.array(z.string()).max(3),
    recommendedFormat: z.enum(['CAROUSEL', 'SHORT_VIDEO', 'IN_DEPTH_THREAD', 'CASE_STUDY']),
  });
  ```

---

### Agent #3: Comment Reply Agent
* **Purpose:** Handles public user comments under client posts in real time.
* **Core Rule:** Answers questions directly or nudges warm leads into Direct Messages (DMs). Automatically filters spam, abuse, and competitor links.
* **Zod Schema:**
  ```typescript
  export const CommentReplySchema = z.object({
    commentId: z.string().min(1),
    sentiment: z.enum(['POSITIVE', 'QUESTION', 'COMPLAINT', 'SPAM']),
    replyText: z.string().max(280).nullable(),
    triggerPrivateDM: z.boolean(),
  });
  ```

---

### Agent #4: Analytics & Tracking Agent
* **Purpose:** Summarizes reach, engagement metrics, and conversion rates across connected social channels.
* **Core Rule:** Formats raw metrics into lightweight JSON digests for agency reporting and highlights the top 3 performing posts of the week.
* **Zod Schema:**
  ```typescript
  export const AnalyticsReportSchema = z.object({
    tenantId: z.string().uuid(),
    period: z.string(),
    totalImpressions: z.number().nonnegative(),
    averageEngagementRate: z.number().min(0).max(100),
    topPerformingPosts: z.array(z.string()).max(3),
    recommendations: z.array(z.string()).max(3),
  });
  ```

---

### Agent #5: Daily Trend & Need Identifier Agent
* **Purpose:** Identifies daily audience pain points, seasonal topics, and content hooks.
* **Core Rule:** Outputs structured post drafts categorizing content into 4 core pillars (Educational, Promotional, Social Proof, Interactive).
* **Zod Schema:**
  ```typescript
  export const DailyTrendSchema = z.object({
    scheduledDate: z.string(),
    coreTopic: z.string().min(5),
    targetAudiencePainPoint: z.string().min(5),
    suggestedHook: z.string().min(10).max(120),
    pillar: z.enum(['EDUCATIONAL', 'PROMOTIONAL', 'SOCIAL_PROOF', 'INTERACTIVE']),
  });
  ```

---

### Agent #6: Inbound DM & CRM Live-Chat Handler Agent
* **Purpose:** Instant first-response sales qualification agent across Instagram, Facebook, WhatsApp, X, and external CRM Live-Chat widgets.
* **Core Rule:** Target latency $< 30\text{s}$. Accurately qualifies intent (`SALES_LEAD`, `SUPPORT`, `PRICING`, `SPAM`). Extracts prospect contact information (Name, Phone, Email) if shared. If deep context or pricing objection is required, hands off to Agent #9.
* **Zod Schema:**
  ```typescript
  export const DMHandlerSchema = z.object({
    senderId: z.string().min(1),
    channel: z.enum(['CRM_LIVE_CHAT', 'CRM_INBOX', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'TWITTER']),
    intent: z.enum(['SALES_LEAD', 'SUPPORT', 'PRICING', 'BOOKING', 'SPAM']),
    immediateReply: z.string().max(500).nullable(),
    extractedContact: z.object({
      name: z.string().nullable(),
      phone: z.string().nullable(),
      email: z.string().nullable(),
    }),
    routeToDeepCloser: z.boolean(),
  });
  ```

---

### Agent #7: Competitor Engagement Bot
* **Purpose:** Engages on public industry/thought leader posts with high-authority commentary to position the client as a market expert.
* **Core Rule:** High-stakes public action. Never bash competitors. Requires Telegram Human Approval Gateway flag if confidence score is $< 0.85$.
* **Zod Schema:**
  ```typescript
  export const CompetitorEngagementSchema = z.object({
    targetPostUrl: z.string().url(),
    commentDraft: z.string().min(20).max(300),
    valueAngle: z.string().min(5),
    confidenceScore: z.number().min(0).max(1),
    requiresHumanReview: z.boolean().default(true),
  });
  ```

---

### Agent #8: Post Publisher & Targeted Push Agent
* **Purpose:** Schedules posts and handles platform-specific caption formatting, hashtags, and media specifications.
* **Core Rule:** Auto-formats hashtags and line breaks according to Meta, LinkedIn, and X specs. Enforces character limits strictly.
* **Zod Schema:**
  ```typescript
  export const FormattedPostSchema = z.object({
    platform: z.enum(['INSTAGRAM', 'LINKEDIN', 'TWITTER', 'FACEBOOK']),
    captionText: z.string().min(10),
    hashtags: z.array(z.string()).max(15),
    mediaUrl: z.string().url().optional(),
    scheduledTimestamp: z.string(),
  });
  ```

---

### Agent #9: CRM Closer & Support Manager (RAG Closer) Agent
* **Purpose:** Deep sales objection handling, appointment scheduling, CRM pipeline stage recommendation, and customer support resolution via Qdrant vector database (`tenant_{tenant_id}_kb`).
* **Core Rule:** Similarity threshold must be $\ge 0.72$. Outputs CRM tags and suggested pipeline stages. If similarity score is lower, or if user asks for custom pricing/contracts, trigger Human Escalation (`escalateToHuman = true`).
* **Zod Schema:**
  ```typescript
  export const DeepSalesCloserSchema = z.object({
    senderId: z.string().min(1),
    responseText: z.string().min(5).max(1000),
    leadScore: z.number().min(0).max(100),
    suggestedPipelineStage: z.enum(['NEW_LEAD', 'QUALIFIED_HOT', 'DEMO_REQUESTED', 'CUSTOMER_SUPPORT', 'ESCALATED']),
    crmTags: z.array(z.string()),
    bookingLinkProvided: z.boolean(),
    escalateToHuman: z.boolean(),
    confidenceScore: z.number().min(0).max(1),
  });
  ```

---

### Agent #10: Supervisor & System Router Agent
* **Purpose:** Master event orchestrator. Evaluates incoming webhooks/triggers (Social or CRM API calls) and routes tasks to Agents #1–#9.
* **Core Rule:** Enforces Zod schemas, normalizes incoming channel payloads, and drops self-reply loops.
* **Zod Schema:**
  ```typescript
  export const SupervisorRouteSchema = z.object({
    targetAgent: z.enum([
      'SELF_COMMENTER', 'COMPETITIVE_RESEARCHER', 'COMMENT_REPLY', 'ANALYTICS',
      'TREND_IDENTIFIER', 'DM_HANDLER', 'COMPETITOR_ENGAGEMENT', 'POST_DISTRIBUTION',
      'INBOX_SUPPORT_MANAGER', 'IGNORE'
    ]),
    tenantId: z.string().uuid(),
    sourceChannel: z.enum(['CRM_LIVE_CHAT', 'CRM_INBOX', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'LINKEDIN', 'TWITTER']),
    priority: z.enum(['HIGH', 'NORMAL', 'LOW']),
    reasoning: z.string().min(5),
  });
  ```

---

## SECTION 3: Pluggable CRM Integration & Unrestricted Operational Rules

### 3.1 Unrestricted Operational Mode (Pricing/Quotas Deferred)
* **Pricing & Quota Gating are DISABLED** in the current phase.
* All incoming messages, agent invocations, and post schedules execute without quota-based blocks or artificial paywalls.
* Full operational focus is placed on agent intelligence, lead qualification accuracy, and CRM sync.

### 3.2 CRM Event Handoff & Webhook Dispatch
* When Agent #6 or Agent #9 identifies contact info or qualifies a lead, the system emits an automated CRM webhook payload to `tenants.crm_webhook_url`:
  ```json
  {
    "event": "LEAD_QUALIFIED",
    "tenant_id": "uuid",
    "channel": "INSTAGRAM_DM",
    "contact": {
      "name": "Hamza Ali",
      "phone": "+923001234567",
      "email": "hamza@example.com"
    },
    "intent": "SALES_LEAD",
    "lead_score": 85,
    "suggested_stage": "QUALIFIED_HOT",
    "tags": ["high_intent", "pricing_inquiry", "smma_interest"]
  }
  ```

### 3.3 Channel Normalization Standard
* All agent logic operates on normalized data regardless of whether the ingress source was a social platform webhook (Meta/WhatsApp) or a CRM API call (`CRM_LIVE_CHAT`, `CRM_INBOX`). No channel-specific branching inside agent reasoning nodes.

---

## SECTION 4: Code Quality, Security & Error Handling Rules

### 4.1 Strict Idempotency & Webhook Deduplication
* Inbound webhook payloads MUST check Redis key `idempotency:{event_id}` (TTL 48 Hours).
* Duplicate event payloads MUST immediately return `HTTP 200 OK` and abort execution to prevent double-replies.

### 4.2 Zod Runtime Schema Validation & Auto-Retry
* NO LLM response can be dispatched to social platforms without passing strict Zod schema validation.
* **Auto-Repair Protocol:** If Zod validation fails, auto-retry LLM generation **once** with the JSON error context injected into the prompt. If it fails twice, route to Telegram Human Control.

### 4.3 Zero Hardcoded Secrets
* API keys, DB passwords, and webhook secrets MUST be loaded exclusively via `process.env`.
* Missing required env variables MUST prevent application startup with a clear fatal error log.

### 4.4 Clean Error Handling & Logging
* Never expose internal SQL or system stack traces to API clients.
* All errors must be logged using `pino` in structured JSON format with `timestamp`, `tenant_id`, and `trace_id`.

### 4.5 Headless Operational Control
* System MUST expose interactive Swagger documentation at `/api/docs`.
* System MUST integrate with Telegram Control Bot for 1-click `[Approve]` / `[Reject]` actions on high-stakes AI outputs.

### 4.6 Continuous Session Memory Protocol (`memory.md` Mandate)
* **Single Source of Truth for Progress:** All completed tasks, active phase status, created files, endpoint routes, database changes, and architectural decisions MUST be continuously documented in `memory.md`.
* **Resume Without Codebase Scans:** When starting or resuming any task or conversation turn, the AI assistant MUST inspect `memory.md` first to instantly understand the current state, active phase, and completed work, rather than executing expensive codebase-wide searches.
* **Real-Time Update Rule:** Whenever any file is created, updated, or a milestone is achieved, `memory.md` MUST be updated immediately to reflect the latest state.

---

## SUMMARY CHECKLIST FOR EVERY FILE CREATED

- [ ] **Is the file length strictly under 150 lines?**
- [ ] **Are dependencies limited strictly to the approved whitelist (`express`, `pg`, `ioredis`, `zod`, `dotenv`, `@qdrant/js-client-rest`, `telegraf`, `pino`, `crypto`)?**
- [ ] **Is tenant isolation (`tenant_id`) enforced via SQL RLS (`SET LOCAL app.current_tenant_id`) or Redis namespace?**
- [ ] **Is all incoming/outgoing data validated using Zod?**
- [ ] **Does it maintain strict compatibility with Qwen 2.5 and Node.js v20+ LTS?**
- [ ] **Has `memory.md` been updated to record this task and file change?**
