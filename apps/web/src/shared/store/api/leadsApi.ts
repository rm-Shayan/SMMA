/**
 * RTK Query Leads & Contacts API — /api/v1/contacts endpoints.
 *
 * Connects to live FastAPI backend contacts router.
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/services/api";

export interface ContactDto {
  id: string;
  company_id?: string;
  name: string;
  email: string;
  company_name?: string | null;
  topic?: string | null;
  unsubscribed?: boolean;
  created_at?: string;
}

export interface ContactsResponse {
  success: boolean;
  total: number;
  contacts: ContactDto[];
}

export interface CreateContactPayload {
  name: string;
  email: string;
  company_name?: string;
  topic?: string;
}

export interface UpdateContactPayload {
  id: string;
  name?: string;
  company_name?: string;
  topic?: string;
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
    switch (method) {
      case "POST":
        data = await apiPost(url, body, { params });
        break;
      case "PATCH":
        data = await apiPatch(url, body, { params });
        break;
      case "DELETE":
        data = await apiDelete(url, { params });
        break;
      case "GET":
      default:
        data = await apiGet(url, { params });
        break;
    }
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } },
    };
  }
}

export const leadsApi = createApi({
  reducerPath: "leadsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Contact"],
  endpoints: (builder) => ({
    getContacts: builder.query<ContactsResponse, { limit?: number; offset?: number } | void>({
      query: (arg) => ({
        url: "/contacts",
        method: "GET",
        params: { limit: arg?.limit ?? 50, offset: arg?.offset ?? 0 },
      }),
      providesTags: (result) =>
        result?.contacts
          ? [
              ...result.contacts.map(({ id }) => ({ type: "Contact" as const, id })),
              { type: "Contact", id: "LIST" },
            ]
          : [{ type: "Contact", id: "LIST" }],
    }),

    getContact: builder.query<{ success: boolean; contact: ContactDto }, string>({
      query: (id) => ({
        url: `/contacts/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Contact", id }],
    }),

    createContact: builder.mutation<{ success: boolean; contact: ContactDto }, CreateContactPayload>({
      query: (body) => ({
        url: "/contacts",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),

    importContacts: builder.mutation<{ success: boolean; imported: number; invalid: number }, { csv: string }>({
      query: (body) => ({
        url: "/campaigns/import",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),

    updateContact: builder.mutation<{ success: boolean; contactId: string }, UpdateContactPayload>({
      query: ({ id, ...body }) => ({
        url: `/contacts/${encodeURIComponent(id)}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_res, _err, { id }) => [{ type: "Contact", id }, { type: "Contact", id: "LIST" }],
    }),

    deleteContact: builder.mutation<{ success: boolean; contactId: string }, string>({
      query: (id) => ({
        url: `/contacts/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Contact", id: "LIST" }],
    }),
  }),
});

export const {
  useGetContactsQuery,
  useGetContactQuery,
  useCreateContactMutation,
  useImportContactsMutation,
  useUpdateContactMutation,
  useDeleteContactMutation,
} = leadsApi;
