import { httpClient } from "@/shared/http/client";
import type { AgentRun } from "../types";

export const agentsApi = {
  getAgents: async () => {
    const res = await httpClient.get("/agents");
    return res.data;
  },

  getAgentById: async (id: string) => {
    const res = await httpClient.get(`/agents/${id}`);
    return res.data;
  },

  triggerAgentRun: async (agentId: string, payload?: Record<string, unknown>): Promise<AgentRun> => {
    const res = await httpClient.post(`/agents/${agentId}/run`, payload);
    return res.data;
  },

  getAgentRuns: async (agentId?: string): Promise<AgentRun[]> => {
    const res = await httpClient.get("/agents/runs", {
      params: agentId ? { agent_id: agentId } : undefined,
    });
    return res.data;
  },

  pauseAgent: async (agentId: string) => {
    const res = await httpClient.post(`/agents/${agentId}/pause`);
    return res.data;
  },

  resumeAgent: async (agentId: string) => {
    const res = await httpClient.post(`/agents/${agentId}/resume`);
    return res.data;
  },
};
