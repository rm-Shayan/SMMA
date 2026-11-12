/**
 * Tenant directory and settings calls.
 * Contract: docs/07-api-integration.md §4
 */
import { apiGet, apiPatch } from "@/services/api";
import type { TenantOption } from "@/types/tenant";

export interface TenantDetailsDto {
  id: string;
  company_name?: string;
  brand_voice?: string;
  niche?: string | null;
  target_audience?: string;
  competitor_handles?: string[];
  autonomous_mode_enabled?: boolean;
  google_sheet_id?: string;
  booking_calendar_url?: string;
  notification_email?: string;
  is_active?: boolean;
  created_at?: string;
}

interface TenantsResponse {
  success: boolean;
  count: number;
  tenants: TenantDetailsDto[];
}

export async function getTenantsApi(): Promise<TenantOption[]> {
  const res = await apiGet<TenantsResponse>("/tenants");
  return (res.tenants ?? []).map((tenant) => ({
    id: tenant.id,
    companyName: tenant.company_name?.trim() || tenant.id.slice(0, 8),
  }));
}

export async function listAllTenantsDetailsApi(): Promise<TenantDetailsDto[]> {
  const res = await apiGet<TenantsResponse>("/tenants");
  return res.tenants ?? [];
}

export async function getTenantDetailsApi(tenantId?: string): Promise<TenantDetailsDto | null> {
  const path = tenantId ? `/tenants/${tenantId}` : "/tenants/current";
  const res = await apiGet<{ success: boolean; tenant: TenantDetailsDto }>(path);
  return res.tenant || null;
}

export async function updateTenantApi(
  tenantId: string,
  payload: Partial<TenantDetailsDto>
): Promise<TenantDetailsDto> {
  const res = await apiPatch<{ success: boolean; tenant: TenantDetailsDto }>(`/tenants/${tenantId}`, payload);
  return res.tenant;
}
