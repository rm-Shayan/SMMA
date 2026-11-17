"use client";

import { useSSE } from "@/shared/hooks/useSSE";

export function useAgentStream(agentId: string) {
  const sse = useSSE();

  const streamAgentExecution = (prompt?: string) => {
    const streamUrl = `/api/v1/agents/${agentId}/stream`;
    return sse.startStream(streamUrl, prompt ? { prompt } : undefined);
  };

  return {
    streamText: sse.data,
    isStreaming: sse.isStreaming,
    error: sse.error,
    streamAgentExecution,
    stopStreaming: sse.stopStream,
  };
}
