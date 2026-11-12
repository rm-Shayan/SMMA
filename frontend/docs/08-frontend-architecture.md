# Frontend Architecture Conventions (`08-frontend-architecture.md`)

**Status:** ACTIVE — governs the *API Integration & State Management Layer* milestone.
**Companion docs:** [07-api-integration.md](./07-api-integration.md) (what to call), [03-design-system.md](./03-design-system.md) (how it looks).

---

## 1. Stack decisions (already made — do not re-litigate)

| Concern | Decision |
|---|---|
| Framework | Next.js **16.4.6** App Router + React **19.3** + TypeScript 5 |
| Styling | Tailwind CSS **4.3** via `@theme` tokens in `app/globals.css` |
| Transport | **Axios** (`axios@1.21`, installed) behind one shared instance in `services/api.ts` — request/response interceptors attach auth headers and normalise errors. Pages still never call `axios` directly; they use `apiGet/apiPost/apiPatch/apiDelete`. |
| Notifications / icons | `react-hot-toast` and `react-icons` are installed in `package.json` and may be used for toasts and icons; existing pages currently use Material Symbols and must not be restyled as part of integration work. |
| Server state | Plain async calls + local component state for now; no React Query/SWR yet |
| Client state | React Context in `store/` first; Redux Toolkit only if cross-page state actually grows |
| Route groups | `(auth)` = public, `(authorization)` = requires session |

> `frontend/AGENTS.md` warns that this Next.js version has breaking changes: read `frontend/node_modules/next/dist/docs/` before writing Next-specific code (layouts, `redirect`, env handling, caching).

---

## 2. Target folder structure

```text
frontend/
├── app/
│   ├── layout.tsx                 # root layout: fonts, metadata (no auth logic)
│   ├── page.tsx                   # redirect → /dashboard
│   ├── (auth)/
│   │   ├── layout.tsx             # redirect → /dashboard if session exists
│   │   ├── login/page.tsx
│   │   └── register/page.tsx      # SUPERADMIN-gated
│   └── (authorization)/
│       ├── layout.tsx             # session guard + AppShell (create in Step 2)
│       ├── dashboard/page.tsx
│       └── ... (9 more pages)
├── components/                    # shared, data-agnostic UI only
│   ├── AppShell.tsx  Sidebar.tsx  Header.tsx  StateSwitcher.tsx
│   └── (future) ErrorPanel.tsx  Skeleton.tsx  EmptyState.tsx
├── services/                      # ALL network I/O lives here
│   ├── api.ts                     # shared Axios instance: baseURL, interceptors, ApiError, verb helpers
│   ├── session.ts                 # token/tenant/user storage (dependency-free, no cycles)
│   ├── auth.api.ts                # (next) login, me, create-user as named calls
│   ├── tenants.api.ts             # (next) register, list, get, update
│   ├── analytics.api.ts           # (next) dashboard summary
│   ├── agents.api.ts              # (next) chat, direct, leads
│   ├── inbox.api.ts               # (next) conversations, reply, escalate
│   ├── posts.api.ts               # (next) publish
│   ├── credentials.api.ts         # (next) channels CRUD
│   └── approvals.api.ts           # (next) approvals (future screen)
├── store/                         # client-side state
│   ├── auth-provider.tsx          # ✅ session restore via GET /auth/me, login/logout, active tenant
│   ├── role-labels.ts             # ✅ shared role labels + initials for Sidebar/Header/guard
│   └── (future) tenant-provider.tsx  # SUPERADMIN selected-tenant context
├── types/                         # shared TS types (API DTOs + UI view models)
├── docs/                          # this documentation set
└── redux/store.ts                 # ⚠ legacy empty placeholder — superseded by store/
```

### Rules

1. **`services/` is the only place that talks HTTP.** A page imports a named function (`fetchAnalytics()`), never `fetch`, never a raw URL.
2. **One domain file per file, ~150 lines max.** If a service file grows past that, split by verb group (`*.queries.ts` / `*.mutations.ts`), matching the backend's modular style. The core wrapper `services/api.ts` is the single exception (transport + session storage, ~195 lines) — do not grow it further; new behaviour belongs in a domain file or `services/session.ts`.
3. **`store/` holds React Context providers** mounted in `(authorization)/layout.tsx`. It never performs network calls itself — it calls `services/`.
4. **`types/` separates API shapes from view models.** API DTOs keep backend field names (`lead_score`, `inquiry_interest`); page-facing view models use camelCase and are mapped inside the service layer, so a backend rename touches one file.
5. **No secrets in `NEXT_PUBLIC_` vars.** Anything with that prefix is inlined into the browser bundle. The JWT lives in `localStorage` at runtime, never in an env var.
6. **`"use client"` only where the file actually uses hooks/handlers.** Server components stay the default for static layout.
7. **Components stay data-agnostic.** `components/` receives props; it does not import from `services/`. Page files own the data wiring.

---

## 3. The core client — `services/api.ts`

One shared **Axios** instance (`axios.create`) + interceptor layer. Contract:

