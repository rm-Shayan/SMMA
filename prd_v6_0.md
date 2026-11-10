# Enterprise Product Requirement Document (PRD v7.2)

## Project Title: Multi-Tenant Headless AI Agent Engine & Social / CRM / CMS Automation Platform
**Document Version:** 7.2 (Headless Pluggable Multi-Agent Engine Edition)  
**Target Architecture:** Multi-Tenant Headless Agent Brain as a Service (Embeddable into ANY Platform)  
**Backend Runtime:** **Node.js (v20+ LTS)** with **Express.js (Modular Zero-Bloat Architecture)**  
**Core LLM Model:** **Qwen 2.5 (32B / 72B)** via Groq API (Cloud Ultra-Fast Inference, Zero Local Downloads)  
**Primary Strategic Mandate:** **HEADLESS AGENT BRAIN FIRST — ZERO UI DISTRACTION.**  
The primary deliverable of this project is the **10-Agent Autonomous Core**. The agents are 100% channel-agnostic and pluggable into:
- Any pre-built or existing **CRM** (GoHighLevel, HubSpot, Salesforce, custom in-house CRMs).
- Any **CMS / E-Commerce Store** (WordPress, Shopify, WooCommerce, Strapi).
- Direct **Social Platforms & Messaging Channels** (Meta Instagram & Facebook, WhatsApp Cloud API, LinkedIn, X).
- Custom **Websites / Live-Chat Portals** via universal REST API.  
**Pricing / Quota Status:** **DISABLED / DEFERRED (Full Operational Mode)** — All onboarding tenants have unrestricted, unlimited access without artificial paywalls.

---

## 1. System Vision & Core Strategic Objectives

The platform is engineered as an **Autonomous Multi-Agent Brain**. Instead of building fragile UI dashboards, the entire architectural effort is concentrated on bulletproof AI execution, state machine orchestration, RAG grounding, and platform-agnostic portability.

> [!IMPORTANT]
> **Architectural Law — Universal Platform Portability:**  
> The 10 AI agents must **NEVER** be tightly coupled to social media payloads or specific database records. The agent brain operates on a **Universal State Schema**. Whether an event originates from a WordPress comment, a HubSpot ticket, an Instagram DM, or a WhatsApp customer chat, the agent executes the exact same RAG-grounded reasoning and returns structured outputs with actionable metadata.

```text
 ┌─────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                   INCOMING TRAFFIC SOURCES                                  │
 └──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│  Meta Webhooks   │                  │  WhatsApp Cloud  │                  │ EXISTING / FUTURE│
│ (IG / FB DMs &   │                  │  API (1,000 Free │                  │ CRM INTEGRATION  │
│  Post Comments)  │                  │  Chats / month)  │                  │ (REST / Webhooks)│
└────────┬─────────┘                  └────────┬─────────┘                  └────────┬─────────┘
         │                                      │                                      │
         └──────────────────────────────────────┼──────────────────────────────────────┘
                                                │
                                                ▼
+-----------------------------------------------------------------------------------------------+
|                           EXPRESS.JS UNIVERSAL INBOUND DISPATCHER                             |
|               (Normalizes Ingress Payload -> Injects Tenant Context & RLS)                   |
+-----------------------------------------------------------------------------------------------+
                                                │
                                                ▼
+-----------------------------------------------------------------------------------------------+
|                       PLUGGABLE 10-AGENT OPERATIONAL ENGINE (Qwen 2.5)                        |
|       - LangGraph.js StateGraph      - Qdrant Vector RAG (tenant_{id}_kb)                     |
|       - Zod Structured Output        - Telegram Human-in-the-Loop Gateway                     |
+-----------------------------------------------------------------------------------------------+
                                                │
         ┌──────────────────────────────────────┼──────────────────────────────────────┐
         ▼                                      ▼                                      ▼
┌──────────────────┐                  ┌──────────────────┐                  ┌──────────────────┐
│ Social Dispatch  │                  │ CRM Sync & Tags  │                  │ Telegram Human   │
│ (Auto-Replies)   │                  │ (Lead Handoff)   │                  │ Approval Alert   │
└──────────────────┘                  └──────────────────┘                  └──────────────────┘
```

---

## 2. Pluggable Universal Agent API (CRM Integration Contract)

To allow any existing or future CRM to plug into the agent engine with zero refactoring, the platform exposes a standardized Headless Agent API.

### 2.1 Universal Ingress Endpoint (`POST /api/v1/agents/chat`)
Any external CRM or chat widget can invoke the agent brain directly:

```typescript
// Standard Ingress Contract from Any CRM
export const UniversalAgentRequestSchema = z.object({
  tenantId: z.string().uuid(),
  channel: z.enum(['CRM_LIVE_CHAT', 'CRM_INBOX', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'LINKEDIN', 'TWITTER', 'EMAIL']),
  conversationId: z.string(),
  contact: z.object({
    id: z.string(),
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    currentCrmStage: z.string().optional(), // e.g. 'NEW_LEAD', 'OPPORTUNITY'
    crmTags: z.array(z.string()).optional(),
  }),
  currentMessage: z.string().min(1),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant', 'system']),
    content: z.string(),
  })).default([]),
});
```

