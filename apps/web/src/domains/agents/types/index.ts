export type AgentCode =
  | "supervisor"
  | "competitor-researcher"
  | "content-creator"
  | "qa-compliance"
  | "video-producer"
  | "outreach-specialist"
  | "lead-finder"
  | "inbox-concierge"
  | "social-publisher"
  | "own-post-engager"
  | "designer"
  | "general";

export type AgentStatus = "active" | "idle" | "running" | "paused" | "failed" | "queued" | "completed";

export interface AgentRun {
  id: string;
  agentId: string;
  agentName: string;
  status: AgentStatus;
  startedAt: string;
  completedAt?: string;
  tokensUsed?: number;
  creditsCost?: number;
  outputSummary?: string;
  logs?: string[];
}

export interface TaskDagNode {
  id: string;
  title: string;
  agentCode: AgentCode;
  status: "pending" | "running" | "completed" | "failed";
  dependencies: string[];
}

export interface TaskDag {
  id: string;
  title: string;
  nodes: TaskDagNode[];
  progress: number;
}
