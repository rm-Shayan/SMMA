"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
    Search,
    X,
    LayoutDashboard,
    Bot,
    Share2,
    Inbox,
    Target,
    CreditCard,
    Building2,
    Users2,
    Bell,
    ShieldCheck,
    Settings,
    PlusCircle,
    Calendar,
    Zap,
    CornerDownLeft,
    Radar,
    PlayCircle,
    Database,
    User,
    FileText,
} from "lucide-react";

interface PaletteItem {
    id: string;
    category: "Pages" | "Actions" | "Recent";
    title: string;
    subtitle: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    tag: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
    // ── Pages ──────────────────────────────────────────────────────────────
    {
        id: "p-dashboard",
        category: "Pages",
        title: "Dashboard",
        subtitle: "Overview • Live metrics & tactical brief",
        href: "/dashboard",
        icon: LayoutDashboard,
        tag: "Page",
    },
    {
        id: "p-workforce",
        category: "Pages",
        title: "Workforce Hub",
        subtitle: "Management • Quotas, permissions & seats",
        href: "/workforce",
        icon: Users2,
        tag: "Page",
    },
    {
        id: "p-approvals",
        category: "Pages",
        title: "Approvals Queue",
        subtitle: "Review • 3 pending AI drafts awaiting sign-off",
        href: "/approvals",
        icon: ShieldCheck,
        tag: "3 Pending",
    },
    {
        id: "p-agents",
        category: "Pages",
        title: "12-Agent Fleet",
        subtitle: "Intelligence • Autonomous execution mesh",
        href: "/agents",
        icon: Bot,
        tag: "Page",
    },
    {
        id: "p-workflows",
        category: "Pages",
        title: "Run a Workflow",
        subtitle: "Intelligence • Multi-agent prompt planner",
        href: "/workflows",
        icon: PlayCircle,
        tag: "Page",
    },
    {
        id: "p-publishing",
        category: "Pages",
        title: "Publishing & Calendar",
        subtitle: "Channels • Content scheduling and syndication",
        href: "/publishing",
        icon: Calendar,
        tag: "Page",
    },
    {
        id: "p-inbox",
        category: "Pages",
        title: "Unified Inbox",
        subtitle: "Conversations • Multi-channel direct messaging",
        href: "/inbox",
        icon: Inbox,
        tag: "12 Unread",
    },
    {
        id: "p-leads",
        category: "Pages",
        title: "Leads & Sequences",
        subtitle: "Pipeline • CRM contacts and deal routing",
        href: "/leads",
        icon: Target,
        tag: "Page",
    },
    {
        id: "p-channels",
        category: "Pages",
        title: "Channels & Integrations",
        subtitle: "Workspace • Connected accounts & pace rates",
        href: "/channels",
        icon: Share2,
        tag: "Page",
    },
    {
        id: "p-competitor",
        category: "Pages",
        title: "Competitor Radar",
        subtitle: "Intelligence • Price monitoring and social scans",
        href: "/competitor-radar",
        icon: Radar,
        tag: "Page",
    },
    {
        id: "p-team",
        category: "Pages",
        title: "Team & Access Control",
        subtitle: "Admin • Member directory and agent access",
        href: "/team",
        icon: Users2,
        tag: "Page",
    },
    {
        id: "p-credits",
        category: "Pages",
        title: "Credits & Billing",
        subtitle: "Billing • Quota balances & invoice ledger",
        href: "/credits",
        icon: CreditCard,
        tag: "Page",
    },
    {
        id: "p-tenant-director",
        category: "Pages",
        title: "Tenant Director",
        subtitle: "SuperAdmin • Multi-company control and provisioning",
        href: "/tenant-director",
        icon: Building2,
        tag: "SuperAdmin",
    },
    {
        id: "p-knowledge",
        category: "Pages",
        title: "Knowledge Base",
        subtitle: "RAG • Company SOPs, docs, and training data",
        href: "/knowledge-base",
        icon: Database,
        tag: "Page",
    },
    {
        id: "p-notifications",
        category: "Pages",
        title: "Notifications",
        subtitle: "Activity • System alerts and security triggers",
        href: "/notifications",
        icon: Bell,
        tag: "Activity",
    },
    {
        id: "p-audit",
        category: "Pages",
        title: "Audit Log",
        subtitle: "Security • Tamper-evident activity stream",
        href: "/audit-log",
        icon: ShieldCheck,
        tag: "Security",
    },
    {
        id: "p-settings",
        category: "Pages",
        title: "Settings & Profile",
        subtitle: "Account • Preferences, password and security",
        href: "/settings",
        icon: Settings,
        tag: "Profile",
    },

