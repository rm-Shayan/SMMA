import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPatch, apiPost, apiPut, apiDelete } from "@/services/api";

export interface CompanyProfileDto {
  id: string;
  name: string;
  tier?: string;
  is_active?: boolean;
}

export interface BrandKitDto {
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  emailSignature: string;
}

export interface ApiKeyDto {
  id: string;
  name: string;
  prefix: string;
  created_at: string;
  last_used_at?: string | null;
}

export interface CompanyMemberDto {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  status?: string;
  created_at?: string;
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, method = "GET", body, params }: BaseQueryArgs) {
  try {
    let data: unknown;
    if (method === "POST") data = await apiPost(url, body, { params });
    else if (method === "PATCH") data = await apiPatch(url, body, { params });
    else if (method === "PUT") data = await apiPut(url, body, { params });
    else if (method === "DELETE") data = await apiDelete(url, { params });
    else data = await apiGet(url, { params });
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return { error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } } };
  }
}

export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: customBaseQuery,
  tagTypes: ["CompanyProfile", "BrandKit", "Quotas", "ApiKeys", "Members"],
  endpoints: (builder) => ({
    getCompanyProfile: builder.query<{ success: boolean; profile: CompanyProfileDto }, void>({
      query: () => ({ url: "/company/profile", method: "GET" }),
      providesTags: [{ type: "CompanyProfile", id: "PROFILE" }],
    }),

    updateCompanyProfile: builder.mutation<{ success: boolean; updated: unknown }, Partial<CompanyProfileDto>>({
      query: (body) => ({
        url: "/company/profile",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "CompanyProfile", id: "PROFILE" }],
    }),

    getBranding: builder.query<{ success: boolean; brandKit: BrandKitDto }, void>({
      query: () => ({ url: "/company/profile/branding", method: "GET" }),
      providesTags: [{ type: "BrandKit", id: "BRAND" }],
    }),

    updateBranding: builder.mutation<{ success: boolean; brandKit: BrandKitDto }, Partial<BrandKitDto>>({
      query: (body) => ({
        url: "/company/profile/branding",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "BrandKit", id: "BRAND" }],
    }),

    getCompanyQuotas: builder.query<unknown, void>({
      query: () => ({ url: "/company/quotas", method: "GET" }),
      providesTags: [{ type: "Quotas", id: "QUOTAS" }],
    }),

    getCompanyMembers: builder.query<{ success: boolean; members: CompanyMemberDto[] }, void>({
      query: () => ({ url: "/company/members", method: "GET" }),
      providesTags: [{ type: "Members", id: "LIST" }],
    }),

    getApiKeys: builder.query<{ success: boolean; apiKeys: ApiKeyDto[] }, void>({
      query: () => ({ url: "/company/api-keys", method: "GET" }),
      providesTags: [{ type: "ApiKeys", id: "LIST" }],
    }),

    createApiKey: builder.mutation<{ success: boolean; apiKey: string; id: string }, { name: string }>({
      query: (body) => ({
        url: "/company/api-keys",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "ApiKeys", id: "LIST" }],
    }),

    deleteApiKey: builder.mutation<{ success: boolean; id: string }, string>({
      query: (id) => ({
        url: `/company/api-keys/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "ApiKeys", id: "LIST" }],
    }),
  }),
});

export const {
  useGetCompanyProfileQuery,
  useUpdateCompanyProfileMutation,
  useGetBrandingQuery,
  useUpdateBrandingMutation,
  useGetCompanyQuotasQuery,
  useGetCompanyMembersQuery,
  useGetApiKeysQuery,
  useCreateApiKeyMutation,
  useDeleteApiKeyMutation,
} = companyApi;
