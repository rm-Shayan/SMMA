"use client";

import { useState } from "react";
import { knowledgeApi } from "../api/knowledge.api";
import toast from "react-hot-toast";

export function useSlidingAnalyze() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeDoc = async (docId: string, windowSize: number = 500) => {
    setIsAnalyzing(true);
    try {
      const res = await knowledgeApi.analyzeSlidingWindow(docId, windowSize);
      toast.success("Sliding-window RAG analysis completed!");
      return res;
    } catch {
      toast.error("RAG analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { isAnalyzing, analyzeDoc };
}
