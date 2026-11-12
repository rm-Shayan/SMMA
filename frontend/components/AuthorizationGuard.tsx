"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout as logoutAction } from "@/redux/slices/authSlice";
import type { UserRole } from "@/types/auth";
import { ROLE_LABEL } from "@/types/role-labels";

const OPS: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER", "AGENT_OPERATOR"];
const OWNER: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER"];
const ROUTE_ACCESS = [
  { prefix: "/admin/tenants", label: "Tenant Directory", roles: ["SUPERADMIN"] as UserRole[] },
  { prefix: "/publishing", label: "Publishing", roles: OWNER },
  { prefix: "/channels", label: "Channels", roles: OWNER },
  { prefix: "/team", label: "Team", roles: OWNER },
  { prefix: "/organization", label: "Organization", roles: OPS },
  { prefix: "/dashboard", label: "Overview", roles: OPS },
  { prefix: "/agents", label: "Agent Workspace", roles: OPS },
  { prefix: "/inbox", label: "Inbox", roles: OPS },
  { prefix: "/leads", label: "Leads", roles: OPS },
];

function ruleFor(path: string) {
  return ROUTE_ACCESS.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`)) ?? null;
}

export default function AuthorizationGuard({ children }: { children: ReactNode }) {
  const { user, token, status } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const router = useRouter();
  // Cookies are browser-only: reading one during the first client render would
  // render an overlay the server never produced and break hydration.
  const [cookieToken, setCookieToken] = useState<string | null>(null);
  const [cookieChecked, setCookieChecked] = useState(false);
  useEffect(() => {
    setCookieToken(Cookies.get("smma.token") ?? null);
    setCookieChecked(true);
  }, []);
  const hasToken = !!token || !!cookieToken;
  const isAuthenticated = !!user && hasToken;
  const restoring =
    cookieChecked && hasToken && !user && (status === "idle" || status === "loading");

  useEffect(() => {
    if (!hasToken && !user) router.replace("/login");
  }, [hasToken, user, router]);

  if (restoring) {
    return (
      <>
        {children}
        <div role="status" className="fixed inset-0 z-[60] bg-surface flex items-center justify-center">
          <span className="material-symbols-outlined text-[22px] animate-spin text-primary-container">progress_activity</span>
        </div>
      </>
    );
  }
  if (!hasToken && !user) return <>{children}</>;

  const rule = ruleFor(pathname);
  if (isAuthenticated && user && rule && !rule.roles.includes(user.role)) {
    const onLogout = () => { dispatch(logoutAction()); router.push("/login"); };
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-surface-container-lowest border border-outline-variant/40 rounded-2xl p-8 text-center">
          <h1 className="text-lg font-semibold text-on-surface mb-2">Access restricted</h1>
          <p className="text-sm text-secondary">
            <strong>{rule.label}</strong> requires {rule.roles.map((r) => ROLE_LABEL[r]).join(" or ")}. Signed in as{" "}
            <strong>{ROLE_LABEL[user.role]}</strong>.
          </p>
          <div className="flex gap-3 justify-center mt-6">
            <a href="/dashboard" className="px-5 py-2.5 rounded-xl bg-primary-container text-white text-sm font-semibold">Go to Overview</a>
            <button type="button" onClick={onLogout} className="px-5 py-2.5 rounded-xl border text-sm font-semibold text-error">Sign out</button>
          </div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