### 2.2 Standardized Egress Response (Returned to CRM)
The agent returns not only conversational text, but actionable CRM metadata:

```typescript
// Standard Egress Contract Delivered Back to CRM
export const UniversalAgentResponseSchema = z.object({
  replyText: z.string(),
  intentDetected: z.enum(['SALES_INQUIRY', 'TECH_SUPPORT', 'PRICING', 'BOOKING', 'COMPLAINT', 'SPAM']),
  leadScore: z.number().min(0).max(100),
  suggestedPipelineStage: z.enum(['NEW_LEAD', 'QUALIFIED_HOT', 'DEMO_REQUESTED', 'CUSTOMER_SUPPORT', 'ESCALATED']),
  crmContactUpdates: z.object({
    extractedName: z.string().nullable(),
    extractedPhone: z.string().nullable(),
    extractedEmail: z.string().nullable(),
    tagsToAdd: z.array(z.string()),
    internalNoteSummary: z.string(),
  }),
  requiresHumanTakeover: z.boolean(),
  confidenceScore: z.number().min(0).max(1),
});
```

---

## 3. Technology Stack Specification

| Component | Choice | Technical Specification |
| :--- | :--- | :--- |
| **Backend Framework** | **Node.js (v20+ LTS) + Express.js** | Lightweight, high-concurrency modular architecture (Max 150 lines per file). |
| **Agent Orchestration** | **LangGraph.js (`@langchain/langgraph`)** | Channel-agnostic StateGraph state machine with conditional routing. |
| **Core AI Model** | **Qwen 2.5 (32B / 72B)** via Groq API | Cloud-hosted, ultra-low latency (< 400ms), zero local downloads, strict JSON adherence. |
| **Schema Validation** | **Zod (`zod`)** | Strict compile-time and runtime validation for all API inputs, CRM webhooks, and LLM outputs. |
| **Job Queue & Anti-Ban**| **BullMQ + Redis 7** | Non-blocking webhook ingestion, rate-limited social outreach, and CRM dispatch queues. |
| **Primary Database** | **PostgreSQL 16 (Native `pg` Pool)** | Row-Level Security (RLS) ensuring strict tenant isolation via `SET LOCAL app.current_tenant_id`. |
| **Vector Database (RAG)**| **Qdrant OSS (`@qdrant/js-client-rest`)** | Isolated vector collections (`tenant_{tenant_id}_kb`) for client knowledge bases. |
| **Mobile Control Plane** | **Telegraf (Telegram Bot API)** | Interactive push alerts with inline `[Approve]` / `[Reject]` buttons for mobile moderation. |
| **API Documentation** | **Swagger / OpenAPI 3.0 (`/api/docs`)** | Complete REST contract documentation for frontend and external CRM teams. |

---

## 4. The 10-Agent Operational Engine (Qwen 2.5 Backbone)

All 10 agents operate on universal state channels, enabling them to execute seamlessly whether triggered by a social webhook or an external CRM event:

```text
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                     AGENT #10: SUPERVISOR & SYSTEM ROUTER (Express/Node)    │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
           ┌────────────────────────────┼────────────────────────────┐
           ▼                            ▼                            ▼
 ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
 │   Content & Push  │        │  Comment Engine   │        │ Inbox & CRM Sales │
 └─────────┬─────────┘        └─────────┬─────────┘        └─────────┬─────────┘
           │                            │                            │
 ┌─────────┴─────────┐        ┌─────────┴─────────┐        ┌─────────┴─────────┐
 │ Agent #1: Self-   │        │ Agent #3: Comment │        │ Agent #2: Market  │
 │ Commenter         │        │ Reply Agent       │        │ Competitive Res.  │
 │                   │        │                   │        │                   │
 │ Agent #5: Today's │        │ Agent #7: Comp.   │        │ Agent #6: Inbound │
 │ Trend Identifier  │        │ Post Engagement   │        │ DM & CRM Handler  │
 │                   │        │                   │        │                   │
 │ Agent #8: Post    │        │ Agent #4: Analytics│       │ Agent #9: CRM     │
 │ & Distribution    │        │ & Tracking        │        │ Closer & Support  │
 └───────────────────┘        └───────────────────┘        └───────────────────┘
```

### Detailed Agent Capabilities & CRM Synergy:

