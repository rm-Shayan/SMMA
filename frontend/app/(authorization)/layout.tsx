import type { ReactNode } from "react";
import AuthorizationGuard from "@/components/AuthorizationGuard";

/**
 * Server shell for the whole `(authorization)` route group.
 *
 * The actual guard is a Client Component (`AuthorizationGuard`) because the
 * session is read from the browser. That means this segment cannot render its
 * children during prerender — Next.js would drop `page.tsx` from the static
 * shell and fail instant-navigation validation with:
 *
 *   Route "/dashboard": Could not validate that a segment in your UI has
 *   instant navigation. This segment was dropped from rendering.
 *
 * `instant = false` is the documented opt-out for exactly this case: a segment
 * that is allowed to block while client-side state resolves (see
 * node_modules/next/dist/docs/.../route-segment-config/instant.md). It must be
 * exported from a Server Component, which is why the guard lives one file down.
 */
export const instant = false;

export default function AuthorizationLayout({ children }: { children: ReactNode }) {
  return <AuthorizationGuard>{children}</AuthorizationGuard>;
}
