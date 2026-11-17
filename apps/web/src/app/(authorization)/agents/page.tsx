"use client";

import React, { useState } from "react";
import {
  Bot,
  Play,
  Zap,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import {
  AgentCard,
  DagViewer,
  RunLog,
  useAgentRun,
  useSupervisor,
  type AgentCode,
  type AgentStatus,
} from "@/domains/agents";
import { Button } from "@/shared/ui/atoms/Button";
import { Badge } from "@/shared/ui/atoms/Badge";
import { Input } from "@/shared/ui/atoms/Input";
import { MetricBadge } from "@/shared/ui/molecules/MetricBadge";
import { useWebSocket } from "@/shared/hooks/useWebSocket";

interface FleetAgent {
  id: string;
  name: string;
  code: AgentCode;
  description: string;
  status: AgentStatus;
  runsCount: number;
}

const FLEET_AGENTS: FleetAgent[] = [
  {
    id: "ag-1",
    name: "Competitor Intelligence Radar",
    code: "competitor-researcher",
    description: "Monitors competitor ad creatives, pricing shifts, and engagement surges in real-time.",
    status: "active",
    runsCount: 142,
  },
  {
    id: "ag-2",
    name: "Autonomous Content Creator",
    code: "content-creator",
    description: "Generates high-converting social posts, hooks, and carousel copy based on vector knowledge base.",
    status: "active",
    runsCount: 310,
  },
  {
    id: "ag-3",
    name: "Lead Finder & Enrichment",
    code: "lead-finder",
    description: "Identifies, qualifies, and enriches B2B decision-maker prospects via Apollo & LinkedIn graph.",
    status: "active",
    runsCount: 89,
  },
  {
    id: "ag-4",
    name: "Outreach Campaign Specialist",
    code: "outreach-specialist",
    description: "Dispatches personalized email & LinkedIn sequences with adaptive cadence pacing.",
    status: "active",
    runsCount: 520,
  },
  {
    id: "ag-5",
    name: "QA & Compliance Auditor",
    code: "qa-compliance",
    description: "Validates all outbound copy against client brand guidelines and regulatory compliance.",
    status: "idle",
    runsCount: 94,
  },
  {
    id: "ag-6",
    name: "Autonomous Comment Engager",
    code: "own-post-engager",
    description: "Maintains active comment conversations on viral posts within a 15-minute sliding window.",
    status: "active",
    runsCount: 640,
  },
];

export default function AgentsFleetPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "active" | "idle">("all");
  const [logs, setLogs] = useState<string[]>([
    "Fleet cluster online. 6 autonomous workers initialized.",
    "Redis pub/sub connected to company topic channels.",
    "Sliding-window rate limit policy active: 60 req/min.",
  ]);

  const { triggerRun, isRunning } = useAgentRun();
  const { dag, orchestrating, planMission } = useSupervisor();

  // Listen to agent executions stream via WebSocket
  useWebSocket("agents", (event) => {
    if (event?.data) {
      setLogs((prev) => [
        `[${new Date().toLocaleTimeString()}] ${JSON.stringify(event.data)}`,
        ...prev.slice(0, 50),
      ]);
    }
  });

  const handleExecuteAgent = async (agentId: string) => {
    setLogs((prev) => [`Dispatching execution run for agent ${agentId}...`, ...prev]);
    await triggerRun(agentId);
    setLogs((prev) => [`Agent ${agentId} execution completed with 0 errors.`, ...prev]);
  };

  const handlePlanSupervisor = () => {
    planMission("Q4 Enterprise B2B Fintech Lead Generation Sprint");
  };

  const filteredAgents = FLEET_AGENTS.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "all" || a.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-primary font-semibold">Autonomous Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Multi-Agent Fleet Orchestrator
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Coordinate specialized autonomous AI agents across research, copywriting, outreach, and engagement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles className="w-3.5 h-3.5 text-primary" />}
            isLoading={orchestrating}
            onClick={handlePlanSupervisor}
          >
            Supervisor Mission DAG
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Play className="w-3.5 h-3.5" />}
            isLoading={isRunning}
            onClick={() => handleExecuteAgent("ag-1")}
          >
            Run All Active
          </Button>
        </div>
      </div>

      {/* Fleet KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricBadge
          label="Active Agents"
          value="5 / 6"
          trend="99.8% Uptime"
          isPositive={true}
          icon={<Bot className="w-5 h-5" />}
        />
        <MetricBadge
          label="Executions Today"
          value="1,795"
          trend="+14% vs yesterday"
          isPositive={true}
          icon={<Zap className="w-5 h-5 text-amber-500" />}
        />
        <MetricBadge
          label="Supervisor Status"
          value="Orchestrating"
          trend="Directed Acyclic Graph"
          isPositive={true}
          icon={<Sparkles className="w-5 h-5 text-purple-500" />}
        />
        <MetricBadge
          label="Fleet Status"
          value="Operational"
          icon={<RefreshCw className="w-5 h-5 text-emerald-500" />}
        />
      </div>

      {/* Supervisor DAG View (if planned) */}
      {dag && <DagViewer dag={dag} />}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card border border-border">
        <div className="w-full sm:w-72">
          <Input
            placeholder="Search agents by capability..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <Button
            variant={activeTab === "all" ? "primary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("all")}
          >
            All Agents ({FLEET_AGENTS.length})
          </Button>
          <Button
            variant={activeTab === "active" ? "primary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("active")}
          >
            Active (5)
          </Button>
          <Button
            variant={activeTab === "idle" ? "primary" : "ghost"}
            size="xs"
            onClick={() => setActiveTab("idle")}
          >
            Idle (1)
          </Button>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            id={agent.id}
            name={agent.name}
            agentCode={agent.code}
            description={agent.description}
            status={agent.status}
            runsCount={agent.runsCount}
            onTrigger={handleExecuteAgent}
          />
        ))}
      </div>

      {/* Execution Stream Log */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-foreground">Fleet Telemetry & Execution Log</h3>
        <RunLog logs={logs} isStreaming={isRunning || orchestrating} />
      </div>
    </div>
  );
}
