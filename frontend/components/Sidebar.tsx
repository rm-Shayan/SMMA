"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import type { UserRole } from "@/types/auth";
import Logo from "@/components/Logo";

interface SidebarProps { onCloseMobile?: () => void; }

const ALL_ROLES: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER", "AGENT_OPERATOR", "TRAINEE"];
const OPS: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER", "AGENT_OPERATOR"];
const OWNER: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER"];

interface NavItem { label: string; href: string; icon: string; roles: UserRole[]; badge?: string; section?: string; }
const navItems: NavItem[] = [
  // Core Operations
  { label: "Overview", href: "/dashboard", icon: "grid_view", roles: OPS, section: "OPERATIONS" },
  { label: "Agent Workspace", href: "/agents", icon: "smart_toy", roles: OPS },
  { label: "Inbox", href: "/inbox", icon: "inbox", roles: OPS },
  { label: "Leads", href: "/leads", icon: "contact_page", roles: OPS },
  { label: "Action Approvals", href: "/approvals", icon: "verified_user", roles: OWNER, badge: "GATE" },

  // Growth & Integrations
  { label: "Publishing", href: "/publishing", icon: "campaign", roles: OWNER, section: "AUTOMATION" },
  { label: "Social Channels", href: "/channels", icon: "hub", roles: OWNER },
  { label: "External Tools", href: "/tools", icon: "extension", roles: OWNER },

  // Knowledge & Training
  { label: "SOP & Training", href: "/training", icon: "school", roles: ALL_ROLES, section: "ACADEMY" },

  // Management
  { label: "Organization", href: "/organization", icon: "corporate_fare", roles: OWNER, section: "MANAGEMENT" },
  { label: "Team", href: "/team", icon: "group", roles: OWNER },
  { label: "Tenant Directory", href: "/admin/tenants", icon: "domain", roles: ["SUPERADMIN"], badge: "SUPERADMIN" },
];

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const currentPath = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = mounted ? currentPath : null;
  const { user } = useAppSelector((s) => s.auth);
  const role = user?.role ?? null;
  const visibleItems = role ? navItems.filter((item) => item.roles.includes(role)) : [];

  return (
    <aside className="h-full w-64 bg-surface-container-lowest border-r border-outline-variant/40 flex flex-col justify-between select-none">
      <div className="flex flex-col h-full">
        {/* Brand Header with New High-End Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-outline-variant/40">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onCloseMobile}>
            <Logo size="sm" showText={true} />
          </Link>
          {onCloseMobile && (
            <button onClick={onCloseMobile} className="md:hidden p-1.5 rounded-lg text-secondary hover:bg-surface-container">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item, idx) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const prevItem = visibleItems[idx - 1];
            const showSection = item.section && (!prevItem || prevItem.section !== item.section);

            return (
              <div key={item.href}>
                {showSection && (
                  <div className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider text-secondary/70 uppercase">
                    {item.section}
                  </div>
                )}
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white font-semibold shadow-xs shadow-indigo-600/30"
                      : "text-on-surface/80 hover:bg-surface-container hover:text-on-surface"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-white" : "text-secondary"}`}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
