# Progress and Handoff

> **Current milestone: Phase 3 · Step 1 Dashboard Analytics Integration** — `/dashboard` is wired to `GET /analytics` with real KPI + platform breakdown data and distinct loading/empty/error states. Next: Leads & Inbox API integration.

## Phase status

| Phase | Scope | Status |
|---|---|---|
| Phase 0 | Documentation set (`docs/01`–`08`), Stitch prompts/design system | ✅ Completed |
| Phase 1 | UI application — 11 routes, app shell, design tokens, state previews | ✅ Completed (build green) |
| Phase 2 | **Auth & State Foundation** — Axios client, session/cookies, Redux Toolkit, real login, session restore, route guard, dynamic shell identity | ✅ **Completed** |
| Phase 3 | Page-by-page data wiring per `07-api-integration.md` §5 (`/dashboard` ✅ done; next: `/leads`, `/inbox`) | 🔄 **ACTIVE** |
| Phase 4 | Optional screens (approvals, training, external tools) + visual QA vs Stitch | ⏳ Pending |

---

## Completed work — Phase 3 · Step 1: Dashboard Analytics Integration ✅

### 1) Analytics service + types
- `frontend/services/analyticsService.ts`: `getAnalyticsApi(tenantId?)` → `GET /analytics` (tenant from JWT) or `GET /analytics/:tenantId` when a SUPERADMIN has an active tenant; the tenant is also sent as `x-tenant-id` by the shared Axios interceptor. Normalises every count to a number and throws when the `analytics` payload is missing.
- `frontend/types/analytics.ts`: `AnalyticsDto` / `AnalyticsResponse` / `Analytics` view model matching `analytics.service.ts` (`tenantId`, `totalLeads`, `hotLeads`, `totalConversations`, `totalScheduledPosts`, `publishedPosts`, `platformBreakdown`).

### 2) Dashboard page (`frontend/app/(authorization)/dashboard/page.tsx`)
- Replaced all hardcoded metrics/charts with real data: KPI cards (total leads, hot leads, conversations, scheduled, published) and `platformBreakdown` distribution bar + legend + per-platform table.
- Greeting uses the Redux identity; badge shows the real last-updated time (role label before the first successful load).
- SUPERADMIN requests pass the Redux `tenantId`; other roles stay scoped by their JWT.
- Distinct states: skeleton while loading, explicit error panel with status/message + retry (respects `retryAfterSeconds` from 429), and a zero-activity empty state when the API succeeds with all zeros. Errors are never rendered as empty success.
- `StateSwitcher` previews kept working as an override on top of the live request state; retry clears the preview.
- No fabricated time series, reach, engagement, per-post or per-platform lead/post metrics — the API only returns aggregate totals.

### 3) Modular dashboard UI (`frontend/components/dashboard/`)
- `DashboardKpis.tsx` — 5 KPI cards driven by props.
- `PlatformBreakdown.tsx` — distribution bar + legend tiles; `PlatformTable.tsx` — per-platform conversations/share table; `platform-channels.ts` — channel labels/colors and percent helpers.
- `DashboardSkeleton.tsx` — loading placeholder; `DashboardEmptyState.tsx` — zero-activity panel; `DashboardErrorState.tsx` — error panel + retry countdown.

### 4) Next.js App Router conventions
- `frontend/app/(authorization)/dashboard/loading.tsx` — instant Suspense loading UI for the route segment (server component wrapping `AppShell` + skeleton).
- `frontend/app/(authorization)/dashboard/error.tsx` — client error boundary using the Next.js 16 `retry` prop, reusing `DashboardErrorState` (this is a render safety net; fetch failures are handled by the page state).

### 5) Documentation
- This file and `07-api-integration.md` §5 step 3 marked done.

## Previously completed — Phase 2 (verified)

### 1) Auth service (`frontend/services/authService.ts`)
- `loginApi(credentials)` → `POST /auth/login` (typed `AuthResponse`).
- `getCurrentUserApi()` → `GET /auth/me` (returns `user`).

### 2) Session restore / initializer
- `frontend/components/auth/AuthInitializer.tsx` (client): on mount checks token cookie (`smma.token`), dispatches `hydrateFromStorage()` and `fetchCurrentUser()` via Redux.
- Mounted in `frontend/app/layout.tsx` inside `<ReduxProvider>` (alongside existing `<AuthProvider>`).

### 3) Route protection guard
- `frontend/app/(authorization)/layout.tsx`: server shell (`instant = false`) rendering `AuthorizationGuard`.
- `frontend/components/AuthorizationGuard.tsx` (client): checks Redux auth/token cookie (`isAuthenticated`), redirects unauthenticated users to `/login`, shows overlay while restoring session (`fetchCurrentUser`/hydrate), and enforces role matrix with explicit access-restricted panel:
  - `/admin/tenants`: SUPERADMIN
  - `/publishing`, `/channels`, `/team`: SUPERADMIN, CLIENT_OWNER
  - `/dashboard`, `/agents`, `/inbox`, `/leads`, `/organization`: SUPERADMIN, CLIENT_OWNER, AGENT_OPERATOR

### 4) Real login page (`frontend/app/(auth)/login/page.tsx`)
- Replaced simulated login with real `loginApi` (`POST /auth/login`).
- On success: saves token via `js-cookie`, dispatches `setCredentials`, redirects to `/dashboard`.
- Handles API errors (401/400/429/network) in error banner (retry-after for 429). State preview toggles preserved.

