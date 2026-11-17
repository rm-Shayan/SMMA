# 🚀 Styre AI - Enterprise SMMA Automation Frontend

Welcome to the **Styre AI** Frontend repository. This is an enterprise-grade multi-tenant Social Media Marketing Agency (SMMA) platform built with Next.js 16 (Turbopack, App Router), Redux Toolkit & RTK Query, Tailwind CSS, Lucide icons, and full role-based access control.

---

## 📑 Table of Contents
1. [Tech Stack & Architecture](#-tech-stack--architecture)
2. [Quick Start & Setup](#-quick-start--setup)
3. [Environment Configuration](#-environment-configuration)
4. [Platform Routes & Status](#-platform-routes--status)
5. [Authentication & Test Credentials](#-authentication--test-credentials)
6. [State Management & RTK Query APIs](#-state-management--rtk-query-apis)
7. [Testing & Verification Guide](#-testing--verification-guide)
8. [Production Build](#-production-build)

---

## 🛠️ Tech Stack & Architecture

- **Framework**: Next.js 16.4.6 (App Router, Turbopack, Partial Prerendering)
- **Styling**: Tailwind CSS, PostCSS, Custom Design Tokens matching Google Stitch specs (`#063cbc` primary theme, `#f8f9ff` surface)
- **State Management**: Redux Toolkit & RTK Query (Fully centralized in `redux/store.ts` and `redux/api/`)
- **UI Components & Icons**: Radix UI primitives, Lucide React, `react-hot-toast`
- **Security & RBAC**: Next.js Proxy/Middleware, JWT Token persistence with auto cookie-sync, Role-based route guarding (`AuthorizationGuard.tsx`)

---

## ⚡ Quick Start & Setup

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm
- Live Backend running on `http://127.0.0.1:8000` (FastAPI)

### Installation & Run

```bash
# Navigate to web app
cd backend/apps/web

# Install dependencies
npm install

# Run development server (Turbopack)
npm run dev
```

The application will start at **`http://localhost:3000`**.

---

## ⚙️ Environment Configuration

Create or update `.env` in the `backend/apps/web/` directory:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/v1
NEXT_PUBLIC_DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
NEXT_PUBLIC_APP_ENV=development
```

---

## 🗺️ Platform Routes & Status (40 Pre-rendered Routes)

| Area | Route | Description | Backend Connection |
|---|---|---|---|
| **Auth** | `/login` | Multi-role user authentication | 🟢 Live Connected |
| **Auth** | `/register` | Tenant signup & onboarding | 🟢 Live Connected |
| **Auth** | `/accept-invite` | Team member invite onboarding | 🟢 Live Connected |
| **Auth** | `/forgot-password` | Password recovery trigger | 🟢 Live Connected |
| **Auth** | `/reset-password` | Secure token password reset | 🟢 Live Connected |
| **Revenue** | `/leads` | Prospect pipeline & CSV export/import | 🟢 Live Connected (Contacts API) |
| **Revenue** | `/campaigns` | AI Outreach campaigns engine | 🟢 Live Connected |
| **Revenue** | `/sequences/new` | Multi-touch sequence designer | 🟢 Live Connected |
| **Revenue** | `/inbox` | Omnichannel communication hub | 🟢 Live Connected (Inbox API) |
| **Finance** | `/credits` | Ledger, wallet balances & purchase modal | 🟢 Live Connected (Credits API) |
| **Finance** | `/credits/invoices` | Transaction receipts & invoice history | 🟢 Live Connected (Credits API) |
| **Operations** | `/agents` | 12-agent autonomous fleet control | 🟢 Live Connected (Agents API) |
| **Operations** | `/approvals` | Human-in-the-loop QA gate & bulk actions | 🟢 Live Connected (Approvals API) |
| **Operations** | `/publishing` | Social media post scheduler & calendar | 🟢 Live Connected (Social API) |
| **Operations** | `/channels` | Social media connectors & integrations | 🟢 Live Connected (Connectors API) |
| **Intelligence** | `/competitor-radar`| Competitor monitoring & intel tracker | 🟢 Live Connected (Competitors API) |
| **Intelligence** | `/knowledge-base`| RAG vector docs & ingestion dialog | 🟢 Live Connected (Knowledge API) |
| **Intelligence** | `/content-library`| Creative asset repository | 🟡 Integrated with Mock Fallback |
| **Training** | `/academy` | SOP Academy & operational curriculum | 🟢 Live Connected (Knowledge API) |
| **Training** | `/academy/quiz` | Interactive certification quizzes | 🟢 Live Connected |
| **Training** | `/academy/quiz/result`| Quiz score verification | 🟢 Live Connected |
| **Workforce** | `/team` | Agency team roster & invitations | 🟢 Live Connected (Team API) |
| **Workforce** | `/workforce` | AI Agent & human workforce capacity | 🟢 Live Connected |
| **Workforce** | `/workspace` | Role-tailored workspace center | 🟢 Live Connected |
| **Enterprise** | `/tenant-director` | Multi-tenant organization manager | 🟢 Live Connected (Admin API) |
| **Enterprise** | `/tenant-director/pricing`| Credit unit price configuration | 🟢 Live Connected |
| **Enterprise** | `/tenant-director/transactions`| Platform-wide transaction audit | 🟢 Live Connected |
| **Enterprise** | `/audit-log` | Security audit trail & JSON inspector | 🟡 Integrated with Mock Fallback |
| **Overview** | `/dashboard` | Executive KPI dashboard & insights | 🟢 Live Connected (Dashboard API) |
| **Settings** | `/settings` | Agency, brand & personal settings | 🟢 Live Connected |
| **Settings** | `/notifications` | Live notification feed & alerts | 🟢 Live Connected |

---

## 🔑 Authentication & Test Credentials

The backend includes seeded credentials for testing role-based access control:

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@styre.ai` | `StyreAdmin2026!` | Global access across all tenants, Director Console, Pricing, System Logs |
| **Company Admin**| `admin@agency.com` | `Password123!` | Full agency scope, billing, agents, publishing, team |
| **Manager** | `manager@agency.com`| `Password123!` | Approvals, campaigns, inbox, analytics |
| **Employee** | `employee@agency.com`| `Password123!` | Task-focused workspace, knowledge base, SOP academy |

---

## 🔄 State Management & RTK Query APIs

All API communications are orchestrated through RTK Query services located under `frontend/redux/api/`:
- `authApi.ts`: Login, register, logout, session verification
- `leadsApi.ts`: Prospect list, lead creation modal, delete
- `campaignsApi.ts`: Campaign listing, launch, status toggles
- `inboxApi.ts`: Real-time inbox threads, messaging, AI drafts
- `creditsApi.ts`: Wallet balances, ledger transactions, credit purchase mutations
- `agentsApi.ts`: 12-agent fleet statuses, autonomy mode switches
- `approvalsApi.ts`: Human-in-the-loop review queue, approve/reject decisions
- `socialApi.ts`: Social post drafting, scheduled calendar, multi-channel publishing
- `connectorsApi.ts`: Social connector channels (LinkedIn, Twitter, Meta, etc.)
- `competitorsApi.ts`: Competitor tracking and real-time intelligence
- `knowledgeApi.ts`: Document uploading, vector search, SOP academy
- `teamApi.ts`: Agency roster, employee task allocations
- `adminApi.ts`: Super admin tenant director, credit pricing, system metrics
- `dashboardApi.ts`: Executive KPI aggregates, tactical briefs

---

## 🧪 Testing & Verification Guide

1. **Verify Development Mode**:
   ```bash
   npm run dev
   ```
2. **Verify Static Production Build**:
   ```bash
   npm run build
   ```
   *Expected Output: `✓ Generating static pages using 3 workers (40/40)` with `0 errors`.*
3. **Verify Route Access**:
   Navigate to `http://localhost:3000/login`, login with `admin@styre.ai`, and test switching between pages using the Sidebar navigation.
4. **Offline / Fallback Resilience**:
   If the backend is temporarily offline, pages gracefully fallback to standard empty states or local mock caches without crashing the application.

---

## 🏗️ Production Build

To build for production deployment:

```bash
npm run build
npm start
```