    // ── Actions ────────────────────────────────────────────────────────────
    {
        id: "a-buy-credits",
        category: "Actions",
        title: "Top-up Fleet Credits",
        subtitle: "Open billing top-up dialog",
        href: "/credits",
        icon: Zap,
        tag: "Action",
    },
    {
        id: "a-run-workflow",
        category: "Actions",
        title: "Launch Autonomous Workflow",
        subtitle: "Prompt the 12-agent mesh for a new task",
        href: "/workflows",
        icon: PlusCircle,
        tag: "Action",
    },
    {
        id: "a-connect-channel",
        category: "Actions",
        title: "Connect Channel Account",
        subtitle: "Link LinkedIn, Instagram, Meta or Email",
        href: "/channels",
        icon: Share2,
        tag: "Action",
    },
    {
        id: "a-import-leads",
        category: "Actions",
        title: "Import Leads CSV",
        subtitle: "Upload new MQL contacts to active pipeline",
        href: "/leads",
        icon: Target,
        tag: "Action",
    },

    // ── Recent & Contacts (shown when the query is empty) ──────────────────
    {
        id: "r-lead-daniel",
        category: "Recent",
        title: "Daniel Carter",
        subtitle: "Lead • VP Marketing at Apex Retail",
        href: "/leads",
        icon: User,
        tag: "Lead",
    },
    {
        id: "r-sop-playbook",
        category: "Recent",
        title: "Agency Cold Outreach Playbook v2",
        subtitle: "SOP Academy • Due in 3 days",
        href: "/academy",
        icon: FileText,
        tag: "SOP",
    },
];