* **Agent #10 (Supervisor & System Router):** Directs incoming payloads (social webhook or CRM API call) to the appropriate agent.
* **Agent #1 (Self-Comment Agent):** Generates algorithm-boosting initial comments on client posts.
* **Agent #2 (Market Competitive Researcher):** Scans competitor positioning gaps and content opportunities.
* **Agent #3 (Comment Reply Agent):** Real-time public comment responder; pushes interested prospects into private DMs / CRM.
* **Agent #4 (Analytics & Tracking Agent):** Compiles engagement, reach, and CRM conversion metrics.
* **Agent #5 (Daily Trend & Need Identifier):** Drafts daily high-relevance post briefs across 4 content pillars.
* **Agent #6 (Inbound DM & CRM Live-Chat Handler):** Instant response (< 30s) across Instagram, Facebook, WhatsApp, and CRM Live Chat; captures phone/email.
* **Agent #7 (Competitor Engagement Bot):** Authority commentary on thought leader posts (requires Telegram approval).
* **Agent #8 (Post Publisher & Targeted Push):** Formats captions, hashtags, and media specifications for social channels.
* **Agent #9 (CRM Closer & Technical Support - RAG):** Deep sales qualification using Qdrant vector database (`tenant_{id}_kb`); updates CRM pipeline stages and provides booking links.

---

## 5. Pricing & Quota Status: Fully Unrestricted Operational Mode

* **Pricing & Quota Gating: OFF / DEFERRED.**
* **Full Access by Default:** All tenants operate with **unlimited access** to posting, DMs, and CRM chats.
* **Why Disabled?** Eliminates friction during internal agency operations and external CRM testing.
* **Future Commercial Switch:** When leadership decides to monetize, quota checks and Stripe/Paddle billing can be activated with a single `.env` toggle (`ENFORCE_SUBSCRIPTION_QUOTAS=true`) without rewriting agent logic.

---

## 6. Multi-Tenant Database Architecture (PostgreSQL + RLS)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenant Directory
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    brand_voice TEXT NOT NULL,
    crm_webhook_url TEXT,                     -- Webhook to forward qualified leads to client's CRM
    crm_api_key TEXT,                         -- Optional authorization key for client's CRM
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Universal Encrypted Credentials (Social & CRM)
CREATE TABLE tenant_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,            -- 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'LINKEDIN', 'TWITTER', 'EXTERNAL_CRM'
    access_token TEXT NOT NULL,
    account_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Unified Conversation & Lead Logs (Both Social & CRM)
CREATE TABLE tenant_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,             -- 'INSTAGRAM', 'WHATSAPP', 'CRM_INBOX', etc.
    sender_id VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    incoming_text TEXT NOT NULL,
    agent_response TEXT,
    intent_category VARCHAR(50),
    crm_synced BOOLEAN DEFAULT FALSE,
    is_escalated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row-Level Security
ALTER TABLE tenant_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY isolation_credentials ON tenant_credentials
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);

CREATE POLICY isolation_conversations ON tenant_conversations
    FOR ALL USING (tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid);
```

---

## 7. Phased Implementation Roadmap

```text
Phase 0: Project Scaffolding & Whitelisted Packages Setup
   ├── Node.js 20 LTS + Express.js modular setup (150-line file limit)
   ├── Docker Compose: PostgreSQL 16, Redis 7, Qdrant OSS
   └── Approved Packages: express, pg, ioredis, bullmq, @langchain/langgraph, zod, pino, telegraf

Phase 1: Database Architecture & Multi-Tenant RLS
   ├── Native pg Connection Pool (src/db/pool.ts)
   ├── RLS Query Engine with SET LOCAL app.current_tenant_id (src/db/tenantQuery.ts)
   └── SQL Migrations & Tenant Context Middleware

Phase 2: Redis Client & BullMQ Event Queue
   ├── Redis 7 singleton via ioredis (atomic locks & cache)
   └── BullMQ queues for asynchronous agent processing & rate limiting

Phase 3: Universal Pluggable Agent API & CRM Integration Core
   ├── Standardized Ingress/Egress schemas (UniversalAgentRequestSchema / ResponseSchema)
   ├── Lead Extraction Engine (Phone, Email, Intent, CRM Stage)
   └── CRM Webhook Dispatcher (syncs qualified leads to client's CRM)

Phase 4: Qdrant Vector Knowledge Base (RAG Module)
   ├── Dedicated tenant collections (tenant_{id}_kb) via @qdrant/js-client-rest
   └── Chunking, embedding generation & similarity search (cosine >= 0.72)

Phase 5: The 10-Agent Engine (Qwen 2.5 + LangGraph.js)
   ├── Universal StateGraph with Agent #10 Supervisor Task Router
   └── Strict Zod JSON output schemas & auto-repair guardrails

Phase 6: Inbound Social Webhook Listeners & Connectors
   ├── Meta Graph Webhook (Instagram & Facebook DMs/Comments)
   ├── WhatsApp Business Cloud API Gateway
   └── LinkedIn & X (Twitter) API Connectors

Phase 7: Human-in-the-Loop Telegram Control Bot
   ├── Interactive approval cards with [Approve] / [Reject] buttons
   
   └── Real-time mobile alerts for high-value leads and disputes

Phase 8: Production Hardening & Docker Deployment
   ├── Health check endpoints (/health)
   └── Multi-stage production Dockerfile & Caddy SSL reverse proxy
```
