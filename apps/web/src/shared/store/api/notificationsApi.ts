import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost, apiPut } from "@/services/api";

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  time: string;
  read?: boolean;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
}

export interface NotificationPreferences {
  lowCreditThreshold: number;
  emailAlerts: boolean;
  approvalAlerts: boolean;
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST" | "PUT";
  body?: unknown;
  params?: Record<string, unknown>;
}

async function customBaseQuery({ url, method = "GET", body, params }: BaseQueryArgs) {
  try {
    let data: unknown;
    if (method === "POST") data = await apiPost(url, body, { params });
    else if (method === "PUT") data = await apiPut(url, body, { params });
    else data = await apiGet(url, { params });
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return { error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } } };
  }
}

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Notification", "Preferences"],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, void>({
      query: () => ({ url: "/notifications" }),
      providesTags: [{ type: "Notification", id: "LIST" }],
    }),
    markNotificationRead: builder.mutation<{ success: boolean; read: string }, string>({
      query: (id) => ({
        url: `/notifications/${encodeURIComponent(id)}/read`,
        method: "POST",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    sendTestNotification: builder.mutation<{ success: boolean; delivered: boolean }, void>({
      query: () => ({
        url: "/notifications/send-test",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Notification", id: "LIST" }],
    }),
    getPreferences: builder.query<{ success: boolean; lowCreditThreshold: number; emailAlerts: boolean; approvalAlerts: boolean }, void>({
      query: () => ({ url: "/notifications/preferences" }),
      providesTags: [{ type: "Preferences", id: "SETTINGS" }],
    }),
    updatePreferences: builder.mutation<{ success: boolean }, Partial<NotificationPreferences>>({
      query: (body) => ({
        url: "/notifications/preferences",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "Preferences", id: "SETTINGS" }],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useSendTestNotificationMutation,
  useGetPreferencesQuery,
  useUpdatePreferencesMutation,
} = notificationsApi;
