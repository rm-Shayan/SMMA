import { createApi } from "@reduxjs/toolkit/query/react";
import { apiDelete, apiGet, apiPost } from "@/services/api";

export type ConnectorType = "rest" | "sql" | "file" | "webhook" | "mcp";

export interface ConnectorDto {
  id: string;
  type: ConnectorType;
  name: string;
  write_enabled: boolean | null;
  status: string | null;
}

export interface ConnectorsResponse {
  success: boolean;
  connectors: ConnectorDto[];
}

export interface CreateConnectorPayload {
  name: string;
  type: ConnectorType;
  config: Record<string, string>;
}

export interface ConnectorActionResponse {
  success: boolean;
  error?: string;
  status?: number;
  simulated?: boolean;
  type?: string;
  connectorId?: string;
}

export interface CreateConnectorResponse {
  success: boolean;
  connector: {
    id: string;
    name: string;
    type: ConnectorType;
    config: Record<string, string>;
  };
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST" | "DELETE";
  body?: unknown;
}

async function customBaseQuery({ url, method = "GET", body }: BaseQueryArgs) {
  try {
    const data =
      method === "POST"
        ? await apiPost(url, body)
        : method === "DELETE"
          ? await apiDelete(url)
          : await apiGet(url);
    return { data };
  } catch (err) {
    const error = err as { status?: number; message?: string };
    return {
      error: {
        status: error.status ?? 0,
        data: { message: error.message ?? "Request failed" },
      },
    };
  }
}

export const connectorsApi = createApi({
  reducerPath: "connectorsApi",
  baseQuery: customBaseQuery,
  tagTypes: ["Connector"],
  endpoints: (builder) => ({
    getConnectors: builder.query<ConnectorsResponse, void>({
      query: () => ({ url: "/connectors", method: "GET" }),
      providesTags: (result) =>
        result?.connectors
          ? [
              ...result.connectors.map(({ id }) => ({ type: "Connector" as const, id })),
              { type: "Connector", id: "LIST" },
            ]
          : [{ type: "Connector", id: "LIST" }],
    }),

    createConnector: builder.mutation<CreateConnectorResponse, CreateConnectorPayload>({
      query: (body) => ({ url: "/connectors", method: "POST", body }),
      invalidatesTags: [{ type: "Connector", id: "LIST" }],
    }),

    testConnector: builder.mutation<ConnectorActionResponse, string>({
      query: (id) => ({
        url: `/connectors/${encodeURIComponent(id)}/test`,
        method: "POST",
      }),
    }),

    deleteConnector: builder.mutation<ConnectorActionResponse, string>({
      query: (id) => ({
        url: `/connectors/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Connector", id: "LIST" }],
    }),
  }),
});

export const {
  useGetConnectorsQuery,
  useCreateConnectorMutation,
  useTestConnectorMutation,
  useDeleteConnectorMutation,
} = connectorsApi;
