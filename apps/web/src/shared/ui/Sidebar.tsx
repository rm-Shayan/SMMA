"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppSelector } from "@/redux/hooks";
import { Logo } from "@/components/shared/Logo";
import {
    LayoutDashboard,
    Users2,
    CheckSquare,
    Flame,
    Briefcase,
    GraduationCap,
    Send,
    Calendar,
    Share2,
    Inbox,
    Target,
    Radar,
    Bot,
    PlayCircle,
    Database,
    Building2,
    CreditCard,
    Bell,
    Settings,
    ShieldCheck,
    ChevronDown,
    ChevronRight,
    Zap,
    X,
    FolderKanban,
    SlidersHorizontal,
    BarChart3,
    Image as ImageIcon,
    MessageSquare,
    History,
} from "lucide-react";

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    badgeVariant?: "default" | "warning" | "success" | "brand";
    roles?: string[];
}

interface NavSection {
    title: string;
    sectionIcon: React.ComponentType<{ className?: string }>;
    roles?: string[];
    items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
    {
        title: "Core Execution",
        sectionIcon: FolderKanban,
        items: [
            { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            {
                label: "Workforce Hub",
                href: "/workforce",
                icon: Users2,
                roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN", "MANAGER"],
            },
            {
                label: "Approvals",
                href: "/approvals",
                icon: CheckSquare,
                badge: "3",
                badgeVariant: "warning",
            },
            { label: "Team Campaigns", href: "/campaigns", icon: Flame },
            { label: "Reporting", href: "/reporting", icon: BarChart3 },
            { label: "My Workspace", href: "/workspace", icon: Briefcase },
            { label: "SOP Academy", href: "/academy", icon: GraduationCap },
        ],
    },
    {
        title: "Channels & Outreach",
        sectionIcon: Share2,
        items: [
            { label: "Publishing", href: "/publishing", icon: Send },
            { label: "Content Library", href: "/content-library", icon: Calendar },
            { label: "Media Library", href: "/media", icon: ImageIcon },
            { label: "Channels", href: "/channels", icon: Share2 },
            {
                label: "Inbox",
                href: "/inbox",
                icon: Inbox,
                badge: "12",
                badgeVariant: "brand",
            },
            { label: "Comment Moderation", href: "/social/comments", icon: MessageSquare },
            { label: "Leads & Sequences", href: "/leads", icon: Target },
            { label: "Competitor Radar", href: "/competitor-radar", icon: Radar },
        ],
    },
    {
        title: "AI Fleet & Automation",
        sectionIcon: Bot,
        items: [
            {
                label: "12-Agent Fleet",
                href: "/agents",
                icon: Bot,
                badge: "12 Active",
                badgeVariant: "success",
            },
            { label: "Run History", href: "/agents/runs", icon: History },
            { label: "Run Workflow", href: "/workflows", icon: PlayCircle },
            { label: "Knowledge Base", href: "/knowledge-base", icon: Database },
        ],
    },
    {
        title: "Administration & Control",
        sectionIcon: SlidersHorizontal,
        items: [
            {
                label: "Tenant Director",
                href: "/tenant-director",
                icon: Building2,
                roles: ["SUPERADMIN"],
            },
            {
                label: "Team & Access",
                href: "/team",
                icon: Users2,
                roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN", "MANAGER"],
            },
            {
                label: "Credits & Billing",
                href: "/credits",
                icon: CreditCard,
                roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN"],
            },
            { label: "Notifications", href: "/notifications", icon: Bell },
            {
                label: "Audit Log",
                href: "/audit-log",
                icon: ShieldCheck,
                roles: ["SUPERADMIN", "CLIENT_OWNER", "COMPANY_ADMIN"],
            },
            { label: "Settings", href: "/settings", icon: Settings },
        ],
    },
];

export default function Sidebar({ onCloseMobile }: { onCloseMobile?: () => void }) {
    const pathname = usePathname();
    const { user } = useAppSelector((state) => state.auth);
    const currentRole = user?.role || "GUEST";

    // Section collapsible state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        "Core Execution": true,
        "Channels & Outreach": true,
        "AI Fleet & Automation": true,
        "Administration & Control": true,
    });

    const toggleSection = (title: string) => {
        setOpenSections((prev) => ({
            ...prev,
            [title]: !prev[title],
        }));
    };

    const isRoleAllowed = (allowedRoles?: string[]) => {
        if (!allowedRoles || allowedRoles.length === 0) return true;
        if (currentRole === "SUPERADMIN") return true;
        return allowedRoles.includes(currentRole);
    };

    return (
        <aside className="w-full h-full bg-surface-container-lowest border-r border-outline-variant/40 flex flex-col justify-between select-none shadow-xs">
            {/* Brand Header */}
            <div className="h-16 px-5 border-b border-surface-container flex items-center justify-between shrink-0 bg-surface-container-lowest">
                <Logo size="md" />
                {onCloseMobile && (
                    <button
                        onClick={onCloseMobile}
                        className="md:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Navigation Links Scroll Container */}
            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 scrollbar-thin scrollbar-thumb-surface-container-high">
                {NAV_SECTIONS.map((section) => {
                    if (section.roles && !isRoleAllowed(section.roles)) return null;

                    const visibleItems = section.items.filter((item) => isRoleAllowed(item.roles));
                    if (visibleItems.length === 0) return null;

                    const isSectionOpen = openSections[section.title] ?? true;
                    const SectionIcon = section.sectionIcon;

                    // Check if current route is inside this section
                    const hasActiveChild = visibleItems.some(
                        (item) => pathname === item.href || pathname?.startsWith(item.href + "/")
                    );

                    return (
                        <div key={section.title} className="rounded-xl transition-all">
                            {/* Collapsible Section Header Trigger */}
                            <button
                                type="button"
                                onClick={() => toggleSection(section.title)}
                                className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${hasActiveChild && !isSectionOpen
                                        ? "bg-surface-container-low text-primary font-bold"
                                        : "text-outline hover:text-on-surface hover:bg-surface-container-low/70"
                                    }`}
                                aria-expanded={isSectionOpen}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <SectionIcon
                                        className={`w-3.5 h-3.5 shrink-0 transition-colors ${hasActiveChild ? "text-primary" : "text-outline group-hover:text-on-surface-variant"
                                            }`}
                                    />
                                    <span className="font-label-xs text-label-xs font-bold tracking-wider uppercase truncate">
                                        {section.title}
                                    </span>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    {!isSectionOpen && hasActiveChild && (
                                        <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
                                    )}
                                    <span
                                        className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${!isSectionOpen
                                                ? "bg-surface-container text-on-surface-variant"
                                                : "text-outline group-hover:text-secondary"
                                            }`}
                                    >
                                        {visibleItems.length}
                                    </span>
                                    <ChevronDown
                                        className={`w-3.5 h-3.5 text-outline group-hover:text-secondary transition-transform duration-200 ${isSectionOpen ? "rotate-0" : "-rotate-90"
                                            }`}
                                    />
                                </div>
                            </button>

                            {/* Collapsible Items Container */}
                            {isSectionOpen && (
                                <div className="mt-1 space-y-0.5 pl-1 transition-all animate-in fade-in-50 duration-150">
                                    {visibleItems.map((item) => {
                                        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
                                        const Icon = item.icon;

                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={onCloseMobile}
                                                prefetch={false}
                                                className={`group flex items-center justify-between px-3 py-2 rounded-lg font-label-md text-label-md transition-all ${isActive
                                                        ? "bg-primary-container text-on-primary font-semibold shadow-sm"
                                                        : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <Icon
                                                        className={`w-4 h-4 shrink-0 transition-transform ${isActive
                                                                ? "text-on-primary"
                                                                : "text-outline group-hover:text-primary group-hover:scale-105"
                                                            }`}
                                                    />
                                                    <span className="truncate">{item.label}</span>
                                                </div>

                                                {item.badge && (
                                                    <span
                                                        className={`font-label-xs text-label-xs px-1.5 py-0.5 rounded-full tracking-wider shrink-0 font-semibold ${item.badgeVariant === "warning"
                                                                ? "bg-[#FFE082] text-[#A86108]"
                                                                : item.badgeVariant === "success"
                                                                    ? "bg-[#95F6C4] text-[#00714C]"
                                                                    : item.badgeVariant === "brand"
                                                                        ? isActive
                                                                            ? "bg-surface-container-lowest/20 text-white"
                                                                            : "bg-primary-fixed text-on-primary-fixed-variant"
                                                                        : "bg-surface-container text-on-surface-variant"
                                                            }`}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer / Credits & System Status (from Stitch spec) */}
            <div className="p-3 border-t border-surface-container bg-surface-container-lowest shrink-0">
                <Link
                    href="/credits"
                    prefetch={false}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-outline-variant/40 bg-surface-container-lowest hover:border-primary/40 hover:shadow-xs transition-all mb-2.5 group"
                >
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0 group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="text-left truncate">
                            <p className="font-label-xs text-label-xs font-bold text-on-surface uppercase tracking-wider">
                                Fleet Credits
                            </p>
                            <p className="font-label-xs text-label-xs font-semibold text-secondary tabular-nums">
                                74,200 / 100k
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-outline group-hover:text-secondary group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* Engine Operational Status */}
                <div className="flex items-center justify-between px-2 text-[11px] text-outline">
                    <span className="font-medium">Styre Autonomous v2.4</span>
                    <span className="inline-flex items-center gap-1.5 font-semibold text-on-surface">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-fixed-dim opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary-container"></span>
                        </span>
                        Active
                    </span>
                </div>
            </div>
        </aside>
    );
}