"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setTenantId } from "@/redux/slices/authSlice";
import { getTenantsApi } from "@/services/tenantsService";
import type { TenantOption } from "@/types/tenant";

/**
 * Header tenant chip.
 *
 * The JWT of a SUPERADMIN carries no tenant, so the chip used to read
 * "Tenant workspace" even after a tenant was chosen. This resolves the real
 * company name from the tenant directory and lets SUPERADMINs switch context
 * from anywhere (Redux `tenantId` is the single source every screen reads).
 * Tenant-scoped roles only see the read-only label.
 */
export default function TenantContextMenu() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const tenantId = useAppSelector((state) => state.auth.tenantId);
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isSuper = user?.role === "SUPERADMIN";

  useEffect(() => {
    if (!isSuper) return;
    let cancelled = false;
    getTenantsApi()
      .then((list) => {
        if (!cancelled) setTenants(list);
      })
      .catch(() => {
        /* the chip falls back to a neutral label */
      });
    return () => {
      cancelled = true;
    };
  }, [isSuper]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const activeTenant = tenants.find((tenant) => tenant.id === tenantId);
  const label = activeTenant?.companyName ?? (isSuper ? "All tenants" : "Your organization");

  const chip = (
    <>
      <span className="material-symbols-outlined text-[16px] text-primary-container">
        domain
      </span>
      <span className="font-label-md text-label-md text-on-surface hidden sm:inline max-w-[180px] truncate">
        <strong className="font-medium">Tenant:</strong> {label}
      </span>
      {isSuper && (
        <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container">
          CONTEXT ▾
        </span>
      )}
    </>
  );

  if (!isSuper) {
    return (
      <div className="flex items-center gap-space-sm px-space-md py-space-xs rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-left">
        {chip}
      </div>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Active tenant: ${label}`}
        className="flex items-center gap-space-sm px-space-md py-space-xs rounded-lg border border-outline-variant/50 bg-surface-container-lowest text-left hover:bg-surface-container-low transition-colors"
      >
        {chip}
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Active tenant context"
          className="absolute top-full left-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/60 py-2 z-50"
        >
          <div className="px-3 py-1.5 text-[11px] font-semibold text-secondary uppercase">
            Active Tenant Context
          </div>
          {tenants.length === 0 ? (
            <p className="px-3 py-2 text-xs text-secondary">Loading tenants…</p>
          ) : (
            <>
              <button
                type="button"
                role="option"
                aria-selected={!tenantId}
                onClick={() => {
                  dispatch(setTenantId(null));
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-left text-secondary hover:bg-surface-container-low"
              >
                <span>All tenants</span>
                {!tenantId && <span className="material-symbols-outlined text-[16px] text-primary">check</span>}
              </button>
              {tenants.map((tenant) => (
                <button
                  key={tenant.id}
                  type="button"
                  role="option"
                  aria-selected={tenant.id === tenantId}
                  onClick={() => {
                    dispatch(setTenantId(tenant.id));
                    setOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2 text-xs text-left text-on-surface hover:bg-surface-container-low"
                >
                  <span className="truncate">{tenant.companyName}</span>
                  {tenant.id === tenantId && (
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check</span>
                  )}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
