/**
 * RTK Query Team/Users API — users, teams, employee tasks, and member access.
 *
 * Used by campaigns and the Team/Workforce/Workspace pages.
 *
 * Contract:
 *  - GET  /users                                  -> { success, users: UserRow[] }
 *  - GET  /teams                                  -> { success, teams: TeamRow[] }
 *  - GET  /employee/tasks                         -> { success, tasks: EmployeeTask[] }
 *  - GET  /manager/team/members/{id}/access       -> { success, access: [{agent_id, name, mode}] }
 *  - POST /users/{id}/agent-access {agentId,mode} -> { success, userId, agentId, mode }
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost } from "@/services/api";

export interface UserRow {
  id: string;
  company_id?: string | null;
  email: string;
  name?: string | null;
  role: string;
  status?: string | null;
  created_at?: string;
}

export interface UsersResponse {
  success: boolean;
  users: UserRow[];
}

export interface TeamRow {
  id: string;
  company_id: string;
  manager_id?: string | null;
  name: string;
}

export interface TeamsResponse {
  success: boolean;
  teams: TeamRow[];
}

export interface EmployeeTask {
  id: string;
  request?: string | null;
  status?: string | null;
  credit_budget?: number | null;
  created_at?: string | null;
}

export interface EmployeeTasksResponse {
  success: boolean;
  tasks: EmployeeTask[];
}

export interface MemberAccessRow {
  agent_id: number;
  name: string;
  mode: "draft" | "auto" | string;
}

export interface MemberAccessResponse {
  success: boolean;
  access: MemberAccessRow[];
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

/** Outreach agent id — direct-send permission is granted for this agent. */
export const OUTREACH_AGENT_ID = 6;

export const teamApi = createApi({
  reducerPath: "teamApi",
  baseQuery: customBaseQuery,
  tagTypes: ["User", "Team", "EmployeeTask", "MemberAccess"],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse, void>({
      query: () => ({ url: "/users", method: "GET" }),
      providesTags: (result) =>
        result?.users
          ? [
              ...result.users.map(({ id }) => ({ type: "User" as const, id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

    getTeams: builder.query<TeamsResponse, void>({
      query: () => ({ url: "/teams", method: "GET" }),
      providesTags: (result) =>
        result?.teams
          ? [
              ...result.teams.map(({ id }) => ({ type: "Team" as const, id })),
              { type: "Team", id: "LIST" },
            ]
          : [{ type: "Team", id: "LIST" }],
    }),

    getEmployeeTasks: builder.query<EmployeeTasksResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/employee/tasks",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: (result) =>
        result?.tasks
          ? [
              ...result.tasks.map(({ id }) => ({ type: "EmployeeTask" as const, id })),
              { type: "EmployeeTask", id: "LIST" },
            ]
          : [{ type: "EmployeeTask", id: "LIST" }],
    }),

    getMemberAccess: builder.query<MemberAccessResponse, string>({
      query: (userId) => ({
        url: `/manager/team/members/${encodeURIComponent(userId)}/access`,
        method: "GET",
      }),
      providesTags: (_res, _err, userId) => [{ type: "MemberAccess", id: userId }],
    }),

    /** Grant/revoke direct-send: mode "auto" = direct send, "draft" = signoff. */
    setUserAgentAccess: builder.mutation<
      { success: boolean; userId: string; agentId: number; mode: string },
      { userId: string; agentId?: number; mode: "auto" | "draft" }
    >({
      query: ({ userId, agentId = OUTREACH_AGENT_ID, mode }) => ({
        url: `/users/${encodeURIComponent(userId)}/agent-access`,
        method: "POST",
        body: { agentId, mode },
      }),
      invalidatesTags: (_res, _err, { userId }) => [
        { type: "MemberAccess", id: userId },
        { type: "User", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetTeamsQuery,
  useGetEmployeeTasksQuery,
  useGetMemberAccessQuery,
  useSetUserAgentAccessMutation,
} = teamApi;
