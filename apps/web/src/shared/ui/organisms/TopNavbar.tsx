"use client";

import React from "react";
import Link from "next/link";
import { Bell, Menu, Sparkles } from "lucide-react";
import { UserDropdown } from "../molecules/UserDropdown";
import { uiStore } from "../../store/uiStore";

export interface TopNavbarProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  userName?: string;
  userRole?: string;
  avatarUrl?: string;
  unreadNotificationsCount?: number;
  onLogout?: () => void;
}

export function TopNavbar({
  breadcrumbs = [{ label: "Workspace" }, { label: "Dashboard" }],
  userName = "Founder",
  userRole = "Owner",
  avatarUrl,
  unreadNotificationsCount = 0,
  onLogout,
}: TopNavbarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => uiStore.toggleSidebar()}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={crumb.label}>
              {idx > 0 && <span className="text-muted-foreground/60">/</span>}
              {crumb.href ? (
                <Link
                  href={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={
                    idx === breadcrumbs.length - 1
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous Fleet Online</span>
        </div>

        {/* Notifications Icon */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
          )}
        </Link>

        {/* User Profile */}
        <UserDropdown
          name={userName}
          role={userRole}
          avatarUrl={avatarUrl}
          onLogout={onLogout}
        />
      </div>
    </header>
  );
}
