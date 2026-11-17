"use client";

import React, { useState } from "react";
import { ChevronDown, User, LogOut, Settings } from "lucide-react";
import { Avatar } from "../atoms/Avatar";
import { cn } from "@/lib/utils";

export interface UserDropdownProps {
  name: string;
  email?: string;
  role?: string;
  avatarUrl?: string;
  onLogout?: () => void;
  onNavigateSettings?: () => void;
  className?: string;
}

export function UserDropdown({
  name,
  email,
  role = "Owner",
  avatarUrl,
  onLogout,
  onNavigateSettings,
  className,
}: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
      >
        <Avatar size="sm" src={avatarUrl} fallback={name} />
        <div className="flex flex-col text-left hidden sm:flex">
          <span className="text-xs font-semibold text-foreground leading-tight truncate max-w-[120px]">
            {name}
          </span>
          <span className="text-[10px] text-muted-foreground leading-tight">{role}</span>
        </div>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-card border border-border shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in zoom-in-95">
            <div className="px-2.5 py-2 border-b border-border mb-1">
              <p className="text-xs font-semibold text-foreground truncate">{name}</p>
              {email && <p className="text-[10px] text-muted-foreground truncate">{email}</p>}
            </div>

            {onNavigateSettings && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onNavigateSettings();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Settings</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                onLogout?.();
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-lg text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
