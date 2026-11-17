"use client";

import { useState, useEffect, useCallback } from "react";
import { knowledgeApi } from "../api/knowledge.api";
import type { KnowledgeDoc } from "../types";
import { useWebSocket } from "@/shared/hooks/useWebSocket";

export function useKnowledgeDocs() {
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchDocs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await knowledgeApi.getDocuments();
      setDocs(data);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  useWebSocket("knowledge", () => {
    fetchDocs();
  });

  return { docs, isLoading, refetch: fetchDocs };
}
