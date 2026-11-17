/**
 * RTK Query Admin API — /api/v1/admin endpoints (Super Admin only).
 *
 * Multi-tenant director console: company registry, global credit rates and the
 * platform-wide credit ledger.
 *
 * Contract:
 *  - GET  /admin/companies                -> { success, companies: CompanyDto[] }
 *  - POST /admin/companies {name,timezone}-> { success, company: CompanyDto }
 *  - GET  /admin/credits/rates            -> { success, actionRates: Record<string, number> }
 *  - POST /admin/credits/rates {rates}    -> { success, updatedRates: Record<string, number> }
 *  - GET  /admin/credits/overview         -> { success, totalMinted, totalReserved, totalTransactions }
 *  - GET  /admin/credits/ledger           -> { success, transactions: AdminLedgerEntry[] }
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface CompanyDto {
  id: string;
  name: string;
  timezone?: string | null;
  status?: string | null;
  created_at?: string | null;
}

export interface CompaniesResponse {
  success: boolean;
  companies: CompanyDto[];
}

export interface CreateCompanyPayload {
  name: string;
  timezone?: string;
}

export interface CompanyResponse {
  success: boolean;
  company: CompanyDto;
}

export interface ActionRatesResponse {
  success: boolean;
  actionRates: Record<string, number>;
}

export interface UpdateRatesResponse {
  success: boolean;
  updatedRates: Record<string, number>;
}

export interface CreditsOverviewResponse {
  success: boolean;
  totalMinted: number;
  totalReserved: number;
  totalTransactions: number;
}

export interface AdminLedgerEntry {
  id: string;
  wallet_id: string;
  counter_wallet_id?: string | null;
  company_id?: string | null;
  type: string;
  amount: number;
  created_by?: string | null;
  note?: string | null;
  created_at?: string | null;
}

export interface AdminLedgerResponse {
  success: boolean;
  transactions: AdminLedgerEntry[];
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, method = "GET", body, params }: BaseQueryArgs) {
  try {
    const data =
      method === "POST"
        ? await apiPost(url, body, { params })
        : await apiGet(url, { params });
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } },
    };
  }
}

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Company", "Rates", "CreditsOverview", "AdminLedger"],
  endpoints: (builder) => ({
    getCompanies: builder.query<CompaniesResponse, void>({
      query: () => ({ url: "/admin/companies", method: "GET" }),
      providesTags: (result) =>
        result?.companies
          ? [
              ...result.companies.map(({ id }) => ({ type: "Company" as const, id })),
              { type: "Company", id: "LIST" },
            ]
          : [{ type: "Company", id: "LIST" }],
    }),

    createCompany: builder.mutation<CompanyResponse, CreateCompanyPayload>({
      query: (body) => ({ url: "/admin/companies", method: "POST", body }),
      invalidatesTags: [{ type: "Company", id: "LIST" }, "CreditsOverview"],
    }),

    getRates: builder.query<ActionRatesResponse, void>({
      query: () => ({ url: "/admin/credits/rates", method: "GET" }),
      providesTags: ["Rates"],
    }),

    updateRates: builder.mutation<UpdateRatesResponse, { rates: Record<string, number> }>({
      query: (body) => ({ url: "/admin/credits/rates", method: "POST", body }),
      invalidatesTags: ["Rates"],
    }),

    getCreditsOverview: builder.query<CreditsOverviewResponse, void>({
      query: () => ({ url: "/admin/credits/overview", method: "GET" }),
      providesTags: ["CreditsOverview"],
    }),

    getAdminLedger: builder.query<AdminLedgerResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/admin/credits/ledger",
        method: "GET",
        params: { limit: arg?.limit ?? 100 },
      }),
      providesTags: (result) =>
        result?.transactions
          ? [
              ...result.transactions.map(({ id }) => ({ type: "AdminLedger" as const, id })),
              { type: "AdminLedger", id: "LIST" },
            ]
          : [{ type: "AdminLedger", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCompaniesQuery,
  useCreateCompanyMutation,
  useGetRatesQuery,
  useUpdateRatesMutation,
  useGetCreditsOverviewQuery,
  useGetAdminLedgerQuery,
} = adminApi;