### 5) Dynamic Header & Sidebar (Redux-driven identity)
- `frontend/components/Header.tsx`: reads `name/email/role` from Redux (`useAppSelector`), shows real initials/identity, logout dispatches Redux `logout` + clears session and routes to `/login`.
- `frontend/components/Sidebar.tsx`: reads `user`/role from Redux, role-filtered nav, real identity in footer (name, role label, email/tenant context).
- `frontend/store/role-labels.ts`: role labels/initials typed from `@/types/auth`.

### 6) Core Redux/Axios foundation (already verified, kept)
- `frontend/services/api.ts`: Axios instance (`NEXT_PUBLIC_API_URL || http://localhost:5000/api/v1`), request interceptor attaches `Authorization: Bearer <token>` (cookie/session) and `x-tenant-id` when active; response interceptor clears session + redirects on 401 (skips login) and surfaces 429 with retry info.
- `frontend/services/session.ts`: cookie-backed token/tenant + persisted user for restore.
- `frontend/types/auth.ts`: `User` (id,email,name?,role,tenantId), `AuthResponse`, `AuthState`.
- `frontend/redux/slices/authSlice.ts`: `setCredentials`, `logout`, `setTenantId`, `hydrateFromStorage`, `fetchCurrentUser` thunk (`getCurrentUserApi`/`GET /auth/me`).
- `frontend/redux/store.ts`, `frontend/redux/hooks.ts`: store + typed hooks.
- `frontend/components/providers/ReduxProvider.tsx`: client Provider wrapper.
- `frontend/app/layout.tsx`: wraps app with `<ReduxProvider><AuthInitializer /><AuthProvider>…`.

## New/updated files (Phase 3 · Step 1)
- New: `frontend/services/analyticsService.ts`, `frontend/types/analytics.ts`
- New: `frontend/components/dashboard/DashboardKpis.tsx`, `PlatformBreakdown.tsx`, `PlatformTable.tsx`, `DashboardSkeleton.tsx`, `DashboardEmptyState.tsx`, `DashboardErrorState.tsx`, `platform-channels.ts`
- New: `frontend/app/(authorization)/dashboard/loading.tsx`, `frontend/app/(authorization)/dashboard/error.tsx`
- Updated: `frontend/app/(authorization)/dashboard/page.tsx`, `frontend/docs/05-progress-handoff.md`, `frontend/docs/07-api-integration.md`

## New/updated files (Phase 2)
- New: `frontend/services/authService.ts`, `frontend/components/auth/AuthInitializer.tsx`
- Updated: `frontend/redux/slices/authSlice.ts`, `frontend/app/layout.tsx`, `frontend/components/AuthorizationGuard.tsx`, `frontend/app/(auth)/login/page.tsx`, `frontend/components/Header.tsx`, `frontend/components/Sidebar.tsx`, `frontend/store/role-labels.ts`, `frontend/docs/05-progress-handoff.md`

## Current decisions / notes
- Real auth path: `POST /auth/login` → token cookie + Redux `setCredentials` → `/dashboard`; session restore via cookie + `GET /auth/me` on mount.
- Route protection is navigation-level (Redux/token + role matrix); API remains security boundary.
- Existing `AuthProvider` (`store/auth-provider.tsx`, context-based) retained alongside Redux for compatibility with current consumers; shell identity/guard now Redux-driven per this step.
- No backend changes. State preview toggles kept where present.

## Dashboard follow-ups (same step)
- **SUPERADMIN `403 Tenant context required` fixed:** `analytics.controller.ts` only reads the tenant from the path/query/JWT, so the dashboard now resolves a tenant first — `services/tenantsService.ts` → `GET /tenants`, stored/newest tenant restored and written to Redux (`setTenantId`), then `GET /analytics/:tenantId`. `components/dashboard/TenantSelector.tsx` renders the selector for SUPERADMIN only; `hooks/useDashboardAnalytics.ts` owns this flow, and a tenant-less superadmin sees an explicit `DashboardNoTenantState` panel instead of a raw 403.
- **Font/icon reload fix:** `app/layout.tsx` now self-hosts Inter via `next/font` (`--font-inter`) and preloads a locally served, icon-subsetted `Material Symbols Outlined` (`public/fonts/material-symbols-outlined.woff2`, ~94 KB) instead of two blocking `fonts.googleapis.com` stylesheets, so fonts/icons paint immediately on reload. `app/loading.tsx` adds root-segment loading UI for the `/` → `/dashboard` redirect.

## Next active milestone (exact)
**Phase 3 · Step 2 — Leads & Inbox API integration:** wire `/leads` to `GET /agents/leads` (`count`, `leads[]`, max 50) and `/inbox` to `GET /inbox/conversations` plus `POST /inbox/conversations/:id/reply` and `PATCH /inbox/conversations/:id/escalate`, with the same loading/empty/error/retry pattern as the dashboard. Then proceed to `/channels`, `/publishing`, `/organization`, `/team`, `/admin/tenants`, `/agents`, `/register` per `07-api-integration.md`.

## Open gaps
- `(auth)` layout redirect for already-authenticated users away from `/login`/`/register` not yet implemented.
- Header tenant switcher is display-only (not wired to `GET /tenants`/switch API); a SUPERADMIN without an active tenant gets the API's `403 Tenant context required` in the dashboard error panel.
- `/dashboard` is wired to real data; the other operational pages still render sample data until their Phase 3 step.
- `npm run lint` has pre-existing font warnings (not introduced here).