| Export | Responsibility |
|---|---|
| `api` | the shared Axios instance (`baseURL` = `NEXT_PUBLIC_API_URL`, 30 s default timeout) — for rare cases needing full Axios config |
| `apiRequest`-style verbs: `apiGet` / `apiPost` / `apiPatch` / `apiPut` / `apiDelete` | the normal path; return the parsed response body (`T`) and throw `ApiError` on failure |
| `ApiError` | `{ status, message, details?, retryAfterSeconds? }` — `status: 0` means network/timeout |
| `setUnauthorizedHandler(fn)` | lets the auth provider navigate with the Next router on 401 instead of a full reload |
| re-exports of `services/session.ts` | `getSession`, `setSession`, `clearSession`, `setActiveTenant`, `getActiveTenantId` and the session types |

Behaviour (implemented):

- **Request interceptor** attaches `Authorization: Bearer <token>` from `services/session.ts` and `x-tenant-id` when the caller passes `config.tenantId` or the session user is SUPERADMIN with an active tenant.
- **Response interceptor**: `401` → `clearSession()` + redirect to `/login` (skipped for `/auth/login` and when `skipAuthRedirect` is set); every failure is normalised into `ApiError`.
- **429** keeps `retryAfterSeconds` (body field or `Retry-After` header) so the UI can show a countdown.
- `400` carries the Zod `details` tree for field-level form errors.
- Network/timeout → `status: 0` with a human-readable message; non-JSON bodies resolve to a message object instead of a parse crash.
- Per-request overrides: `tenantId`, `skipAuthRedirect`, `timeout` (AI endpoints should pass `timeout: 60_000`).

---

## 4. State handling conventions

### 4.1 Per-page state machine

Every data-backed page keeps exactly one view state, reusing the existing `StateSwitcher` types:

```ts
type ViewState = "live" | "loading" | "empty" | "error";
```

- `loading` — request in flight → skeletons
- `error` — request failed → `ErrorPanel` with retry (status + message)
- `empty` — request **succeeded** with zero rows
- `live` — data present

The rule from `02-ui-requirements.md`: an error must never be rendered as an empty state.

### 4.2 Session state (`store/auth-provider.tsx`) — ✅ implemented

- Holds `{ user, activeTenantId, status }` where `status: "loading" | "authenticated" | "anonymous"`.
- On mount: read `localStorage` → call `GET /auth/me` (`skipAuthRedirect`) → resolve status. A `401` there means an expired token: session cleared → `anonymous`. A network/5xx failure falls back to the stored session so an unreachable API does not lock the user out of the shell.
- Exposes `login(email, password)` (real `POST /auth/login`, persists token + user), `logout()` (clears session → `/login`), and `switchTenant(id)` (SUPERADMIN `x-tenant-id`).
- Registers `setUnauthorizedHandler(router.push)` so interceptor 401s use client-side navigation instead of a full page reload.
- `app/(authorization)/layout.tsx` renders a loading screen while `status === "loading"`, `redirect("/login")` when `anonymous`, and an **access-denied panel** when the route's role rule excludes the current role (see §4.4).
- Sidebar/Header read the same context to render the real name, email, role badge, and role-filtered navigation.

### 4.4 Route role matrix (`app/(authorization)/layout.tsx`)

| Route prefix | Allowed roles |
|---|---|
| `/admin/tenants` | SUPERADMIN |
| `/publishing`, `/channels`, `/team` | SUPERADMIN, CLIENT_OWNER |
| `/dashboard`, `/agents`, `/inbox`, `/leads`, `/organization` | SUPERADMIN, CLIENT_OWNER, AGENT_OPERATOR |
| anything else under `(authorization)` | same as Overview (default: operational roles) |

`TRAINEE` matches no operational route and therefore receives the access-denied panel everywhere — consistent with the backend `requireRole` matrix. `/register` lives in `(auth)` and is gated separately (SUPERADMIN-only API) in a later step.

### 4.3 Mutations

- Disable the submit button while in flight; never fire a duplicate request.
- Optimistic updates are **banned** for replies, escalation, credentials, and tenant updates — wait for the server response.
- On failure, preserve user input (reply draft, post content, form fields) and show the status-specific message.

---

## 5. Naming and code style

| Item | Convention |
|---|---|
| Service function | `fetchX` for reads, `createX` / `updateX` / `deleteX` for writes |
| API DTO type | `LeadDto`, `ConversationDto`, `AnalyticsDto` |
| View model type | `Lead`, `Conversation`, `Analytics` (camelCase) |
| Page component | default export from `page.tsx`, client component when it owns state |
| Env access | `process.env.NEXT_PUBLIC_API_URL` inside `services/api.ts` only |
| Error messages | surfaced from the API (`message`); no hardcoded English invented per page |

---

## 6. Definition of done for any integration step

1. The page loads real data through `services/`, with `loading` / `empty` / `error` all reachable.
2. Role-gated actions are hidden or disabled with an explicit reason (see the matrix in [01-page-inventory.md](./01-page-inventory.md)).
3. `npm run build` passes with zero TypeScript errors.
4. The `StateSwitcher` previews still render.
5. `05-progress-handoff.md` is updated with what changed and the next task.
