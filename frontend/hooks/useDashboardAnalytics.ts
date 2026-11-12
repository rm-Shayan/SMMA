"use client";

import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setTenantId } from "@/redux/slices/authSlice";
import { ApiError } from "@/services/api";
import { getAnalyticsApi } from "@/services/analyticsService";
import { getActiveTenantId } from "@/services/session";
import { getTenantsApi } from "@/services/tenantsService";
import type { Analytics } from "@/types/analytics";
import type { TenantOption } from "@/types/tenant";

export type DashboardDataState = "loading" | "live" | "empty" | "error" | "no-tenant";

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  return new ApiError(0, error instanceof Error ? error.message : "Unable to load analytics.");
}

function hasNoActivity(analytics: Analytics): boolean {
  return (
    analytics.totalLeads === 0 &&
    analytics.totalConversations === 0 &&
    analytics.totalScheduledPosts === 0 &&
    analytics.publishedPosts === 0 &&
    Object.keys(analytics.platformBreakdown).length === 0
  );
}

/**
 * Dashboard data wiring.
 *
 * SUPERADMIN tokens carry no tenant, so `/analytics` answers `403 Tenant context
 * required` until a tenant is chosen. This hook loads the tenant directory,
 * restores the stored selection (or defaults to the newest tenant), and only then
 * requests `/analytics/:tenantId`. Other roles stay scoped by their JWT.
 */
export function useDashboardAnalytics() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const tenantId = useAppSelector((state) => state.auth.tenantId);
  const isSuper = user?.role === "SUPERADMIN";

  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [tenantsLoaded, setTenantsLoaded] = useState(false);
  const [tenantsError, setTenantsError] = useState<ApiError | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [dataState, setDataState] = useState<DashboardDataState>("loading");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const targetTenantId = isSuper ? tenantId ?? undefined : undefined;

  // 1) Tenant directory (SUPERADMIN only).
  useEffect(() => {
    if (!isSuper) {
      setTenants([]);
      setTenantsError(null);
      setTenantsLoaded(true);
      return;
    }

    let cancelled = false;
    setTenantsLoaded(false);
    setTenantsError(null);

    (async () => {
      try {
        const list = await getTenantsApi();
        if (!cancelled) setTenants(list);
      } catch (err) {
        if (!cancelled) setTenantsError(toApiError(err));
      } finally {
        if (!cancelled) setTenantsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSuper, reloadKey]);

  // 2) Resolve the active tenant: stored selection, else the newest tenant.
  useEffect(() => {
    if (!isSuper || !tenantsLoaded || tenants.length === 0) return;
    if (tenantId && tenants.some((tenant) => tenant.id === tenantId)) return;

    const stored = getActiveTenantId();
    const preferred = tenants.find((tenant) => tenant.id === stored) ?? tenants[0];
    dispatch(setTenantId(preferred.id));
  }, [isSuper, tenantsLoaded, tenants, tenantId, dispatch]);

  // 3) Analytics for the resolved tenant.
  useEffect(() => {
    if (!user) {
      setDataState("loading");
      return;
    }
    if (!tenantsLoaded) return;

    if (isSuper && tenantsError) {
      setError(tenantsError);
      setDataState("error");
      return;
    }

    if (isSuper && !targetTenantId) {
      setAnalytics(null);
      setError(null);
      setDataState(tenants.length === 0 ? "no-tenant" : "loading");
      return;
    }

    let cancelled = false;
    setDataState("loading");
    setError(null);

    (async () => {
      try {
        const data = await getAnalyticsApi(targetTenantId);
        if (cancelled) return;
        setAnalytics(data);
        setUpdatedAt(new Date());
        setDataState(hasNoActivity(data) ? "empty" : "live");
      } catch (err) {
        if (cancelled) return;
        setError(toApiError(err));
        setDataState("error");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, tenantsLoaded, isSuper, targetTenantId, tenantsError, tenants.length, reloadKey]);

  return {
    analytics,
    error,
    dataState,
    tenants,
    selectedTenantId: tenantId,
    selectTenant: (id: string) => dispatch(setTenantId(id)),
    retry: () => setReloadKey((key) => key + 1),
    updatedAt,
  };
}
