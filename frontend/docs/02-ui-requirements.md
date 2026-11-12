# UI Requirements

> **STATUS (current): UI PHASE COMPLETE.** Every screen below is implemented and compiles cleanly; the requirements now serve as the **acceptance contract for the API-integration milestone**. Requirements describe a frontend for the currently exposed backend. Use only the fields and actions the API supports. Common data states are specified per page; do not make a failed or unavailable API look like a successful empty result.
>
> **Roles (4):** `SUPERADMIN`, `CLIENT_OWNER`, `AGENT_OPERATOR`, `TRAINEE`. There is no `USER` role — the standard operator role in code is `AGENT_OPERATOR`. `TRAINEE` may only call `/training/*`; every operational page below returns **403** for it.

## 1. Sign in — `/login`

**API:** `POST /api/v1/auth/login`; after success, use the returned user/token and `GET /api/v1/auth/me` to restore the session.

- Form: email and password; validate required fields and email format.
- Actions: Sign in, show/hide password.
- On success: store the returned `token` and `user` (`id`, `email`, `role`, `tenantId`, `name`), then route to `/dashboard`.
- Empty: not applicable.
- Loading: disable submit and show progress while authenticating. **Current build uses a simulated 900 ms delay — replace with the real request.**
- Error: distinguish invalid credentials (401), network/API errors, and missing tenant context (403); keep the entered email and do not show a success state.
- Do not invent password reset, MFA, SSO, or account creation behavior.

## 2. Tenant registration — `/register`

**API:** `POST /api/v1/tenants/register` — **requires `Authorization: Bearer <token>` and the `SUPERADMIN` role** (`tenant.routes.ts` comment: *"Registration locked to SUPERADMIN. Public self-signup disabled."*).

- Render this screen **only for a SUPERADMIN session**; for other roles show a 403 explanation instead of a working form.
- Form fields supported: company name (required), contact email (required), brand voice (optional; backend default exists), Google Sheet ID (optional), booking calendar URL (optional URL).
- Action: Create tenant.
- Success (201 `{ success, tenant }`) must clearly state that this creates an organization record only. It does **not** create a login or automatically associate an owner account.
- Loading: disable submit and show progress.
- Error: 401 → session expired (redirect to `/login`), 403 → not authorized, 400 → show validation details next to fields where possible, 429 → rate-limited.
- Do not portray this as a complete self-serve account onboarding flow until owner-account provisioning is resolved.

## 3. Overview and analytics — `/dashboard`

**API:** `GET /api/v1/analytics` or `GET /api/v1/analytics/:tenantId`.

- Summary cards: total leads, hot leads, total conversations, total scheduled posts, published posts.
- Chart/visualization: platform breakdown from `platformBreakdown`; use a bar or donut chart and retain a readable legend/counts.
- SUPERADMIN: tenant selector may select the tenant for the route that accepts `:tenantId`; avoid showing cross-tenant aggregates unless returned by the API.
- CLIENT_OWNER/AGENT_OPERATOR: tenant-scoped summary.
- No date range, conversion-rate, reach, engagement, trend, or per-post metrics; do not add them as real data.
- Loading: skeleton cards and chart placeholder.
- Empty: show zero values and a neutral “No activity yet” state when the API successfully returns zero counts.
- Error: explicit error panel and retry; do not convert an analytics API failure into zero-value success.

## 4. Agent workspace — `/agents`

**API:** `POST /api/v1/agents/chat`, `POST /api/v1/agents/direct/:agentName`.

- Inputs: message/task, channel (`CRM_LIVE_CHAT`, `CRM_INBOX`, `INSTAGRAM`, `FACEBOOK`, `WHATSAPP`, `LINKEDIN`, `TWITTER`, or `EMAIL`), and optional direct-agent selection.
- The direct route maps `self_comment`, `researcher`, `comment_reply`, `analytics`, `trend_planner`, `dm_handler`, `publisher`, and `support_closer`; do not advertise direct controls for unsupported mappings.
- For SUPERADMIN requests, provide tenant context where the request supports it. Tenant roles use their authenticated tenant.
- Results: response/output text, assigned agent when supplied, lead score, suggested stage, review flag, and execution trace when returned.
- Actions: Run task; copy result/trace. A retry can resubmit the same user request but should be deliberate because agent calls may have side effects.
- Empty: explain the supported task/channel inputs; no fabricated sample run.
- Loading: show run-in-progress state; prevent accidental duplicate submission.
- Error: show API/network failure and retain the draft. If `requiresHumanReview` is true, visibly flag the returned result for human attention; this is not a Telegram approval workflow.
- Do not imply persistent chat history: chat history is not returned by a list endpoint.

