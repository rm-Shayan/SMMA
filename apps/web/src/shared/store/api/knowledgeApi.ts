/**
 * RTK Query Knowledge API — /api/v1/knowledge endpoints.
 *
 * Connects to the live FastAPI knowledge router (RAG documents + vector search).
 */
import { createApi } from "@reduxjs/toolkit/query/react";
import { apiGet, apiPost, apiDelete } from "@/services/api";

export interface KnowledgeDocumentDto {
  id: string;
  title: string | null;
  source: string | null;
  storage_path: string | null;
  chunk_count?: number;
}

export interface DocumentsResponse {
  success: boolean;
  documents: KnowledgeDocumentDto[];
}

export interface UploadDocumentPayload {
  title: string;
  text: string;
  source?: string;
  createSop?: boolean;
}

export interface UploadDocumentResponse {
  success: boolean;
  documentId: string;
  chunkCount: number;
  sop?: { sopId: string; modules: number };
}

export interface KnowledgeChunkDto {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
  document_title: string;
}

export interface SearchResponse {
  success: boolean;
  chunks: KnowledgeChunkDto[];
}

export interface SlidingAnalyzePayload {
  text?: string;
  documentId?: string;
  goal?: string;
  windowSize?: number;
  overlap?: number;
}

export interface SlidingAnalyzeResponse {
  success: boolean;
  windowsAnalyzed?: number;
  insights?: string[];
  rules?: string[];
  summary?: string;
  error?: string;
}

export interface SopDto {
  id: string;
  title: string;
  modules?: unknown;
  [key: string]: unknown;
}

export interface SopsResponse {
  success: boolean;
  sops: SopDto[];
}

export interface SopQuizQuestion {
  id: string | number;
  question: string;
  options?: Array<{ id: string; text: string } | string>;
  [key: string]: unknown;
}

export interface SopQuizResponse {
  success?: boolean;
  sopId?: string;
  questions?: SopQuizQuestion[];
  quiz?: { questions?: SopQuizQuestion[] } | SopQuizQuestion[];
  [key: string]: unknown;
}

export interface SubmitQuizPayload {
  sopId: string;
  answers: Record<string, unknown> | Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface SubmitQuizResponse {
  success?: boolean;
  score?: number;
  passed?: boolean;
  result?: unknown;
  [key: string]: unknown;
}

interface BaseQueryArgs {
  url: string;
  method?: "GET" | "POST" | "DELETE";
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

export const knowledgeApi = createApi({
  reducerPath: "knowledgeApi",
  baseQuery: customBaseQuery,
  tagTypes: ["KnowledgeDocument", "Sop", "Quiz"],
  endpoints: (builder) => ({
    getDocuments: builder.query<DocumentsResponse, { limit?: number } | void>({
      query: (arg) => ({
        url: "/knowledge/documents",
        method: "GET",
        params: { limit: arg?.limit ?? 50 },
      }),
      providesTags: (result) =>
        result?.documents
          ? [
              ...result.documents.map(({ id }) => ({ type: "KnowledgeDocument" as const, id })),
              { type: "KnowledgeDocument", id: "LIST" },
            ]
          : [{ type: "KnowledgeDocument", id: "LIST" }],
    }),

    getDocument: builder.query<
      { success: boolean; document: KnowledgeDocumentDto & { chunks: number } },
      string
    >({
      query: (id) => ({
        url: `/knowledge/documents/${encodeURIComponent(id)}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "KnowledgeDocument", id }],
    }),

    uploadDocument: builder.mutation<UploadDocumentResponse, UploadDocumentPayload>({
      query: (body) => ({
        url: "/knowledge/documents",
        method: "POST",
        body: { ...body, source: body.source ?? "upload" },
      }),
      invalidatesTags: [{ type: "KnowledgeDocument", id: "LIST" }],
    }),

    analyzeSliding: builder.mutation<SlidingAnalyzeResponse, SlidingAnalyzePayload>({
      query: (body) => ({
        url: "/knowledge/analyze-sliding",
        method: "POST",
        body,
      }),
    }),

    deleteDocument: builder.mutation<{ success: boolean; documentId: string }, string>({
      query: (id) => ({
        url: `/knowledge/documents/${encodeURIComponent(id)}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "KnowledgeDocument", id: "LIST" }],
    }),

    searchKnowledge: builder.mutation<SearchResponse, { query: string; limit?: number }>({
      query: (body) => ({
        url: "/knowledge/search",
        method: "POST",
        body: { query: body.query, limit: body.limit ?? 5 },
      }),
    }),

    getSops: builder.query<SopsResponse, void>({
      query: () => ({
        url: "/knowledge/sops",
        method: "GET",
      }),
      providesTags: (result) =>
        result?.sops
          ? [
              ...result.sops.map(({ id }) => ({ type: "Sop" as const, id })),
              { type: "Sop", id: "LIST" },
            ]
          : [{ type: "Sop", id: "LIST" }],
    }),

    getQuiz: builder.query<SopQuizResponse, string>({
      query: (id) => ({
        url: `/knowledge/sops/${encodeURIComponent(id)}/quiz`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [{ type: "Quiz", id }],
    }),

    submitQuiz: builder.mutation<SubmitQuizResponse, SubmitQuizPayload>({
      query: ({ sopId, ...body }) => ({
        url: `/knowledge/sops/${encodeURIComponent(sopId)}/quiz/submit`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_res, _err, { sopId }) => [
        { type: "Quiz", id: sopId },
        { type: "Sop", id: sopId },
        { type: "Sop", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useUploadDocumentMutation,
  useDeleteDocumentMutation,
  useSearchKnowledgeMutation,
  useAnalyzeSlidingMutation,
  useGetSopsQuery,
  useGetQuizQuery,
  useLazyGetQuizQuery,
  useSubmitQuizMutation,
} = knowledgeApi;
