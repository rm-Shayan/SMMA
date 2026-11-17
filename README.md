# 🤖 Styre-BOT — Enterprise AI Fleet & Multi-Tenant Automation Platform

> **Official AI Fleet Platform for [Styre Tech](https://www.linkedin.com/company/styre-tech/)**  
> Autonomous Social Media Marketing, Cold Outbound Outreach, Omnichannel CRM Triage, RAG Knowledge Base, and Master Orchestration.

---

## 📌 Executive Overview

**Styre-Bot** is an enterprise-grade, multi-tenant SaaS platform built to automate end-to-end digital agency operations. Each tenant workspace operates with an immutable, append-only double-entry credit ledger and controls a fleet of **12 specialized autonomous AI agents** governed by the **Supervisor AI (Agent #12)**.

The platform provides complete role-based workflows for **Super Admins (Platform Owners)**, **Company Admins (Agency Principals)**, **Managers (QA & Team Leads)**, and **Employees (Account Executives & Specialists)**.

---

## 🏗️ Architecture & System Topology

The platform is architected as a high-performance **pnpm Turborepo monorepo**:

```text
Styre-BOT Monorepo
│
├── apps/
│   ├── web/                    # Next.js 16 (Turbopack, App Router, React 19)
│   │   ├── src/
│   │   │   ├── app/            # 52 production-ready routes with RBAC guards
│   │   │   ├── domains/        # DDD modules (campaigns, agents, credits, social, knowledge)
│   │   │   └── shared/         # Atomic UI (atoms, molecules, organisms), RTK Query store, HTTP client
│   │   └── tests/              # Comprehensive Playwright E2E test suites
│   │
│   └── api/                    # Python 3.12+ FastAPI backend (< 140 lines per file)
│       └── app/
│           ├── core/           # RLS DB pool, security, pubsub, rate limiting, RAG engine
│           ├── modules/        # 274+ modular API routes (auth, admin, campaigns, credits, social, etc.)
│           └── worker/         # Background outbox pacing & scheduler
│
├── docs/                       # Architecture diagrams, ERD, API specs & postman collection
└── scripts/                    # Unified dev & production server runners
```

---

## 🤖 The 12-Agent Autonomous Fleet

```text
[Incoming Intent / Scheduled Cron / Webhook / Copilot Prompt]
                         │
                         ▼
             [Supervisor AI (Agent #12)]
       (Decomposes Task, Verifies Credit Ledger, Builds Execution DAG)
                         │
        ┌────────────────┼────────────────┬────────────────┐
        ▼                ▼                ▼                ▼
   [Social Fleet]  [Outreach Fleet]  [Insights Fleet]  [Internal Ops]
   #1 Own-Engage   #6 Cold Outreach  #2 Competitor     #10 Trainee & SOP
   #3 Comment Resp #9 Omnichannel    #4 Analytics      #11 Corporate RAG
   #7 Comp-Engage     Inbox          #5 Daily Brief
   #8 Publisher
        │                │
        └────────────────┴───────────────┐
                                         ▼
                         [Outbox Anti-Detection Pacer]
                   (Concurrency = 1, Jitter: 45s-3m, Daily Caps)
                                         │
                                         ▼
                 [Meta / LinkedIn / Gmail / Outlook / Webhooks]
```

### Agent Fleet Roster

| # | Agent Name | Domain | Core Capability |
|---|---|---|---|
| **1** | **Own-Post Engager** | Social | Boosts algorithmic velocity by posting contextual starter comments and engagement hooks on company posts. |
| **2** | **Competitor Researcher** | Insights | Continuous competitive intelligence: monitors competitor posting velocity, messaging angles, and sentiment. |
| **3** | **Comment Responder** | Social | Smart FAQ & objection-handling replies to public comments, with automatic human escalation for complaints. |
| **4** | **Analytics & Growth** | Insights | Cross-channel performance aggregation, conversion attribution, latency metrics, and credit burn efficiency. |
| **5** | **Daily Briefing Agent** | Insights | Delivers daily prioritized action matrices for agency teams ("Tactical Briefs"): hot leads, review items, and strategy. |
| **6** | **Outreach Engine** | Revenue | Automated multi-touch cold email and DM sequences with personalization, spin-syntax, and unsubscribe governance. |
| **7** | **Competitor Engager** | Social | High-value, non-spam commentary on trending industry posts in human-in-the-loop assisted mode. |
| **8** | **Publisher & Distributor** | Social | Scheduled omni-channel publishing to LinkedIn, Meta, and X with auto-formatting and media attachments. |
| **9** | **Inbox Responder** | Revenue | Real-time inbound lead classification, CRM deal-stage progression, and zero-latency qualification. |
| **10** | **Trainee & SOP Agent** | Internal | Evaluates employees via interactive curriculum quizzes and converts unstructured CSV/PDF files into SOP reports. |
| **11** | **Company Ops Agent** | Internal | Multi-window sliding RAG over internal company documentation with strict citations and zero hallucination. |
| **12** | **Supervisor AI** | Core | Master Orchestrator: task decomposition, agent routing, credit reservation, DAG dependency tracking, and self-healing retries. |

---

## ⚡ Styre-Bot Interactive Floating Copilot

Every screen is equipped with the **Styre Bot** autonomous assistant:
- **Floating Dock**: Accessible via bottom-right floating trigger or global hotkey `Ctrl+J` / `Cmd+J`.
- **Fleet Status Monitoring**: Real-time operational indicator (`All 12 Agents Active & Guarded`).
- **One-Click Commands**:
  - `Generate Leads`: Instant prospecting workflow.
  - `Publish Content`: Draft and schedule campaign assets.
  - `Audit Fleet`: Health check of all running tasks.
  - `Analyze Trends`: Competitive intelligence scan.
- **Voice & Multimodal Support**: Interactive voice query parsing and real-time streaming response mode.

---

## 🔐 Multi-Tenant Security & Role-Based Portals

| Role | Landing Portal | Primary Responsibilities |
|---|---|---|
| **Super Admin** | `/tenant-director` | Multi-tenant governance, credit rate cards, platform transaction audits, tenant impersonation, system metrics. |
| **Company Admin** | `/dashboard` | Agency KPI overview, campaign approvals, team management, credit top-ups, channel connectors. |
| **Manager** | `/approvals` | Human-in-the-loop safety gates, outbox review, team scheduling, agent mode overrides (`Draft` vs `Auto`). |
| **Employee** | `/workspace` | Assigned tasks, omnichannel inbox triage, lead qualification, SOP training & certification. |

---

## 🛠️ Tech Stack Reference

### Frontend (`apps/web`)
- **Framework**: Next.js 16.4.6 (App Router, Turbopack, Partial Prerendering)
- **State Management**: Redux Toolkit & RTK Query (`dashboardApi`, `agentsApi`, `campaignsApi`, `creditsApi`, etc.)
- **Styling**: Tailwind CSS with custom Styre brand tokens (`#063cbc` primary, `#f8f9ff` surface)
- **Component Architecture**: Atomic Design (`atoms`, `molecules`, `organisms`, `templates`)
- **Icons & UI**: Lucide React, Radix UI Primitives, `react-hot-toast`
- **Testing**: Playwright End-to-End Test Suite (`29/29` passing tests)

### Backend (`apps/api`)
- **Framework**: FastAPI (Python 3.12+) running on Uvicorn ASGI
- **Architecture Rule**: Strict **< 140 lines per Python file** across all modules
- **Database**: PostgreSQL with Row-Level Security (RLS) and connection health circuit-breaker
- **ORM & Data**: SQLAlchemy 2.0 with unified connection pooling
- **Resilience**: 50ms fast-socket health probe (`is_db_reachable()`) with instant fallback responses
- **PubSub & Sockets**: Real-time event streaming and WebSocket client notification multiplexing

---

## 🗺️ Complete Frontend Routes (52 Routes)

| Category | Route | Description |
|---|---|---|
| **Auth** | `/login` | Multi-role sign-in with quick-fill demo buttons |
| **Auth** | `/register` | Agency onboarding & workspace creation |
| **Auth** | `/accept-invite` | Team member invite acceptance |
| **Auth** | `/forgot-password` | Password recovery request |
| **Auth** | `/reset-password` | Secure token password reset |
| **Overview** | `/dashboard` | Executive KPI dashboard & tactical daily action briefs |
| **Revenue** | `/leads` | Prospect CRM pipeline with CSV import/export |
| **Revenue** | `/campaigns` | Multi-channel outbound campaign manager |
| **Revenue** | `/sequences/new` | Multi-step outreach sequence builder |
| **Revenue** | `/inbox` | Unified omnichannel messaging inbox |
| **Operations** | `/agents` | Fleet directory & agent capability controls |
| **Operations** | `/agents/[agentId]`| Deep-dive agent configuration & run logs |
| **Operations** | `/agents/runs` | Real-time execution history & credit burn |
| **Operations** | `/agents/stream` | Live agent token streaming monitor |
| **Operations** | `/approvals` | Human-in-the-loop content review & decision portal |
| **Operations** | `/publishing` | Social post creator, media queue & calendar |
| **Operations** | `/channels` | Social connector integrations (LinkedIn, Meta, X) |
| **Operations** | `/workflows` | Multi-agent automation visual workflows |
| **Intelligence**| `/competitor-radar`| Competitor intelligence & sentiment analysis |
| **Intelligence**| `/knowledge-base`| Vector document ingestion & data source manager |
| **Intelligence**| `/knowledge-base/analyze`| Document chunking & semantic search tester |
| **Intelligence**| `/content-library`| Approved agency creative asset repository |
| **Intelligence**| `/media` | Generated imagery, audio & video library |
| **Finance** | `/credits` | Real-time ledger, balance alerts & Stripe checkout |
| **Finance** | `/credits/invoices`| Official transaction history & billing receipts |
| **Finance** | `/credits/success` | Post-payment credit deposit confirmation |
| **Finance** | `/credits/cancel` | Cancelled checkout recovery page |
| **Training** | `/academy` | SOP curriculum & interactive certification |
| **Training** | `/academy/quiz` | Timed knowledge-assessment quizzes |
| **Training** | `/academy/quiz/result`| Verified passing score & certification badge |
| **Workforce** | `/workspace` | Role-tailored personal daily hub |
| **Workforce** | `/workforce` | Agent vs human capacity workload planner |
| **Workforce** | `/team` | Agency team directory & RBAC role assignments |
| **Enterprise** | `/tenant-director`| Super Admin platform command center |
| **Enterprise** | `/tenant-director/pricing`| Credit unit economics & plan pricing |
| **Enterprise** | `/tenant-director/transactions`| Global platform-wide credit transactions |
| **Enterprise** | `/admin/tenants` | Tenant workspace directory & provisioning |
| **Governance** | `/audit-log` | Immutable security audit trail with JSON viewer |
| **Governance** | `/reporting` | Analytics snapshots, conversion exports & reports |
| **Settings** | `/settings` | Agency brand profiles, API keys & white-labeling |
| **Settings** | `/notifications`| Real-time alerts feed & delivery preferences |
| **Settings** | `/organization` | Organization hierarchy & multi-branch config |
| **Settings** | `/organization/overview`| High-level agency structure snapshot |

---

## 🚀 Quick Start & Installation

### Prerequisites
- **Node.js**: `v20.0.0+`
- **Package Manager**: `pnpm` (`v9.0.0+`)
- **Python**: `3.12+`

### 1. Clone & Install Dependencies
```powershell
# Clone the repository
git clone https://github.com/rm-Shayan/Styre-Agent.git
cd Styre-Agent

# Install monorepo frontend dependencies
pnpm install

# Setup Python virtual environment for backend
cd apps/api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
cd ../..
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```powershell
Copy-Item .env.example .env
```
Default local settings:
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:5432/styre_db
JWT_SECRET=styre_secret_key_2026
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
```
*(Note: If PostgreSQL is offline, the backend automatically boots in zero-hang resilient mode with instant mock fallbacks).*

### 3. Run the Monorepo (Frontend + Backend)
You can start both servers together:
```powershell
# Terminal 1: Start Backend (FastAPI on http://localhost:8000)
$env:PYTHONPATH="apps/api"; apps/api/.venv/Scripts/python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# Terminal 2: Start Frontend (Next.js on http://localhost:3000)
pnpm --filter web dev
```
Open **`http://localhost:3000`** in your browser. You will be greeted by the `/login` portal.

---

## 🧪 Testing & Verification

### Playwright End-to-End Test Suite
```powershell
# Run full E2E suite
pnpm --filter web test:e2e
```
* **Authentication & Role Guards**: Verifies unauthenticated redirects to `/login` and role permissions.
* **API Coverage**: Validates live contracts across all 274+ endpoints.
* **UI Behavior**: Verifies Styre Bot floating copilot, modals, drawers, and charts.

### Frontend Production Build
```powershell
pnpm --filter web build
```
Compiles and generates all **52/52** static and dynamic pages with 0 TypeScript or lint errors.

---

## 🏢 Brand & Licensing

- **Brand**: Styre-Bot — Built for [Styre Tech](https://www.linkedin.com/company/styre-tech/)
- **License**: Proprietary — All rights reserved by Styre Tech.
