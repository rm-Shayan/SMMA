# Page Inventory

> **STATUS (current): UI PHASE COMPLETE.** All 11 routes below are implemented in `frontend/app/` (Next.js 16 App Router) and compile with `npm run build` (0 errors). Pages render built-in sample data only — **no page is wired to the backend API yet**. The active milestone is *API Integration & State Management Layer*. See [05-progress-handoff.md](./05-progress-handoff.md), [07-api-integration.md](./07-api-integration.md), and [08-frontend-architecture.md](./08-frontend-architecture.md).

## Counting rules and totals

- **11 unique frontend pages**
- **11 page-level screens**
- **4 user roles:** `SUPERADMIN`, `CLIENT_OWNER`, `AGENT_OPERATOR`, `TRAINEE`
  - Note: there is **no `USER` role** in the backend `user_role` enum. The generic/standard operator role is `AGENT_OPERATOR` (`backend/src/core/middlewares/rbac.middleware.ts`, migration `013_add_trainee_role.sql`).
  - `TRAINEE` exists in the enum and may call training endpoints only; it cannot be created through `POST /auth/create-user` (that controller's Zod enum accepts only the first three roles).
- Tabs, modals, drawers, confirmations, and responsive layouts are states within a page; they are not additional pages or screens.
- These are frontend routes implemented in `frontend/app/`. The backend exposes API paths only and has no frontend router.
- Inventory is based on current backend routes (source of truth: `backend/src/modules/*/*.routes.ts`).

## Page and access matrix

Backend paths below are the existing API paths. Client paths are proposed UI paths, not backend endpoints.

| # | Frontend route (implemented) | Page | Backend capability | SUPERADMIN | CLIENT_OWNER | AGENT_OPERATOR | TRAINEE |
|---|---|---|---|---|---|---|---|
| 1 | `/login` | Sign in | `POST /api/v1/auth/login`, `GET /api/v1/auth/me` | Public sign-in | Public sign-in | Public sign-in | Public sign-in |
| 2 | `/register` | Tenant registration | `POST /api/v1/tenants/register` | **Allowed** (Bearer auth required) | 403 Forbidden | 403 Forbidden | 403 Forbidden |
| 3 | `/dashboard` | Overview and analytics | `GET /api/v1/analytics`, `GET /api/v1/analytics/:tenantId` | Authenticated; can target a tenant | Authenticated; own tenant | Authenticated; own tenant | 403 Forbidden |
| 4 | `/agents` | Agent workspace | `POST /api/v1/agents/chat`, `POST /api/v1/agents/direct/:agentName` | chat + direct | chat + direct | chat only (60 req/min) | 403 Forbidden |
| 5 | `/inbox` | Conversations | `GET /api/v1/inbox/conversations`, `POST .../reply`, `PATCH .../escalate` | list, reply, escalate | list, reply, escalate | list, reply (escalate = 403) | 403 Forbidden |
| 6 | `/leads` | Captured leads | `GET /api/v1/agents/leads` | Authenticated; can specify `tenantId` | Authenticated; own tenant | Authenticated; own tenant | 403 Forbidden |
| 7 | `/publishing` | Compose and schedule a post | `POST /api/v1/posts/publish` | Allowed | Allowed | **403 Forbidden** | 403 Forbidden |
| 8 | `/channels` | Social channel credentials | `GET/POST/DELETE /api/v1/credentials` | Allowed | Allowed | **403 Forbidden** | 403 Forbidden |
| 9 | `/organization` | Organization profile and settings | `GET /api/v1/tenants/:id`, `PATCH /api/v1/tenants/:id` | GET yes; PATCH yes | GET own; PATCH own | GET own; **PATCH 403** | 403 Forbidden |
| 10 | `/team` | Create a user | `POST /api/v1/auth/create-user` | Can create all three API-creatable roles | Can create tenant users except SUPERADMIN | 403 Forbidden | 403 Forbidden |
| 11 | `/admin/tenants` | Tenant directory | `GET /api/v1/tenants`, `GET/PATCH /api/v1/tenants/:id` | All tenants; PATCH any | Own tenant; PATCH own | GET own; **PATCH 403** | 403 Forbidden |

### Actual authorization caveat

The table describes what the router middleware currently enforces (`requireAuth` + `requireRole`), read directly from `backend/src/modules/*/*.routes.ts`. Key corrections versus earlier revisions of this document:

- **Tenant registration is no longer public.** `tenant.routes.ts` locks `POST /api/v1/tenants/register` to `requireRole(['SUPERADMIN'])` with an explicit source comment: *"Registration locked to SUPERADMIN (internal/provisioned onboarding). Public self-signup disabled."* The `/register` screen must therefore be reachable only for SUPERADMIN sessions, or relabelled as an internal provisioning form.
- **Credentials and publishing are owner-only.** `/channels` and `/publishing` call `requireRole(['SUPERADMIN', 'CLIENT_OWNER'])`; an AGENT_OPERATOR session receives 403 and the UI must not present those actions as available to that role.
- The client is not an authorization boundary: UI visibility restrictions are cosmetic, the API remains the security boundary.

## Page contents, tabs, dialogs, and drawers

| Page | Primary screen contents | Tabs / overlays within the page |
|---|---|---|
| Sign in | Email and password form, validation, sign-in result | Password visibility toggle is an inline control, not a modal |
| Tenant registration | Company name, contact email, brand voice, optional Google Sheet ID and booking URL | **SUPERADMIN-only screen.** Success/error confirmation; the endpoint creates an organization record only and never creates a login |
| Overview and analytics | Tenant context, lead/conversation/post summary cards, hot-lead count, channel breakdown | SUPERADMIN tenant selection can be an inline selector; no separate screen |
| Agent workspace | Message/task composer, channel input, optional direct-agent selection, response, lead score/stage/review indicator, execution trace | Optional result/trace tabs; confirmation before clearing unsaved prompt; not additional screens |
| Conversations | Conversation list, channel and escalation indicators, selected conversation details, message history available from the list data, reply composer | Platform filter; selected-conversation detail drawer on narrow/split layouts; reply confirmation/error inline |
| Captured leads | Lead table with contact, source channel, inquiry, score, stage, and created date | Lead detail drawer may show the same returned fields; no edit/delete actions |
| Compose and schedule | Platform, draft text, optional image URL, optimal-time or exact-time controls, submit result | Schedule options can be a collapsible section; confirmation dialog for submitting |
| Social channels | Connected account rows, platform, account ID, token expiry, connect/disconnect actions | Connect form modal; disconnect confirmation dialog |
| Organization profile | Company name, brand voice, contact email, Google Sheet ID, booking calendar URL, active state | Profile/integrations sections may be tabs on this same page; save confirmation |
| Create a user | Full name, email, password, role, tenant assignment where allowed | Create-user confirmation/result; no user list because there is no list-users endpoint |
| Tenant directory | SUPERADMIN tenant table with company, plan, email, active state, created date | Tenant detail/edit drawer using the existing GET/PATCH endpoints; no delete action |

No page is specified for billing, quota usage, knowledge-base document management, a publishing calendar/history, social post analytics, OAuth callbacks, Telegram approvals, or webhook configuration because the current backend does not expose the corresponding UI/API workflow.

Backend endpoints that exist today but have **no dedicated screen** yet: `GET/POST /api/v1/approvals` (human approval queue), `POST /api/v1/training/docs|ask`, `GET /api/v1/training/sessions`, `POST /api/v1/tools/openapi|manual`, `GET /api/v1/tools`, `POST /api/v1/tools/:toolName/test`. See [07-api-integration.md](./07-api-integration.md) for the decision log.

## Frontend implementation status

| Route | File | Built | Data source today | API wired |
|---|---|---|---|---|
| `/login` | `app/(auth)/login/page.tsx` | ✅ | real `POST /auth/login` through `useAuth().login()` | ✅ done |
| `/register` | `app/(auth)/register/page.tsx` | ✅ | local form state | ❌ pending |
| `/dashboard` | `app/(authorization)/dashboard/page.tsx` | ✅ | hardcoded sample KPIs | ❌ pending |
| `/agents` | `app/(authorization)/agents/page.tsx` | ✅ | local state | ❌ pending |
| `/inbox` | `app/(authorization)/inbox/page.tsx` | ✅ | `sampleConversations` array | ❌ pending |
| `/leads` | `app/(authorization)/leads/page.tsx` | ✅ | local sample leads | ❌ pending |
| `/publishing` | `app/(authorization)/publishing/page.tsx` | ✅ | local form state | ❌ pending |
| `/channels` | `app/(authorization)/channels/page.tsx` | ✅ | `initialCredentials` array | ❌ pending |
| `/organization` | `app/(authorization)/organization/page.tsx` | ✅ | local form state | ❌ pending |
| `/team` | `app/(authorization)/team/page.tsx` | ✅ | local form state | ❌ pending |
| `/admin/tenants` | `app/(authorization)/admin/tenants/page.tsx` | ✅ | `sampleTenants` array | ❌ pending |

Shared shell: `components/AppShell.tsx`, `components/Sidebar.tsx`, `components/Header.tsx`, `components/StateSwitcher.tsx` (Live / Loading / Empty / Error preview states). Auth is live: `store/auth-provider.tsx` restores the session via `GET /auth/me`, `app/(authorization)/layout.tsx` guards the routes with a role matrix, and Sidebar/Header render the real signed-in identity with role-filtered navigation. Remaining: wire each operational page to its endpoint (see [07-api-integration.md](./07-api-integration.md) §5).

## Modules and implementation status

### Implemented in backend source

- **Authentication and roles:** Login, `/me`, bearer-token auth, and role-aware user creation.
- **Tenant records:** SUPERADMIN-only tenant creation; authenticated tenant list/get/update.
- **AI agents:** LangGraph supervisor plus nine specialized nodes; authenticated general chat and direct-agent invocation. Responses can include execution traces, lead information, and human-review indicators.
- **Inbox:** Conversation listing, manual reply dispatch, and escalation flag updates. Meta and WhatsApp webhook jobs can log and process inbound text; Meta/WhatsApp handlers can send agent responses when credentials exist.
- **Lead capture:** Lead persistence, tenant lead retrieval (up to 50 records), de-duplication, and backend Google Sheets/email integrations.
- **Publishing:** Agent-formatted post scheduling, background due-post processing, and social publishing adapters for Instagram, Facebook, LinkedIn, and X/Twitter. The UI API accepts one platform per request.
- **Social credentials:** Manual credential create/list/delete for Instagram, Facebook, WhatsApp, LinkedIn, and Twitter; tokens are encrypted at rest.
- **Analytics:** Aggregate counts for leads, hot leads, conversations by platform, scheduled posts, and published posts.
- **Platform services:** Meta and WhatsApp webhook routes, queue processing, tenant Google Sheet/calendar/email settings/services, and basic health endpoint.

### Planned, incomplete, or not exposed to the UI

- Complete self-serve signup linking tenant creation to creation of the first owner login (registration is now SUPERADMIN-gated instead).
- Scheduled-post list/history/calendar and a frontend endpoint for status or failure details.
- Lead search, filters, pagination, edit, assignment, or deletion.
- User listing, editing, deactivation, and invitation/reset flows.
- Social OAuth connection flows and account discovery; current credential API accepts manually supplied tokens/account IDs.
- Qdrant knowledge ingestion/search management UI. A Qdrant client exists, but its current search function returns no knowledge chunks.
- Redis metering, active quotas, billing/subscription management, and UI controls for plans. Product docs state quota enforcement is disabled/deferred.
- Telegram approval interface, LinkedIn/X inbound webhooks, and expanded CRM webhook dispatch/settings. (The `ai_action_approvals` REST queue exists but has no screen.)
- Rich historical analytics and date-range filters; current analytics are aggregate totals only.

See [05-progress-handoff.md](./05-progress-handoff.md) for evidence notes and unresolved decisions.
