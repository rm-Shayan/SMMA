"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { ROLE_LABEL, roleInitials } from "@/types/role-labels";
import TenantContextMenu from "@/components/TenantContextMenu";

interface HeaderProps { onToggleMobileMenu?: () => void; }

export default function Header({ onToggleMobileMenu }: HeaderProps) {
  const { user } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const displayName = user?.name || user?.email || "Signed in";
  const displayRole = user?.role ? ROLE_LABEL[user.role] : "Session";

  const onLogout = () => { dispatch(logout()); setProfileOpen(false); router.push("/login"); };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40 z-40 px-4 md:px-space-xl flex items-center justify-between">
      <div className="flex items-center gap-space-md">
        <button onClick={onToggleMobileMenu} className="md:hidden p-2 rounded-lg text-secondary hover:bg-surface-container-low" aria-label="Toggle Navigation Menu">
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <TenantContextMenu />
      </div>
      <div className="flex items-center gap-space-md">
        
        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-space-md pl-space-md border-l border-outline-variant/40">
            <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-semibold text-xs">{roleInitials(displayName)}</div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-label-md text-label-md text-on-surface leading-tight">{displayName}</span>
              <span className="font-caption text-caption text-secondary leading-tight">{displayRole} ▾</span>
            </div>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/60 py-2 z-50">
              <div className="px-4 py-2 border-b border-outline-variant/30">
                <p className="text-xs font-semibold text-on-surface truncate">{displayName}</p>
                <p className="text-[11px] text-secondary truncate">{user?.email || "No email on file"}</p>
                {user?.role && <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-semibold">{user.role}</span>}
              </div>
              <div className="py-1 text-xs">
                <Link href="/organization" onClick={() => setProfileOpen(false)} className="block px-4 py-2 hover:bg-surface-container-low">Organization Profile</Link>
                <Link href="/team" onClick={() => setProfileOpen(false)} className="block px-4 py-2 hover:bg-surface-container-low">Team & Users</Link>
              </div>
              <div className="pt-1 border-t border-outline-variant/30 text-xs">
                <button type="button" onClick={onLogout} className="w-full text-left px-4 py-2 text-error hover:bg-error-container/20 font-medium">Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
