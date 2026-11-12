"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import type { UserRole } from "@/types/auth";
import { ROLE_LABEL, roleInitials } from "@/types/role-labels";

interface SidebarProps { onCloseMobile?: () => void; }

const OPS: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER", "AGENT_OPERATOR"];
const OWNER: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER"];

interface NavItem { label: string; href: string; icon: string; roles: UserRole[]; badge?: string; }
const navItems: NavItem[] = [
  { label: "Overview", href: "/dashboard", icon: "grid_view", roles: OPS },
  { label: "Agent Workspace", href: "/agents", icon: "smart_toy", roles: OPS },
  { label: "Inbox", href: "/inbox", icon: "inbox", roles: OPS },
  { label: "Leads", href: "/leads", icon: "contact_page", roles: OPS },
  { label: "Publishing", href: "/publishing", icon: "campaign", roles: OWNER },
  { label: "Channels", href: "/channels", icon: "hub", roles: OWNER },
  { label: "Organization", href: "/organization", icon: "corporate_fare", roles: OWNER },
  { label: "Team", href: "/team", icon: "group", roles: OWNER },
  { label: "Tenant Directory", href: "/admin/tenants", icon: "domain", roles: ["SUPERADMIN"], badge: "SUPERADMIN" },
];

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  // The shell is prerendered without a pathname, so highlighting a nav item on
  // the server would not match the client and React would discard the tree.
  // Wait one render before applying the active state.
  const currentPath = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = mounted ? currentPath : null;
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role ?? null;
  const visibleItems = role ? navItems.filter((item) => item.roles.includes(role)) : [];
  const displayName = user?.name || user?.email || "Signed in";

  return (
    <aside className="h-full w-64 bg-surface-container-lowest border-r border-outline-variant/40 flex flex-col justify-between">
      <div className="flex flex-col h-full">
        <div className="h-16 px-space-xl flex items-center justify-between border-b border-outline-variant/40">
          <Link href="/dashboard" className="flex items-center gap-space-sm" onClick={onCloseMobile}>
            <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center text-on-primary"><span className="material-symbols-outlined text-[18px]">neurology</span></div>
            <span className="font-headline-md text-headline-md text-on-surface tracking-tight">SMMA AI</span>
          </Link>
          {onCloseMobile && <button onClick={onCloseMobile} className="md:hidden p-1.5 rounded-lg text-secondary"><span className="material-symbols-outlined text-[20px]">close</span></button>}
        </div>
        <nav className="flex-1 px-space-md py-space-lg space-y-1 overflow-y-auto">
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onCloseMobile} className={`flex items-center justify-between px-space-md py-space-sm rounded-lg font-label-md text-label-md ${isActive ? "bg-primary-container text-on-primary font-semibold" : "text-on-secondary-container hover:bg-surface-container-low"}`}>
                <div className="flex items-center gap-space-md"><span className="material-symbols-outlined text-[18px]">{item.icon}</span><span>{item.label}</span></div>
                {item.badge && <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${isActive ? "bg-white/20 text-white" : "bg-tertiary-fixed text-on-tertiary-fixed"}`}>{item.badge}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-space-md border-t border-outline-variant/40">
          <div className="flex items-center gap-space-md p-space-xs rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-xs shrink-0">{roleInitials(displayName)}</div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-label-md text-label-md text-on-surface truncate" title={displayName}>{displayName}</span>
              <span className="font-caption text-caption text-secondary truncate">{role ? ROLE_LABEL[role] : "Session"}</span>
              <span className="font-caption text-caption text-outline truncate" title={user?.email ?? undefined}>{user?.email || (user?.tenantId ? "Tenant workspace" : "Platform context")}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
