# SMMA AI Agent Platform — Frontend Documentation

> **STATUS (current):** The frontend **exists and is 100% built** — Next.js 16.4.6 (App Router, Turbopack, Tailwind v4) under `frontend/`, 11 routes, shared app shell, `npm run build` green. It renders built-in sample data; the active milestone is **API Integration & State Management Layer**. Start at [05-progress-handoff.md](./05-progress-handoff.md), then [07-api-integration.md](./07-api-integration.md) and [08-frontend-architecture.md](./08-frontend-architecture.md).

## Project context

This repository contains a multi-tenant backend for a social-media management, inbound AI sales, and engagement platform, plus the Next.js frontend that consumes it. The Express API serves tenant onboarding, authenticated agent workflows, social-channel credentials, conversations, lead capture, scheduled publishing, and summary analytics. The backend runs a LangGraph workflow with a supervisor and specialized agent nodes. It also integrates Meta and WhatsApp inbound webhooks, social publishing adapters, PostgreSQL, Redis/BullMQ, Qdrant, and Google Sheets/calendar/email services to varying degrees.

The product vision in the source documents is broader than the API currently exposes. Treat the running source code and mounted routes as the evidence for implemented behavior; treat roadmap-only features as planned. Several source documents are stale or inconsistent: `execution_phase.md` marks all phases pending despite implemented code, and older memory/application-flow notes do not always match the current implementation. See [05-progress-handoff.md](./05-progress-handoff.md) for the concrete distinctions and known gaps.

## Purpose of the frontend

This documentation is the working contract for the UI: the API-backed pages, controls, role context, and states. The frontend must not present unavailable operations as working features, and must not imply that a visual restriction replaces backend authorization.

The frontend lives in `frontend/` with client routes in `frontend/app/` (Next.js App Router). The paths in [01-page-inventory.md](./01-page-inventory.md) are implemented client routes, not backend endpoints.

## User roles

The database and authentication code define **four roles**:

- **SUPERADMIN** — platform-level operator. Can list tenants, target a tenant in the routes that explicitly support that behavior, and is the only role that can call `POST /api/v1/tenants/register`. Can create any API-creatable user role.
- **CLIENT_OWNER** — tenant user who can create tenant users, but cannot create SUPERADMIN users. Tenant-scoped data resolves to their tenant. Also allowed: publishing, credentials, approvals, escalation, tenant PATCH.
- **AGENT_OPERATOR** — tenant user with read access to analytics, leads, inbox (list/reply) and agent chat. **Not** permitted: `/posts/publish`, `/credentials`, `/auth/create-user`, tenant PATCH, escalation.
- **TRAINEE** — intern role. Only `/training/ask` and `/training/sessions` are permitted; every operational module returns 403. Cannot be created via `POST /auth/create-user`.

> Earlier revisions of this document described three roles and a `USER` role name. There is no `USER` role in the `user_role` enum; the operator role is `AGENT_OPERATOR`. Use [01-page-inventory.md](./01-page-inventory.md) for the enforced per-route matrix.

Role restrictions are explicit per router via `requireRole(...)`. Tenant scoping is applied by resolving `x-tenant-id` (SUPERADMIN) or the token's `tenantId` (tenant roles). The UI may show least-privilege navigation as a product choice, but the API is the security boundary.

## Main modules

1. Authentication and user creation
2. Tenant registration and organization profile
3. AI agent workspace and execution traces
4. Inbox and human replies/escalation
5. Captured leads
6. Social post composition and scheduling
7. Social channel credentials
8. Analytics summary
9. Meta/WhatsApp webhooks and background processing (backend operations; no end-user webhook-management screen)
10. Google Sheets, Google Calendar, and email integrations (backend services, with only some tenant settings exposed)

The agent workflow includes supervisor routing, inbound DM, support/closer, self-comment, trend planning, publishing, research, comment replies, analytics, and competitor engagement nodes. Node availability does not imply a corresponding standalone UI workflow or that every external side effect is wired.

## Documentation reading order

1. `docs/README.md` — project context and rules.
2. `docs/01-page-inventory.md` — route, role, screen, and overlay inventory.
3. `docs/02-ui-requirements.md` — page-level controls, interactions, and states.
4. `docs/03-design-system.md` — shared visual language (tokens implemented in `app/globals.css`).
5. `docs/04-stitch-prompts.md` — reusable prompts for visual exploration.
6. `docs/05-progress-handoff.md` — completed work, current milestone, and next task.
7. `docs/07-api-integration.md` — endpoint ↔ page mapping, headers, contracts, status codes.
8. `docs/08-frontend-architecture.md` — folder structure, services, and state conventions.

## Instructions for every future AI agent

Whenever a new AI agent opens this project, it must:

1. Read `docs/README.md` first.
2. Read all the other Markdown files in `docs/`.
3. Read `docs/05-progress-handoff.md` to learn the current milestone.
4. Understand the existing decisions and completed work.
5. Continue from the recorded next task.
6. Never repeat completed work without a reason.
7. Update the progress and handoff documentation after completing tasks.

Additional project-specific rules:

- Backend source is read-only for the frontend stream: do not modify `backend/` files, API contracts, database schemas, or backend dependencies unless the user explicitly changes the scope.
- Before implementing a control, confirm its operation is supported by a current API route (see [07-api-integration.md](./07-api-integration.md)). Do not infer CRUD, search, pagination, OAuth, billing, or approval capabilities from a roadmap description.
- Keep implemented and planned capabilities visibly distinct. In particular, do not claim that a post composer can display a schedule/calendar when no list-post endpoint exists.
- Treat the role matrix as a UI-navigation proposal backed by `requireRole` checks in source, not as proof that every endpoint is fully hardened — re-check route middleware before relying on access control.
- The framework decision is made: **Next.js 16.4.6 + React 19 + Tailwind v4** in `frontend/`. Per `frontend/AGENTS.md`, read the guides in `frontend/node_modules/next/dist/docs/` before writing Next.js-specific code — this Next.js version has breaking changes.
- After any frontend work, update `05-progress-handoff.md` with what changed, what remains, decisions, unresolved questions, and a precise next task.

## Source of truth

Use the backend implementation under `backend/src/` for current behavior. Supporting product and engineering context is in `backend/prd_v6_0.md`, `backend/agent.md`, `backend/execution_phase.md`, `backend/memory.md`, and `backend/application flow.md`. Where those sources disagree, prefer current route/controller/service behavior and record the discrepancy rather than silently treating a plan as implemented. Frontend behaviour and wiring conventions live in `frontend/docs/07-api-integration.md` and `frontend/docs/08-frontend-architecture.md`.
