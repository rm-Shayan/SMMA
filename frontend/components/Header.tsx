"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { logout as logoutAction } from "@/redux/slices/authSlice";
import { logoutApi } from "@/services/authService";
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
  const isOwnerOrSuper = user?.role === "SUPERADMIN" || user?.role === "CLIENT_OWNER";

  const onLogout = async () => {
    setProfileOpen(false);
    try {
      await logoutApi();
    } catch {
      /* best-effort revoke */
    }
    dispatch(logoutAction());
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 md:left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40 z-40 px-4 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onToggleMobileMenu} className="md:hidden p-2 rounded-xl text-secondary hover:bg-surface-container" aria-label="Toggle Menu">
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>
        <TenantContextMenu />
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Approvals Gateway Icon for Owners */}
        {isOwnerOrSuper && (
          <Link
            href="/approvals"
            className="p-2 rounded-xl text-secondary hover:text-indigo-600 hover:bg-surface-container transition-colors relative flex items-center justify-center"
            title="Human Action Approvals Gate"
          >
            <span className="material-symbols-outlined text-[20px]">verified_user</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500"></span>
          </Link>
        )}

        {/* Quick External Tools Gateway */}
        {isOwnerOrSuper && (
          <Link
            href="/tools"
            className="p-2 rounded-xl text-secondary hover:text-indigo-600 hover:bg-surface-container transition-colors flex items-center justify-center"
            title="External OpenAPI Integrations"
          >
            <span className="material-symbols-outlined text-[20px]">extension</span>
          </Link>
        )}

        {/* Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 pl-3 border-l border-outline-variant/40 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              {roleInitials(displayName)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-on-surface leading-tight truncate max-w-[140px]">{displayName}</span>
              <span className="text-[10px] text-secondary leading-tight">{displayRole} ▾</span>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/50 py-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-outline-variant/30">
                <p className="text-xs font-bold text-on-surface truncate">{displayName}</p>
                <p className="text-[11px] text-secondary truncate">{user?.email || "No email"}</p>
                {user?.role && (
                  <span className="inline-block mt-1.5 text-[9px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                )}
              </div>

              <div className="py-1 text-xs">
                {isOwnerOrSuper && (
                  <>
                    <Link
                      href="/approvals"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">verified_user</span>
                      <span>Action Approvals</span>
                    </Link>
                    <Link
                      href="/organization"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                      <span>Organization Settings</span>
                    </Link>
                  </>
                )}
                <Link
                  href="/change-password"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">lock_reset</span>
                  <span>Change Password</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-outline-variant/30">
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-error hover:bg-error-container/20 transition-colors text-left cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">logout</span>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