const GROUP_ORDER: PaletteItem["category"][] = ["Pages", "Actions", "Recent"];

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mounted, setMounted] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            const resetTimer = setTimeout(() => {
                setQuery("");
                setSelectedIndex(0);
            }, 0);
            const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
            return () => {
                clearTimeout(resetTimer);
                clearTimeout(focusTimer);
            };
        }
    }, [isOpen]);

    // While open, lock background scroll (prevents the "washed out / stuck" feel)
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [isOpen]);

    const filteredItems = useMemo(() => {
        if (!query.trim()) return PALETTE_ITEMS;
        const q = query.toLowerCase();
        return PALETTE_ITEMS.filter(
            (item) =>
                item.title.toLowerCase().includes(q) ||
                item.subtitle.toLowerCase().includes(q) ||
                item.category.toLowerCase().includes(q) ||
                item.tag.toLowerCase().includes(q)
        );
    }, [query]);

    const handleSelect = (item: PaletteItem) => {
        onClose();
        router.push(item.href);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === "Escape") {
                e.preventDefault();
                onClose();
            } else if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (filteredItems[selectedIndex]) {
                    handleSelect(filteredItems[selectedIndex]);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, filteredItems, selectedIndex]);

    if (!isOpen || !mounted) return null;

    const visibleGroups = GROUP_ORDER.map((group) => ({
        group,
        items: filteredItems.filter((i) => i.category === group),
    })).filter((g) => g.items.length > 0);

    const itemRow = (item: PaletteItem, globalIndex: number) => {
        const isSelected = globalIndex === selectedIndex;
        const Icon = item.icon;

        return (
            <div
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(globalIndex)}
                className={`mx-2 px-3 py-2.5 rounded-lg flex items-center justify-between cursor-pointer group transition-colors ${isSelected
                        ? "bg-surface-container-low"
                        : "hover:bg-surface-container-low/60"
                    }`}
            >
                <div className="flex items-center gap-3 min-w-0">
                    {/* Selected: primary tinted icon tile · Idle: neutral tile (per design) */}
                    <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected
                                ? item.category === "Actions"
                                    ? "bg-secondary-container/60 text-on-secondary-container"
                                    : "bg-primary-container/10 text-primary-container"
                                : "bg-surface-container-low text-secondary"
                            }`}
                    >
                        <Icon className="w-[18px] h-[18px]" />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <span
                            className={`font-label-md text-label-md truncate ${isSelected ? "text-on-surface font-semibold" : "text-on-surface font-medium"
                                }`}
                        >
                            {item.title}
                        </span>
                        <span className="font-label-xs text-label-xs text-secondary truncate">
                            {item.subtitle}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                    <span
                        className={`px-2 py-0.5 rounded font-label-xs text-label-xs font-medium shadow-xs ${item.category === "Actions"
                                ? "bg-surface-container text-secondary"
                                : item.tag === "Lead"
                                    ? "bg-error-container/60 text-error font-semibold"
                                    : item.tag === "SOP"
                                        ? "bg-secondary-container text-on-secondary-container font-semibold"
                                        : "bg-surface-container-lowest text-on-surface-variant"
                            }`}
                    >
                        {item.tag}
                    </span>
                    {isSelected && (
                        <kbd className="px-1.5 py-0.5 font-label-xs text-label-xs bg-surface-container-lowest text-primary-container font-semibold rounded shadow-xs flex items-center">
                            <CornerDownLeft className="w-3 h-3" />
                        </kbd>
                    )}
                </div>
            </div>
        );
    };

    return createPortal(
        <div
            className="fixed inset-0 bg-inverse-surface/35 backdrop-blur-sm z-[9999] flex flex-col items-center pt-16 sm:pt-20 px-4 overflow-y-auto animate-in fade-in duration-150"
            onClick={onClose}
            role="presentation"
        >
            {/* Main Command Palette Dialog (640px) */}
            <div
                className="w-full max-w-[640px] bg-surface-container-lowest rounded-2xl shadow-2xl overflow-hidden my-auto sm:my-0 animate-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Command palette"
            >
                {/* Search Input Bar */}
                <div className="h-16 px-5 flex items-center justify-between gap-3 bg-surface-container-lowest">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <Search className="w-[22px] h-[22px] text-outline shrink-0 select-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setSelectedIndex(0);
                            }}
                            placeholder="Search campaigns, leads, agents, pages, or actions..."
                            className="w-full h-full bg-transparent font-body-lg text-body-lg text-on-surface placeholder:text-outline focus:outline-none"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                aria-label="Clear search"
                                className="p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <kbd className="px-2 py-0.5 font-label-xs text-label-xs font-medium text-secondary bg-surface-container-low rounded select-none shrink-0">
                        Esc
                    </kbd>
                </div>
                <div className="h-px w-full bg-surface-container" />

                {/* Filtered Results List */}
                <div className="max-h-[460px] overflow-y-auto py-2 space-y-1">
                    {filteredItems.length === 0 ? (
                        <div className="py-12 text-center">
                            <Search className="w-8 h-8 mx-auto text-outline-variant mb-2" />
                            <p className="font-label-md text-label-md font-semibold text-on-surface">
                                No results found for &ldquo;{query}&rdquo;
                            </p>
                            <p className="font-label-xs text-label-xs text-outline mt-1">
                                Try searching for &quot;dashboard&quot;, &quot;agents&quot;, &quot;credits&quot;, or
                                &quot;leads&quot;.
                            </p>
                        </div>
                    ) : (
                        visibleGroups.map(({ group, items }) => (
                            <div key={group} className="space-y-0.5">
                                <div className="px-4 pt-2.5 pb-1 font-label-xs text-label-xs font-semibold tracking-wider text-outline uppercase select-none">
                                    {group} ({items.length})
                                </div>
                                {items.map((item) =>
                                    itemRow(item, filteredItems.findIndex((i) => i.id === item.id))
                                )}
                            </div>
                        ))
                    )}
                </div>

                <div className="h-px w-full bg-surface-container" />

                {/* Footer / Shortcut Cheatsheet */}
                <div className="h-11 px-5 bg-surface-container-low/70 flex items-center justify-between font-label-xs text-label-xs text-secondary select-none">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 bg-surface-container-lowest text-on-surface font-mono rounded shadow-xs">
                                ↑
                            </kbd>
                            <kbd className="px-1.5 py-0.5 bg-surface-container-lowest text-on-surface font-mono rounded shadow-xs">
                                ↓
                            </kbd>
                            <span>to navigate</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 bg-surface-container-lowest text-on-surface font-mono rounded shadow-xs">
                                ↵
                            </kbd>
                            <span>to select</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 bg-surface-container-lowest text-on-surface font-mono rounded shadow-xs">
                                Esc
                            </kbd>
                            <span>to close</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                        <span>Autonomous Indexing Active</span>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
