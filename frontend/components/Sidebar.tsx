"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import type { UserRole } from "@/types/auth";
import Logo from "@/components/Logo";
import {
  IconDashboard,
  IconBot,
  IconInbox,
  IconUser,
  IconMegaphone,
  IconShare,
  IconUsers,
  IconBuilding,
  IconShield,
  IconClose,
} from "@/components/Icons";

interface SidebarProps {
  onCloseMobile?: () => void;
}

const OPS: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER", "AGENT_OPERATOR"];
const OWNER: UserRole[] = ["SUPERADMIN", "CLIENT_OWNER"];

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  roles: UserRole[];
  badge?: string;
  section?: string;
}

const navItems: NavItem[] = [
  // Core Operations
  { label: "Overview", href: "/dashboard", icon: IconDashboard, roles: OPS, section: "OPERATIONS" },
  { label: "AI Agents", href: "/agents", icon: IconBot, roles: OPS },
  { label: "Unified Inbox", href: "/inbox", icon: IconInbox, roles: OPS },
  { label: "Leads & Pipeline", href: "/leads", icon: IconUser, roles: OPS },

  // Marketing & Campaigns
  { label: "Publishing", href: "/publishing", icon: IconMegaphone, roles: OWNER, section: "CAMPAIGNS" },
  { label: "Social Channels", href: "/channels", icon: IconShare, roles: OWNER },

  // Management & Settings
  { label: "Team Members", href: "/team", icon: IconUsers, roles: OWNER, section: "SETTINGS" },
  { label: "Organization", href: "/organization", icon: IconBuilding, roles: OWNER },
  { label: "Tenant Directory", href: "/admin/tenants", icon: IconShield, roles: ["SUPERADMIN"], badge: "SUPER" },
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
    <aside className="h-full w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between select-none shadow-xs">
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-200/80">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onCloseMobile}>
            <Logo size="sm" showText={true} />
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <IconClose size={20} />
            </button>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item, idx) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href));
            const prevItem = visibleItems[idx - 1];
            const showSection = item.section && (!prevItem || prevItem.section !== item.section);
            const Icon = item.icon;

            return (
              <div key={item.href}>
                {showSection && (
                  <div className="px-3 pt-3.5 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    {item.section}
                  </div>
                )}
                <Link
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-xs transition-all ${
                    isActive
                      ? "bg-indigo-600 text-white font-semibold shadow-sm shadow-indigo-600/30"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon size={18} className={isActive ? "text-white" : "text-slate-400"} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-indigo-50 text-indigo-700 border border-indigo-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Minimalist Enclave Status Badge */}
        <div className="p-3 border-t border-slate-100">
          <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-slate-600">Enclave Active</span>
            </div>
            <span className="text-[9px] font-mono text-slate-400">v4.2</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
