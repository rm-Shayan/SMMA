# 🤖 Styre-BOT — 12-Agent Platform & Multi-Tenant Automation Backend

> **Multi-Tenant Social Media Automation, Outbound Outreach, Inbound AI Sales & Enterprise Orchestration Platform.**

---

## 📌 Overview

**Styre Bot** ek enterprise-grade multi-tenant SaaS backend hai jahan har company credits purchase karke **12 specialized AI agents** ko utilize karti hai. System ka central coordinator **Agent #12 (Supervisor)** complex tasks ko decompose, schedule aur baqi 11 agents ko route karta hai.

Platform day-1 se strict multi-company tenancy, append-only double-entry credit ledger, aur anti-detection human-like pacing ke sath build kiya gaya hai.

---

## 🏗️ Architecture & The 12-Agent Ecosystem

```text
[User Request / Webhook / Cron] 
              │
              ▼
   [Supervisor (Agent #12)] ──(Task Decomposition & Credit Check)
              │
              ▼
    [Redis + BullMQ Queue]
              │
    ┌─────────┼─────────────────────────┬─────────────────────────┐
    ▼         ▼                         ▼                         ▼
 [Social]  [Messaging]             [Insights]                [Internal]
 #1, #3,   #6 Outreach,            #2 Competitor Research,   #10 Trainee & SOP,
 #7, #8    #9 Inbox Responder      #4 Analytics,             #11 Company Ops (RAG)
                                   #5 Daily Brief
              │
              ▼
  [Outbox Pacing Engine (Concurrency = 1 per account, Jitter 45s-3m)]
              │
              ▼
 [External Platforms: Meta / LinkedIn / Gmail / Outlook / ERP]
```

### 12 Specialized Agents Summary

| # | Agent Name | Domain | Primary Responsibility |
|---|---|---|---|
| **1** | **Own-Post Engager** | Social | Apni published posts par conversation shuru karne ke liye engagement comments & CTAs post karna. |
| **2** | **Competitor Researcher** | Insights | Competitors ki posts, engagement, pricing aur content strategy par continuous research reports banana. |
| **3** | **Comment Responder** | Social | Company posts par public comments ka smart FAQ/Knowledge-base driven reply dena (Complaint escalation ke sath). |
| **4** | **Analytics** | Insights | Cross-platform performance, open rates, deals pipeline, aur credit usage metrics ki aggregated reporting. |
| **5** | **Daily Brief** | Insights | Har subah employee ke liye prioritized action plan ("What today needs"): trends, pending tasks & post ideas. |
| **6** | **Outreach (DM / Email)** | Messaging | Personalized cold email / DM outreach campaigns run karna aur follow-up sequences coordinate karna. |
| **7** | **Competitor Engager** | Social | Competitor posts identify karke high-value comment draft karna (Human-in-the-loop assisted mode). |
| **8** | **Publisher & Distributor** | Social | Content calendar ke mutabiq posts draft karna, schedule karna aur target channels par live publish karna. |
| **9** | **Inbox Responder** | Messaging | Inbound emails aur DMs triage karna (Lead classification, support answers, CRM deal stage updates). |
| **10** | **Trainee & SOP Agent** | Internal | Company SOPs se interns ko train/quiz karna aur unstructured CSV/Excel data se structured reports generate karna. |
| **11** | **Company Ops Agent** | Internal | Corporate knowledge base par RAG (Retrieval-Augmented Generation) based strictly cited answers aur internal ops automation. |
| **12** | **Supervisor** | Core | Master Orchestrator: multi-step request handling, agent task routing, retries, aur credit budget governance. |

---

## ⚡ Key Highlights & Core Capabilities

- **Strict Multi-Tenancy:** Har database table mein `company_id` column aur PostgreSQL connection pool level par Row-Level Security (RLS) enforcement.
- **Append-Only Double-Entry Credit Ledger:** Har credit action (`purchase`, `allocate`, `reserve`, `consume`, `release`, `revoke`, `expire`) immutable audit record banata hai.
- **Anti-Ban Outbox Pacing:** Meta aur LinkedIn bans se bachne ke liye draft aur dispatch logic decoupled hain. Serial execution (concurrency = 1 per account), 45s–3m random jitter, typing speed simulation, hourly/daily caps aur auto-throttling shamil hain.
- **Enterprise Security & KMS Encryption:** OAuth tokens, passwords aur ERP credentials table mein plain-text kabi store nahi hote (`_enc` fields with AES-256-GCM encryption).
- **RAG & Vector Embeddings:** Qdrant Vector DB / `pgvector` ke zariye high-accuracy knowledge retrieval with source citations.

---

## 🛠️ Tech Stack

