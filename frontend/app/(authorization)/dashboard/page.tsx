"use client";

import AppShell from "@/components/AppShell";
import { useAppSelector } from "@/redux/hooks";
import { useDashboardAnalytics } from "@/hooks/useDashboardAnalytics";
import DashboardKpis from "@/components/dashboard/DashboardKpis";
import PlatformBreakdown from "@/components/dashboard/PlatformBreakdown";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import DashboardEmptyState from "@/components/dashboard/DashboardEmptyState";
import DashboardErrorState from "@/components/dashboard/DashboardErrorState";
import DashboardNoTenantState from "@/components/dashboard/DashboardNoTenantState";
import TenantSelector from "@/components/dashboard/TenantSelector";

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const {
    analytics,
    error,
    dataState,
    tenants,
    selectedTenantId,
    selectTenant,
    retry,
    updatedAt,
  } = useDashboardAnalytics();

  const firstName =
    user?.name?.trim().split(/\s+/)[0] || user?.email?.split("@")[0] || "there";
  const isSuper = user?.role === "SUPERADMIN";
  const isLoading = dataState === "loading";

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-outline-variant/30 mb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1 flex-wrap">
              <h1 className="font-headline-xl text-headline-xl text-on-surface">
                Welcome back, {firstName}
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-caption font-caption bg-surface-container-high text-primary-container font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                Live analytics
              </span>
            </div>
            <p className="font-body-md text-body-md text-secondary">
              Multi-tenant autonomous agency operations and active tenant deployment overview.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {isSuper && tenants.length > 0 && (
              <TenantSelector
                tenants={tenants}
                value={selectedTenantId}
                onChange={selectTenant}
              />
            )}
            <button
              type="button"
              onClick={retry}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-outline-variant/50 bg-surface-container-lowest text-xs font-semibold text-secondary hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              title="Refresh analytics"
            >
              <span
                className={`material-symbols-outlined text-[16px] ${isLoading ? "animate-spin" : ""}`}
              >
                refresh
              </span>
              <span>{isLoading ? "Refreshing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {(dataState === "live" || dataState === "empty") && analytics && (
          <div className="flex flex-col gap-6">
            <DashboardKpis analytics={analytics} />
            {dataState === "empty" ? (
              <DashboardEmptyState />
            ) : (
              <PlatformBreakdown
                breakdown={analytics.platformBreakdown}
                totalConversations={analytics.totalConversations}
              />
            )}
            {updatedAt && (
              <p className="text-caption font-caption text-secondary">
                Last updated {updatedAt.toLocaleTimeString()} · Tenant{" "}
                <span className="font-mono text-[11px]">{analytics.tenantId}</span>
              </p>
            )}
          </div>
        )}

        {dataState === "loading" && <DashboardSkeleton />}
        {dataState === "no-tenant" && <DashboardNoTenantState onRetry={retry} />}
        {dataState === "error" && error && (
          <DashboardErrorState error={error} onRetry={retry} />
        )}
      </div>
    </AppShell>
  );
}