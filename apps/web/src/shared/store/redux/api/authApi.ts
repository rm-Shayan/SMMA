import { createApi } from "@reduxjs/toolkit/query/react";
import type { AppDispatch } from "@/redux/store";
import { setCredentials } from "@/redux/slices/authSlice";
import { apiGet, apiPost, setSession } from "@/services/api";
import {
  normalizeAuthUser,
  type InviteInfo,
  type InvitePayload,
} from "@/services/authService";
import type { RawAuthUser } from "@/types/auth";

interface AuthBaseQueryArgs {
  url: string;
  method?: "GET" | "POST";
  body?: unknown;
  /** Skip attaching/redirecting auth (login/signup/invite public endpoints). */
  skipAuthRedirect?: boolean;
}

async function authBaseQuery({ url, method = "GET", body, skipAuthRedirect }: AuthBaseQueryArgs) {
  try {
    const data =
      method === "POST"
        ? await apiPost<unknown>(url, body, { skipAuthRedirect })
        : await apiGet<unknown>(url, { skipAuthRedirect });
    return { data };
  } catch (err) {
    const e = err as { status?: number; message?: string };
    return {
      error: { status: e.status ?? 0, data: { message: e.message ?? "Request failed" } },
    };
  }
}

interface AuthSuccessResponse {
  success: boolean;
  token: string;
  user: RawAuthUser;
}

/** Persists session + redux auth state after login/signup. */
function establishSession(response: unknown, dispatch: AppDispatch): void {
  const res = response as AuthSuccessResponse;
  if (!res?.token || !res?.user) return;
  const user = normalizeAuthUser(res.user);
  setSession(res.token, { ...user, tenantId: user.tenantId });
  dispatch(setCredentials({ user, token: res.token, tenantId: user.tenantId }));
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: authBaseQuery,
  tagTypes: ["Invite"],
  endpoints: (builder) => ({
    login: builder.mutation<{ success: boolean }, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body, skipAuthRedirect: true }),
      onQueryStarted: async (_arg, { queryFulfilled, dispatch }) => {
        try {
          const { data } = await queryFulfilled;
          establishSession(data, dispatch);
        } catch {
          /* error surfaced via hook */
        }
      },
    }),

    signup: builder.mutation<
      { success: boolean },
      { name: string; email: string; password: string; companyName: string }
    >({
      query: (body) => ({ url: "/auth/signup", method: "POST", body, skipAuthRedirect: true }),
      onQueryStarted: async (_arg, { queryFulfilled, dispatch }) => {
        try {
          const { data } = await queryFulfilled;
          establishSession(data, dispatch);
        } catch {
          /* error surfaced via hook */
        }
      },
    }),

    getInvite: builder.query<{ success: boolean; invite: InviteInfo }, string>({
      query: (token) => ({
        url: `/auth/invites/${encodeURIComponent(token)}`,
        skipAuthRedirect: true,
      }),
      providesTags: (_result, _err, token) => [{ type: "Invite", id: token }],
    }),

    /** Company admin / manager invites a member (Team page). */
    createInvite: builder.mutation<{ success: boolean; invite: InviteInfo }, InvitePayload>({
      query: (body) => ({ url: "/auth/invites", method: "POST", body }),
      invalidatesTags: [{ type: "Invite" }],
    }),

    acceptInvite: builder.mutation<
      { success: boolean; user: RawAuthUser },
      { token: string; name: string; password: string }
    >({
      query: ({ token, ...body }) => ({
        url: `/auth/invites/${encodeURIComponent(token)}/accept`,
        method: "POST",
        body,
        skipAuthRedirect: true,
      }),
    }),

    forgotPassword: builder.mutation<
      { success: boolean; message?: string; resetUrl?: string },
      { email: string }
    >({
      query: (body) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body,
        skipAuthRedirect: true,
      }),
    }),

    resetPassword: builder.mutation<{ success: boolean }, { token: string; password: string }>({
      query: (body) => ({
        url: "/auth/reset-password",
        method: "POST",
        body,
        skipAuthRedirect: true,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetInviteQuery,
  useCreateInviteMutation,
  useAcceptInviteMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;
