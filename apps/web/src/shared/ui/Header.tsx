"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { ROLE_LABEL, roleInitials } from "@/store/role-labels";
import { isRouteAllowed } from "@/store/route-access";
import TenantContextMenu from "@/components/TenantContextMenu";
import CommandPalette from "@/components/CommandPalette";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
    Menu,
    Search,
    Bell,
    ChevronDown,
    LogOut,
    User,
    Building,
    Settings,
    Zap,
    Loader2,
    Bolt,
} from "lucide-react";

interface HeaderProps {
    onToggleMobileMenu?: () => void;
}

export default function Header({ onToggleMobileMenu }: HeaderProps) {
    const { user } = useAppSelector((s) => s.auth);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const [profileOpen, setProfileOpen] = useState(false);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setCommandPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const displayName = user?.name || user?.email || "Signed in";
    const displayRole = user?.role ? ROLE_LABEL[user.role] : "Session";

    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onLogout = async () => {
        setIsLoggingOut(true);
        setProfileOpen(false);
        const toastId = toast.loading("Signing out…", { id: "auth-logout" });
        
        // Brief pause for visual smoothness
        await new Promise((resolve) => setTimeout(resolve, 350));
        
        dispatch(logout());
        toast.success("Signed out successfully", { id: toastId });
        router.replace("/login");
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        };
        if (profileOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [profileOpen]);

    const tapHighlight = { WebkitTapHighlightColor: "transparent" };

    return (
        <header
            className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface/85 backdrop-blur-xl border-b border-surface-container z-40 px-4 md:px-6 flex items-center justify-between"
            style={tapHighlight}
        >
            {/* Left: Mobile trigger & Tenant Context */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={onToggleMobileMenu}
                    className="md:hidden text-on-surface-variant hover:text-primary hover:bg-surface-container-low"
                    aria-label="Toggle Navigation Menu"
                    style={tapHighlight}
                >
                    <Menu className="w-5 h-5" />
                </Button>

                <TenantContextMenu />

                <div className="relative hidden sm:flex items-center w-64 md:w-80">
                    <Search
                        className="w-4 h-4 text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none select-none"
                    />
                    <Input
                        type="text"
                        placeholder="Search campaigns, leads, agents..."
                        onFocus={() => setCommandPaletteOpen(true)}
                        onClick={() => setCommandPaletteOpen(true)}
                        readOnly
                        className="w-full h-9 pl-9 pr-14 rounded-lg border border-outline-variant bg-surface-container-lowest font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-fixed-dim shadow-xs transition-all cursor-default"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                        <kbd
                            className="font-label-xs text-label-xs px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant font-medium"
                            style={tapHighlight}
                        >
                            ⌘K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right: Credits, Notifications & User profile */}
            <div className="flex items-center gap-2">
                {/* Credit Balance Pill */}
                <Link
                    href="/credits"
                    className="hidden sm:flex items-center gap-2 pl-2.5 pr-1.5 py-1 rounded-full bg-surface-container-lowest border border-outline-variant hover:border-primary/40 shadow-xs transition-colors"
                >
                    <div className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-primary-container" />
                        <span className="font-label-sm text-label-sm font-semibold text-on-surface tabular-nums">
                            74,200
                        </span>
                        <span className="font-label-xs text-label-xs text-on-surface-variant">Credits</span>
                    </div>
                    <span className="font-label-xs text-label-xs px-2 py-0.5 rounded-full bg-primary-container text-on-primary hover:bg-primary transition-colors font-medium">
                        + Top up
                    </span>
                </Link>

                {/* Notifications Icon Button */}
                <Link
                    href="/notifications"
                    className="relative p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low transition-colors"
                    aria-label="Notifications"
                    style={tapHighlight}
                >
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest" />
                </Link>

                {/* Divider (per design: h-4 w-px) */}
                <div className="h-4 w-px bg-outline-variant hidden sm:block" />

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <Button
                        variant="ghost"
                        onClick={() => setProfileOpen(!profileOpen)}
                        className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-lg border-l-0 text-left text-sm hover:bg-surface-container-low aria-expanded:bg-surface-container-low"
                        aria-expanded={profileOpen}
                        aria-haspopup="menu"
                        style={tapHighlight}
                    >
                        <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary border border-primary/30 flex items-center justify-center font-bold text-xs tracking-tight shrink-0">
                            {roleInitials(displayName)}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-semibold text-on-surface leading-tight truncate max-w-[140px]">
                                {displayName}
                            </span>
                            <span className="text-[10px] font-medium text-secondary leading-tight flex items-center gap-1">
                                {displayRole}
                                <ChevronDown
                                    className="w-3 h-3 opacity-60 group-hover/button:opacity-100 transition-opacity"
                                />
                            </span>
                        </div>
                    </Button>

                    {profileOpen && (
                        <div
                            className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/60 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                            style={tapHighlight}
                        >
                            <div className="px-3.5 py-2.5 border-b border-outline-variant/40">
                                <p className="text-xs font-bold text-on-surface truncate">{displayName}</p>
                                <p className="text-[11px] text-secondary truncate">
                                    {user?.email || "user@styre.ai"}
                                </p>
                                {user?.role && (
                                    <span className="inline-block mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant uppercase tracking-wider">
                                        {user.role}
                                    </span>
                                )}
                            </div>

                            <div className="py-1 text-xs">
                                {isRouteAllowed("/organization", user?.role) && (
                                    <Link
                                        href="/organization"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-2 px-3.5 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-md transition-colors"
                                        style={tapHighlight}
                                    >
                                        <Building className="w-3.5 h-3.5 text-outline" />
                                        <span>Organization Profile</span>
                                    </Link>
                                )}
                                {isRouteAllowed("/team", user?.role) && (
                                    <Link
                                        href="/team"
                                        onClick={() => setProfileOpen(false)}
                                        className="flex items-center gap-2 px-3.5 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-md transition-colors"
                                        style={tapHighlight}
                                    >
                                        <User className="w-3.5 h-3.5 text-outline" />
                                        <span>Team & Users</span>
                                    </Link>
                                )}
                                <Link
                                    href="/settings"
                                    onClick={() => setProfileOpen(false)}
                                    className="flex items-center gap-2 px-3.5 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-md transition-colors"
                                    style={tapHighlight}
                                >
                                    <Settings className="w-3.5 h-3.5 text-outline" />
                                    <span>Settings</span>
                                </Link>
                            </div>

                            <div className="pt-1 border-t border-outline-variant/40 text-xs">
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={onLogout}
                                    className="w-full flex items-center gap-2 px-3.5 py-2 text-left font-medium justify-start"
                                    style={tapHighlight}
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                    <span>Sign Out</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Global Command Palette (⌘K) Modal */}
            <CommandPalette
                isOpen={commandPaletteOpen}
                onClose={() => setCommandPaletteOpen(false)}
            />

            {/* Logout Progress Overlay */}
            {isLoggingOut && (
                <div className="fixed inset-0 z-50 bg-surface/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-in fade-in duration-200">
                    <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/25">
                        <Bolt className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-secondary">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Signing out of workspace…</span>
                    </div>
                </div>
            )}
        </header>
    );
}