"use client";

import { useState, useCallback } from "react";
import { agentsApi } from "../api/agents.api";
import type { AgentRun } from "../types";
import toast from "react-hot-toast";

export function useAgentRun(agentId?: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastRun, setLastRun] = useState<AgentRun | null>(null);

  const triggerRun = useCallback(
    async (targetId?: string, payload?: Record<string, unknown>) => {
      const id = targetId || agentId;
      if (!id) return;

      setIsRunning(true);
      try {
        const run = await agentsApi.triggerAgentRun(id, payload);
        setLastRun(run);
        toast.success("Agent execution dispatched successfully!");
        return run;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Agent execution failed";
        toast.error(msg);
        throw err;
      } finally {
        setIsRunning(false);
      }
    },
    [agentId]
  );

  return { isRunning, lastRun, triggerRun };
}
