import type { UserRole } from "@/types/auth";

interface RouteRule {
  prefix: string;
  roles: UserRole[] | null;
}

/** Ordered: first matching prefix wins. */
const ROUTE_ACCESS: RouteRule[] = [
  { prefix: "/tenant-director", roles: ["SUPERADMIN"] },
  { prefix: "/admin", roles: ["SUPERADMIN"] },
  { prefix: "/organization", roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN"] },
  { prefix: "/workforce", roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN", "MANAGER"] },
  { prefix: "/team", roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN", "MANAGER"] },
  { prefix: "/credits", roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN"] },
  { prefix: "/audit-log", roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN"] },
];

/** Public (auth) routes â€” never guarded, served without a session. */
export const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}


export function isRouteAllowed(pathname: string, role: UserRole | undefined | null): boolean {
  if (!role) return false;
  if (role === "SUPERADMIN") return true;

  const rule = ROUTE_ACCESS.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`)
  );
  if (!rule || !rule.roles) return true;
  return rule.roles.includes(role);
}