- **Runtime & Language:** [Node.js](https://nodejs.org/) (>= 20.0.0) & [TypeScript](https://www.typescriptlang.org/)
- **Web Framework:** [Express.js](https://expressjs.com/)
- **Relational Database:** [PostgreSQL 16](https://www.postgresql.org/) (`pg` client)
- **Queuing & Background Jobs:** [Redis 7](https://redis.io/) & [BullMQ](https://docs.bullmq.io/)
- **Vector Database:** [Qdrant](https://qdrant.tech/) (`@qdrant/js-client-rest`)
- **AI / LLM Framework:** [LangChain](https://js.langchain.com/) / [LangGraph](https://langchain-ai.github.io/langgraphjs/) + Groq / Qwen Models
- **Security & Validation:** [Zod](https://zod.dev/), AES-256 encryption, Webhook signatures
- **Logging:** [Pino](https://getpino.io/) & `pino-pretty`

---

## 📂 Project Directory Structure

```text
Styre-BOT/
├── .env.example                    # Sample environment variables
├── docker-compose.yml              # Local infrastructure (Postgres, Redis, Qdrant)
├── ERD.sql                         # Complete database schema DDL & ENUMs
├── prd.md                          # Detailed Product Requirements Document (PRD)
├── package.json                    # Dependencies and runtime scripts
├── tsconfig.json                   # TypeScript compiler configuration
└── src/
    ├── index.ts                    # Application bootstrapper & HTTP server entry
    ├── core/                       # Core foundational infrastructure
    │   ├── ai/                     # LLM clients, guardrail classifiers, schema validators
    │   ├── config/                 # Env parser, logger, Redis connection pool
    │   ├── database/               # Postgres pool, tenant-scoped queries, vector client
    │   ├── middlewares/            # Tenant isolation, auth rate-limiting, RBAC, error handlers
    │   └── security/               # KMS AES-256 encryption, signature verification, egress policy
    ├── db/
    │   ├── migrate.ts              # Database migration runner
    │   └── seed.ts                 # Database seed data runner
    └── modules/                    # Domain feature modules
        ├── agents/                 # Agent controller, policy validator, and audit logger
        ├── analytics/              # Performance snapshots & analytics metrics
        ├── auth/                   # JWT & API key authentication
        ├── credentials/            # Token monitor & encrypted credential management
        ├── credits/                # Double-entry ledger & wallet controllers
        ├── inbox/                  # Inbound message & conversation management
        ├── integrations/           # Google Auth, Calendar, Sheets & SMTP connectors
        ├── leads/                  # Lead management services
        ├── scheduler/              # BullMQ queue runner & cron scheduler
        ├── social/                 # Meta, LinkedIn, WhatsApp & Twitter dispatchers
        ├── tenants/                # Tenant onboarding, companies & teams management
        ├── tools/                  # Dynamic external tool executor & egress watchdog
        ├── training/               # SOP document training & quiz evaluator
        └── webhooks/               # Inbound Meta & WhatsApp webhook processors
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v20 or higher)
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

---

### 2. Setup Local Infrastructure

Docker Compose ke zariye PostgreSQL, Redis aur Qdrant start karein:

```bash
docker-compose up -d
```

Verify containers are healthy:
```bash
docker ps
```
- **PostgreSQL:** `localhost:5432`
- **Redis:** `localhost:6379`
- **Qdrant:** `localhost:6333`

---

### 3. Environment Configuration

Environment template file ko copy karein:

```bash
cp .env.example .env
```

`.env` file mein required credentials fill karein:

```env
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smma_saas

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Vector DB (Qdrant)
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# LLM Inference (Groq API - Qwen 2.5)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b

# Security & Webhook Tokens
META_APP_SECRET=your_meta_app_secret
META_VERIFY_TOKEN=your_meta_verify_token
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token
```

---

### 4. Install Dependencies

```bash
npm install
```

---

### 5. Database Migration & Seeding

Database tables aur seed records initialize karein:

```bash
# Run schema migrations
npm run migrate

# Run initial seed data
npm run seed
```

---

### 6. Run the Application

#### Development Mode (with hot-reload):
```bash
npm run dev
```

#### Production Build & Run:
```bash
# Compile TypeScript to /dist
npm run build

# Start production server
npm start
```

API server standard port par live hoga: `http://localhost:5000`

---

## 📖 Specifications & Architecture Docs

* **Product Requirements Document (PRD):** Detailed 11-section specifications ke liye **[`prd.md`](./prd.md)** read karein.
* **Database Architecture & Schema:** Production DDL, ENUMs aur table relationships ke liye **[`ERD.sql`](./ERD.sql)** refer karein.

---

## 🔒 Security & Contribution Rules

1. **No Hardcoded Secrets:** API keys ya access tokens code mein kabhi hardcode na karein; hamesha environment variables aur KMS encryption use karein.
2. **Tenant Scoping:** Har database query mein `company_id` filter lazmi hona chahiye.
3. **Paced Outbound:** Outbound messaging hamesha `outbox_jobs` queue ke through dispatch hogi; direct synchronous third-party API calls strictly prohibited hain.
