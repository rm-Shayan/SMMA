import { httpClient } from "@/shared/http/client";
import type { KnowledgeDoc, DocumentChunk } from "../types";

export const knowledgeApi = {
  getDocuments: async (): Promise<KnowledgeDoc[]> => {
    const res = await httpClient.get("/knowledge/documents");
    return res.data;
  },

  getChunks: async (docId: string): Promise<DocumentChunk[]> => {
    const res = await httpClient.get(`/knowledge/documents/${docId}/chunks`);
    return res.data;
  },

  uploadDocument: async (formData: FormData): Promise<KnowledgeDoc> => {
    const res = await httpClient.post("/knowledge/documents/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  analyzeSlidingWindow: async (docId: string, windowSize: number = 500) => {
    const res = await httpClient.post(`/knowledge/documents/${docId}/sliding-analyze`, {
      window_size: windowSize,
    });
    return res.data;
  },
};