## 5. Conversations — `/inbox`

**API:** `GET /api/v1/inbox/conversations`, `POST /api/v1/inbox/conversations/:id/reply`, `PATCH /api/v1/inbox/conversations/:id/escalate`.

- List fields: platform, sender ID, incoming text, intent category, agent response, escalation status, timestamp.
- Provide platform filtering only using the existing `platform` query parameter. Backend default is 50; maximum accepted limit is 100.
- Selected conversation area: show available returned fields and reply composer. The API does not expose a conversation detail/history endpoint.
- Actions: send manual reply; set/clear escalation state. Clearly show a failed send (for example channel not connected or platform dispatch failure).
- Empty: “No conversations yet” with channel setup guidance, not fake messages.
- Loading: list skeleton and distinct send/update progress.
- Error: list/reply/escalation errors must remain visible and retryable; do not clear a reply draft after failure.
- No assignment, deletion, bulk actions, transcript pagination, or search unless backend support is added later.

## 6. Captured leads — `/leads`

**API:** `GET /api/v1/agents/leads` (optional `tenantId` for SUPERADMIN; currently returns at most 50, newest first).

- Table columns: name, email, phone, channel, inquiry interest, lead score, CRM stage, created date.
- Visually distinguish higher scores without implying a configurable score threshold; backend analytics classifies hot leads at score 80 or above.
- Actions: open read-only detail drawer, copy contact values. There are no lead mutation endpoints.
- Empty: “No leads captured yet” and a concise explanation that contact details are captured from conversations.
- Loading: table skeleton.
- Error: show a clear load error and retry. The service currently may return an empty array after a database error, so the UI must not claim that an empty response proves no leads exist if the API provides no error distinction.
- No search, filters, pagination, export, assignment, status editing, or deletion.

## 7. Compose and schedule — `/publishing`

**API:** `POST /api/v1/posts/publish` — **roles: `SUPERADMIN`, `CLIENT_OWNER` only.** An `AGENT_OPERATOR` session receives 403; hide or disable the composer for that role with an explicit "not permitted" message rather than a silent failure.

- Form: one platform (`linkedin`, `instagram`, `twitter`, `facebook`), draft content (minimum 5 characters), optional image URL, optimal-time scheduling toggle, and exact datetime when optimal scheduling is off.
- The backend formats content with the publisher agent and returns a post ID and formatted content. It does not expose list/history/read endpoints.
- Actions: submit/schedule; show returned formatted content, post ID, and confirmation. Confirm before submission if it helps prevent accidental publishing jobs.
- Explain the selected schedule behavior precisely: the API schedules a post; it does not provide an immediate-publish action from this screen.
- Empty: blank composer with supported channels.
- Loading: disable duplicate submit and show that the agent is formatting/scheduling.
- Error: retain draft and show validation, tenant-context, credential, or server error as returned.
- Do not build a calendar, post queue, status table, edit/cancel flow, or per-post analytics from the create endpoint alone.

## 8. Social channels — `/channels`

**API:** `GET /api/v1/credentials`, `POST /api/v1/credentials`, `DELETE /api/v1/credentials/:platform` — **roles: `SUPERADMIN`, `CLIENT_OWNER` only** (the credentials router applies `requireRole` to all three verbs). `AGENT_OPERATOR` sees 403.

- Connected-account table: platform, account ID, token expiration, connected/expired status where expiration is known. Response envelope: `{ success, connectedChannels: [...] }`.
- Manual connection form: platform, account ID, access token, optional refresh token, optional expiration. Never display a stored access token; the list endpoint intentionally omits it.
- Supported values: Instagram, Facebook, WhatsApp, LinkedIn, Twitter.
- Actions: connect/save credential, disconnect with confirmation.
- Empty: show disconnected channels and manual setup action.
- Loading: list/form progress; do not reveal token text after save.
- Error: show save/list/delete errors. Never interpret a failed credential-list request as “no channels connected.”
- OAuth, automatic account discovery, reconnect, permission scopes, and test-connection controls are not backed by these endpoints.

