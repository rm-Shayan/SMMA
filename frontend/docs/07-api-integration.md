# API Integration Contract (`07-api-integration.md`)

**Status:** ACTIVE — this is the integration contract for the current milestone (*API Integration & State Management Layer*).
**Source of truth:** `backend/src/modules/*/*.routes.ts` (read 1:1; the backend MD files are older than the code).
**Consumer:** the single fetch wrapper in `frontend/services/api.ts`. Pages must never call `fetch` directly.

---

## 1. Base URL and environment

| Variable | Value (local) | Notes |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000/api/v1` | Inlined at build time by Next.js; only `NEXT_PUBLIC_`-prefixed vars reach the browser. |

- Defined in `frontend/.env.example` (committed reference) and `frontend/.env.local` (local runtime, git-ignored).
- Backend default port is **5000** (`app.ts` uses `process.env.PORT || 5000`); `backend/.env.example` says `PORT=3000` — set `PORT=5000` locally or change the env value so both sides match.
- Health check (no `/api/v1` prefix): `GET http://localhost:5000/health`.

---

## 2. Authentication and headers

### 2.1 Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{ "email": "user@agency.com", "password": "secret123" }
```

Success `200`:
```json
{ "success": true, "token": "<jwt>", "user": { "id": "uuid", "email": "...", "role": "SUPERADMIN", "tenantId": "uuid|null", "name": "Full Name" } }
```
Failure `401`: `{ "error": "Unauthorized", "message": "Invalid email or password" }`
Validation `400`: `{ "error": "Validation Error", "details": { ...zod format } }`

- Token: HMAC-SHA256 JWT, **expires in 7 days** (`auth.service.ts`), payload `{ userId, email, role, tenantId, exp }`.
- Restore session on refresh with `GET /api/v1/auth/me` → `{ success, user }`.

### 2.2 Required headers

| Header | When | Value |
|---|---|---|
| `Content-Type: application/json` | every request with a body | literal |
| `Authorization: Bearer <token>` | every request except `POST /auth/login` and `/webhooks/*` | JWT from session storage |
| `x-tenant-id: <uuid v4>` | **SUPERADMIN only**, when acting on a specific tenant | selected tenant UUID; invalid format → `400 Invalid Tenant ID` |
| `idempotency-key` / `x-idempotency-key` | optional on writes | non-blocking; enforced only for tool side-effects |

Tenant resolution rules (from source):

- `CLIENT_OWNER` / `AGENT_OPERATOR` / `TRAINEE`: tenant comes from the token. Sending `x-tenant-id` is unnecessary and does not override their own tenant.
- `SUPERADMIN`: tenant comes from `x-tenant-id` header, or `?tenantId=` query, or `tenantId` in the JSON body, depending on the endpoint (see the table).
- Missing tenant context → `403 { "error": "Forbidden", "message": "Tenant context required" }`.

### 2.4 Session storage and transport

- `token` and `user` are written by `services/session.ts` (`setSession` / `clearSession`) into `localStorage` keys `smma.token` and `smma.user`; the SUPERADMIN active tenant is `smma.tenantId`.
- Transport is a **shared Axios instance** in `services/api.ts`: the request interceptor adds `Authorization` and `x-tenant-id` on every call, so pages send neither header manually.
- On any `401` the response interceptor clears the session and redirects to `/login` (skipped for `POST /auth/login` and for `GET /auth/me` while bootstrapping).
- `GET /auth/me` runs once on app load (`store/auth-provider.tsx`) to restore/verify the session.

---

## 3. Response envelopes and status codes

### 3.1 Envelopes (observed in controllers)

| Shape | Used by |
|---|---|
| `{ success: true, ...data }` | most endpoints (`token`, `user`, `tenant`, `tenants`, `leads`, `conversations`, `analytics`, `connectedChannels`, `approvals`, `sessions`, ...) |
| `{ error, message }` | 401 / 403 / 404 / 429 / 500 |
| `{ error, details }` | 400 Zod validation (`details` = `error.format()` tree) |

Data key per endpoint is in the mapping table below. Counts are returned as `count` alongside list arrays.

### 3.2 Status codes the UI must handle

| Code | Meaning in this API | Required UI behaviour |
|---|---|---|
| `200` / `201` | success | render returned data; `201` for `auth/create-user`, `tenants/register`, `training/docs`, `posts/publish` |
| `400` | Zod validation or missing field | map `details` errors onto form fields; keep user input |
| `401` | missing/invalid/expired token | clear session, redirect to `/login` (handled centrally in `services/api.ts`) |
| `403` | wrong role or no tenant context | render an explicit "not permitted" state; **never** an empty-success state |
| `404` | record not found (`tenants/:id`, conversation, approval) | inline not-found message |
| `429` | rate limited | show `retryAfterSeconds` (header `Retry-After` and body field), disable retry until elapsed |
| `500` / `502` / `503` | server error / dispatch failure / channel not connected | error panel with retry; keep the draft (reply text, post content, form values) |

### 3.3 Rate limits

| Limit | Scope |
|---|---|
| 180 req / minute | global, keyed by tenant + actor + method + base path (`/api`) |
| 60 req / minute | `POST /agents/chat` and `POST /agents/direct/:agentName` |
| 30 req / minute | `POST /training/ask` |

All three return `429` with `{ error, message, retryAfterSeconds }`.

---

## 4. Endpoint → page mapping (complete inventory)

### 4.1 The 15 page-facing endpoint groups

| # | Method + path | Frontend page / component | Roles | Request | Response data key |
|---|---|---|---|---|---|
| 1 | `POST /auth/login` | `app/(auth)/login/page.tsx` | public | `{ email, password }` | `token`, `user` |
| 2 | `GET /auth/me` | session bootstrap (`services/session.ts`, `app/(authorization)/layout.tsx`) | any authenticated | — | `user` |
| 3 | `POST /auth/create-user` | `app/(authorization)/team/page.tsx` | SUPERADMIN, CLIENT_OWNER | `{ email, password, fullName, role, tenantId? }` | `user` |
| 4 | `POST /tenants/register` | `app/(auth)/register/page.tsx` (SUPERADMIN only) | SUPERADMIN | `{ companyName, email, brandVoice?, niche?, targetAudience?, competitorHandles?, autonomousModeEnabled?, googleSheetId?, bookingCalendarUrl? }` | `tenant` |
| 5 | `GET /tenants` · `GET /tenants/:id` · `PATCH /tenants/:id` | `admin/tenants/page.tsx`, `organization/page.tsx` | GET: SUPERADMIN/CLIENT_OWNER/AGENT_OPERATOR · PATCH: SUPERADMIN/CLIENT_OWNER | PATCH body (all optional): `{ companyName, brandVoice, niche, targetAudience, competitorHandles, autonomousModeEnabled, googleSheetId, bookingCalendarUrl, notificationEmail, isActive }` | `tenants` / `tenant` |
| 6 | `GET /analytics` · `GET /analytics/:tenantId` | `dashboard/page.tsx` | SUPERADMIN, CLIENT_OWNER, AGENT_OPERATOR | path/query `tenantId` for SUPERADMIN | `analytics` = `{ tenantId, totalLeads, hotLeads, totalConversations, totalScheduledPosts, publishedPosts, platformBreakdown }` |
| 7 | `POST /agents/chat` | `agents/page.tsx` (composer + result/trace) | SUPERADMIN, CLIENT_OWNER, AGENT_OPERATOR | `{ channel, message, senderId, senderName?, targetAgent?, tenantId? }` | `agentAssigned`, `response`, `leadScore`, `suggestedStage`, `requiresHumanReview`, `executionTrace` |
| 8 | `POST /agents/direct/:agentName` | `agents/page.tsx` (direct agent selector) | SUPERADMIN, CLIENT_OWNER | `{ message, channel?, tenantId? }`, agentName ∈ `self_comment, researcher, comment_reply, analytics, trend_planner, dm_handler, publisher, support_closer` | `agent`, `output`, `trace` |
| 9 | `GET /agents/leads` | `leads/page.tsx` | SUPERADMIN, CLIENT_OWNER, AGENT_OPERATOR | `?tenantId=` (SUPERADMIN) | `count`, `leads[]` = `{ id, name, phone, email, channel, inquiry_interest, lead_score, crm_stage, created_at }` (max 50, newest first) |
| 10 | `GET /inbox/conversations` | `inbox/page.tsx` (list) | SUPERADMIN, CLIENT_OWNER, AGENT_OPERATOR | `?platform=&limit=` (default 50, max 100) | `count`, `conversations[]` = `{ id, platform, sender_id, incoming_text, intent_category, agent_response, is_escalated, created_at }` |
| 11 | `POST /inbox/conversations/:id/reply` · `PATCH /inbox/conversations/:id/escalate` | `inbox/page.tsx` (composer, escalation toggle) | reply: 3 roles · escalate: SUPERADMIN, CLIENT_OWNER | `{ replyText }` / `{ isEscalated: boolean }` | `message` / `isEscalated` |
| 12 | `POST /posts/publish` | `publishing/page.tsx` | SUPERADMIN, CLIENT_OWNER | `{ platform, draftContent, imageUrl?, autoScheduleOptimal, exactTime? }` | `postId`, `formattedContent` |
| 13 | `GET /credentials` · `POST /credentials` · `DELETE /credentials/:platform` | `channels/page.tsx` | SUPERADMIN, CLIENT_OWNER (all three verbs) | POST `{ platform, accountId, accessToken, refreshToken?, expiresAt? }`; platform ∈ `instagram, facebook, whatsapp, linkedin, twitter` (lowercase) | `connectedChannels[]` / `credential` / `message` |
| 14 | `GET /approvals` · `POST /approvals/:id/approve` · `POST /approvals/:id/reject` | **no screen yet** (candidate: approvals panel on `/agents` or `/dashboard`) | SUPERADMIN, CLIENT_OWNER | reject body `{ reason? }` | `approvals[]` = `{ id, tool_name, proposed_params, status, decision_reason, created_at, approved_at, executed_at, idempotency_key }` |
| 15 | `GET /health` | build/dev-time connectivity probe (not a page) | public | — | `{ status, timestamp, uptime }` |

### 4.2 Mounted routers with no UI yet (out of current scope)

| Method + path | Roles | Purpose |
|---|---|---|
| `POST /training/docs` | SUPERADMIN, CLIENT_OWNER | upload SOP / knowledge doc |
| `POST /training/ask` | all 4 roles (30 req/min) | intern Q&A grounded in company docs |
| `GET /training/sessions` | all 4 roles | trainee comprehension audit |
| `POST /tools/openapi`, `POST /tools/manual`, `GET /tools`, `POST /tools/:toolName/test` | SUPERADMIN, CLIENT_OWNER | external OpenAPI/webhook tool registry |
| `GET /webhooks/meta`, `POST /webhooks/meta` | public (HMAC + verify token) | Meta/Instagram inbound — never called from the UI |
| `GET /webhooks/whatsapp`, `POST /webhooks/whatsapp` | public (HMAC + verify token) | WhatsApp inbound — never called from the UI |

### 4.3 Documented gaps (do not build UI for these)

- No post list / status / calendar endpoint → `/publishing` stays a composer with a confirmation receipt only.
- No user list endpoint → `/team` is create-only.
- Leads: no filter, pagination, search, or mutation; max 50 rows; a DB error can surface as an empty array.
- No OAuth flow: credentials are manually supplied tokens.
- Analytics: aggregate totals only — no date range, time series, reach, or engagement metrics.
- `tenants/register` no longer creates an owner account, and it is no longer public.

---

## 5. Integration sequence (agreed order)

| Step | Scope | Entry point | Status |
|---|---|---|---|
| 1 | env + Axios client (`services/api.ts`) + session helpers (`services/session.ts`) | `services/` | ✅ done |
| 2 | auth flow: AuthProvider, `/auth/me` restore, `(authorization)` guard + role matrix, real login, real user in Sidebar/Header | `store/auth-provider.tsx`, `app/(authorization)/layout.tsx`, `app/(auth)/login/page.tsx` | ✅ done |
| 3 | `/dashboard` ← `GET /analytics` | dashboard page | ✅ done |
| 4 | `/leads` ← `GET /agents/leads`, `/inbox` ← conversations + reply + escalate | leads, inbox pages | ⬜ |
| 5 | `/channels` ← credentials CRUD, `/publishing` ← `POST /posts/publish` | channels, publishing pages | ⬜ |
| 6 | `/organization` ← tenants GET/PATCH, `/team` ← create-user, `/admin/tenants` ← tenants list/PATCH | organization, team, admin pages | ⬜ |
| 7 | `/agents` ← `POST /agents/chat` (+ direct agent), trace and human-review rendering | agents page | ⬜ |
| 8 | `/register` ← SUPERADMIN-gated tenant registration | register page | ⬜ |

Rules for every step: keep the `StateSwitcher` previews working, never replace an error with an empty state, and update `05-progress-handoff.md` when the step lands.
