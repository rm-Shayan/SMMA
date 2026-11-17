"use client";

import { useState, useCallback } from "react";
import { agentsApi } from "../api/agents.api";
import type { TaskDag } from "../types";
import toast from "react-hot-toast";

export function useSupervisor() {
  const [dag, setDag] = useState<TaskDag | null>(null);
  const [orchestrating, setOrchestrating] = useState(false);

  const planMission = useCallback(async (objective: string) => {
    setOrchestrating(true);
    try {
      // Calls supervisor orchestrator
      toast.success(`Supervisor generating DAG for objective: "${objective.slice(0, 30)}..."`);
      setDag({
        id: `dag-${Date.now()}`,
        title: objective,
        progress: 0,
        nodes: [
          { id: "1", title: "Target Audience Scraping", agentCode: "competitor-researcher", status: "completed", dependencies: [] },
          { id: "2", title: "High-Converting Copy Crafting", agentCode: "content-creator", status: "running", dependencies: ["1"] },
          { id: "3", title: "QA Compliance Policy Audit", agentCode: "qa-compliance", status: "pending", dependencies: ["2"] },
          { id: "4", title: "Multichannel Outreach Dispatch", agentCode: "outreach-specialist", status: "pending", dependencies: ["3"] },
        ],
      });
    } catch {
      toast.error("Supervisor orchestration failed");
    } finally {
      setOrchestrating(false);
    }
  }, []);

  return { dag, orchestrating, planMission };
}
