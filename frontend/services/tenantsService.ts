/**
 * Tenant directory calls.
 * Contract: docs/07-api-integration.md §4 (row 5).
 *
 * SUPERADMIN receives every tenant; other roles receive only their own, so this
 * is only used to resolve a tenant context for SUPERADMIN screens.
 */
import { apiGet } from "@/services/api";
import type { TenantOption } from "@/types/tenant";

interface TenantDto {
  id: string;
  company_name?: string;
  niche?: string | null;
}

interface TenantsResponse {
  success: boolean;
  count: number;
  tenants: TenantDto[];
}

export async function getTenantsApi(): Promise<TenantOption[]> {
  const res = await apiGet<TenantsResponse>("/tenants");
  return (res.tenants ?? []).map((tenant) => ({
    id: tenant.id,
    companyName: tenant.company_name?.trim() || tenant.id.slice(0, 8),
  }));
}
