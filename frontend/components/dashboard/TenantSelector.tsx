"use client";

import type { TenantOption } from "@/types/tenant";

interface TenantSelectorProps {
  tenants: TenantOption[];
  value: string | null;
  onChange: (tenantId: string) => void;
}

/** SUPERADMIN tenant context picker — feeds `x-tenant-id` and `/analytics/:tenantId`. */
export default function TenantSelector({ tenants, value, onChange }: TenantSelectorProps) {
  if (tenants.length === 0) return null;

  return (
    <label className="flex items-center gap-2 bg-surface-container-low px-space-sm py-1.5 rounded-xl border border-outline-variant/30">
      <span className="material-symbols-outlined text-[16px] text-secondary">business</span>
      <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider text-[10px]">
        Tenant
      </span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Active tenant"
        className="bg-transparent font-label-md text-label-md text-on-surface outline-none max-w-[180px] cursor-pointer"
      >
        {!value && (
          <option value="" disabled>
            Select tenant…
          </option>
        )}
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.companyName}
          </option>
        ))}
      </select>
    </label>
  );
}
