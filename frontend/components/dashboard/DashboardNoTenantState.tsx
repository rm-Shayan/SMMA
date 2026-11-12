"use client";

import Link from "next/link";

/** SUPERADMIN has no tenant to scope analytics to — nothing to fetch yet. */
export default function DashboardNoTenantState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xs p-8 md:p-12 max-w-xl mx-auto my-12 text-center border border-outline-variant/40">
      <div className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-primary-container mx-auto mb-space-md">
        <span className="material-symbols-outlined text-[28px]">domain_disabled</span>
      </div>
      <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
        No tenant context available
      </h2>
      <p className="mt-2 font-body-md text-body-md text-secondary">
        Analytics are tenant-scoped. Provision a tenant (or select one once it exists) to load
        dashboard metrics.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-on-primary font-label-md text-label-md font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">business</span>
          Open Tenant Directory
        </Link>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-medium"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Refresh
        </button>
      </div>
    </div>
  );
}