## 9. Organization profile — `/organization`

**API:** `GET /api/v1/tenants/:id` and `PATCH /api/v1/tenants/:id`; non-SUPERADMIN users resolve to their own tenant. **PATCH roles: `SUPERADMIN`, `CLIENT_OWNER` only** — an `AGENT_OPERATOR` session may read but must see a read-only form (PATCH returns 403).

- Display/edit supported fields: company name, brand voice, Google Sheet ID, booking calendar URL, notification email, active status. Render fields only if available in the returned tenant object.
- Actions: load, save changes; unsaved-change warning is client-side only.
- Tabs such as “Profile” and “Integrations” may group these fields but remain one page.
- Loading: form skeleton.
- Empty: no tenant context should be a clear blocking state, not a blank editable form.
- Error: distinguish not found, permission/context, validation, and server errors; preserve unsaved values after failure.
- Do not add CRM webhook URL/API key editing: current tenant response/update handlers do not expose those fields consistently.

## 10. Create a user — `/team`

**API:** `POST /api/v1/auth/create-user` — **roles: `SUPERADMIN`, `CLIENT_OWNER` only.**

- Form: full name, email, password, role. The request `role` enum is exactly `SUPERADMIN | CLIENT_OWNER | AGENT_OPERATOR` — **`TRAINEE` cannot be created through this endpoint** and must not be offered in the role select. SUPERADMIN may provide tenant ID and assign any of the three; CLIENT_OWNER can create tenant users only and cannot create SUPERADMIN.
- Actions: create user; show returned user identity and role, but never echo or retain the password.
- Empty: explain the roles and that only account creation is supported here.
- Loading: disable submit.
- Error: show validation, duplicate-email, and permission errors; keep non-secret fields where appropriate and clear password after success/failure according to security policy.
- No user list, edit, deactivate, resend invite, or password-reset UI: no endpoint exists for these operations.

## 11. Tenant directory — `/admin/tenants`

**API:** `GET /api/v1/tenants`, `GET /api/v1/tenants/:id`, `PATCH /api/v1/tenants/:id`.

- SUPERADMIN view: tenant table with company name, plan, contact email, active state, and creation date. The backend list is not paginated.
- Tenant detail/edit drawer: supported profile fields from the API; tenant updates should use the existing endpoint and show save status.
- Non-SUPERADMIN tenant handlers return only their own tenant. Do not show a platform-wide directory to tenant roles.
- Actions: inspect and edit existing tenants; no delete/create action here (public registration is separate).
- Empty: no tenant records; provide a clear empty state.
- Loading: table skeleton.
- Error: explicit list/load/save errors and retry; no empty-success fallback.
- UI visibility restrictions are not a substitute for adding server-side role authorization.

## Shared interaction and accessibility requirements

- Use consistent page titles, breadcrumb/context where needed, inline validation, keyboard-accessible dialogs, visible focus, labels, and accessible names.
- Every asynchronous action needs pending, success, and failure feedback. Avoid duplicate submissions.
- Confirm destructive credential disconnects; no destructive actions should be invented for read-only datasets.
- Avoid optimistic state changes for messages, escalation, credentials, or tenant updates until the API confirms success.
- Keep tenant identity visible whenever a SUPERADMIN is operating in a selected tenant context.
- Responsive layouts may rearrange tables as cards or use a conversation drawer, but must preserve the same actions/data and do not count as additional screens.

## Cross-cutting API requirements (integration milestone)

- **Role-aware navigation:** the sidebar must hide or badge items the current role cannot call (`/publishing`, `/channels`, `/team`, `/admin/tenants`, `/register`), and every gated action must render an explicit 403 state instead of a generic error.
- **Status-code handling (all pages):** `200/201` success · `400` field validation · `401` clear session and redirect to `/login` · `403` show permission state (never an empty-success state) · `404` record-not-found · `429` show `retryAfterSeconds` and disable retry until elapsed · `5xx` show error panel with retry.
- **Never** treat a failed list request as an empty dataset; loading, empty, and error are three distinct states (the existing `StateSwitcher` previews them and must keep working after wiring).
- All requests go through the shared client in `services/api.ts` (see [07-api-integration.md](./07-api-integration.md) and [08-frontend-architecture.md](./08-frontend-architecture.md)); pages must not call `fetch` directly.
