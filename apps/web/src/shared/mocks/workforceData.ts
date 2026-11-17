export interface ConnectedAccount {
  platform: "gmail" | "linkedin" | "meta" | "outlook";
  label: string;
  status: "connected" | "needs-reauth" | "pending";
}

export interface AgentAccessSetting {
  agentNumber: number;
  agentName: string;
  enabled: boolean;
  mode: "draft" | "autonomous";
}

export interface TeamMemberWorkforce {
  id: string;
  name: string;
  email: string;
  role: "MANAGER" | "AGENT_OPERATOR" | "TRAINEE" | "CLIENT_OWNER";
  department: string;
  creditsUsed: number;
  creditsLimit: number;
  campaignSpendCap: number;
  assignedAgents: number[];
  agentAutonomy: "autonomous" | "draft";
  agentSettings: AgentAccessSetting[];
  connectedAccounts: ConnectedAccount[];
}

export interface WorkforceKpis {
  totalBalance: number;
  allocatedCredits: number;
  reservedCredits: number;
  unassignedPool: number;
  activeAutonomousRuns: number;
  resetDaysRemaining: number;
}

export const INITIAL_12_AGENTS: Omit<AgentAccessSetting, "enabled" | "mode">[] = [
  { agentNumber: 1, agentName: "Own-Post Engager" },
  { agentNumber: 2, agentName: "Competitor Researcher" },
  { agentNumber: 3, agentName: "Comment Responder" },
  { agentNumber: 4, agentName: "Analytics" },
  { agentNumber: 5, agentName: "Daily Brief" },
  { agentNumber: 6, agentName: "Outreach (DM / Email)" },
  { agentNumber: 7, agentName: "Competitor Engager" },
  { agentNumber: 8, agentName: "Publisher & Distributor" },
  { agentNumber: 9, agentName: "Inbox Responder" },
  { agentNumber: 10, agentName: "Trainee SOP" },
  { agentNumber: 11, agentName: "Company Ops" },
  { agentNumber: 12, agentName: "Supervisor AI" },
];

export const MOCK_WORKFORCE_KPIS: WorkforceKpis = {
  totalBalance: 1000,
  allocatedCredits: 600,
  reservedCredits: 50,
  unassignedPool: 350,
  activeAutonomousRuns: 8,
  resetDaysRemaining: 12,
};

export const MOCK_TEAM_MEMBERS: TeamMemberWorkforce[] = [
  {
    id: "mem_1",
    name: "Alex Mercer",
    email: "alex.m@styre.agency",
    role: "MANAGER",
    department: "Growth Ops",
    creditsUsed: 360,
    creditsLimit: 400,
    campaignSpendCap: 150,
    assignedAgents: [1, 4, 7, 12],
    agentAutonomy: "autonomous",
    agentSettings: INITIAL_12_AGENTS.map((a) => ({
      ...a,
      enabled: [1, 4, 7, 12].includes(a.agentNumber),
      mode: "autonomous",
    })),
    connectedAccounts: [
      { platform: "gmail", label: "Gmail", status: "connected" },
      { platform: "linkedin", label: "LinkedIn", status: "connected" },
    ],
  },
  {
    id: "mem_2",
    name: "Elena Rostova",
    email: "elena.r@styre.agency",
    role: "AGENT_OPERATOR",
    department: "Content & Social",
    creditsUsed: 280,
    creditsLimit: 400,
    campaignSpendCap: 120,
    assignedAgents: [2, 6, 8],
    agentAutonomy: "autonomous",
    agentSettings: INITIAL_12_AGENTS.map((a) => ({
      ...a,
      enabled: [2, 6, 8].includes(a.agentNumber),
      mode: "autonomous",
    })),
    connectedAccounts: [
      { platform: "gmail", label: "Gmail", status: "connected" },
      { platform: "linkedin", label: "LinkedIn", status: "connected" },
    ],
  },
  {
    id: "mem_3",
    name: "David Chen",
    email: "david.c@styre.agency",
    role: "AGENT_OPERATOR",
    department: "Inbound & Leads",
    creditsUsed: 150,
    creditsLimit: 350,
    campaignSpendCap: 100,
    assignedAgents: [3, 9],
    agentAutonomy: "draft",
    agentSettings: INITIAL_12_AGENTS.map((a) => ({
      ...a,
      enabled: [3, 9].includes(a.agentNumber),
      mode: "draft",
    })),
    connectedAccounts: [
      { platform: "gmail", label: "Gmail", status: "connected" },
      { platform: "linkedin", label: "LinkedIn", status: "needs-reauth" },
    ],
  },
  {
    id: "mem_4",
    name: "Maya Patel",
    email: "maya.p@styre.agency",
    role: "MANAGER",
    department: "RevOps",
    creditsUsed: 190,
    creditsLimit: 250,
    campaignSpendCap: 125,
    assignedAgents: [1, 5, 11],
    agentAutonomy: "autonomous",
    agentSettings: INITIAL_12_AGENTS.map((a) => ({
      ...a,
      enabled: [1, 5, 11].includes(a.agentNumber),
      mode: "autonomous",
    })),
    connectedAccounts: [
      { platform: "gmail", label: "Gmail", status: "connected" },
      { platform: "linkedin", label: "LinkedIn", status: "connected" },
    ],
  },
  {
    id: "mem_5",
    name: "Marcus Vance",
    email: "marcus.v@styre.agency",
    role: "TRAINEE",
    department: "Community",
    creditsUsed: 45,
    creditsLimit: 150,
    campaignSpendCap: 50,
    assignedAgents: [6, 10],
    agentAutonomy: "draft",
    agentSettings: INITIAL_12_AGENTS.map((a) => ({
      ...a,
      enabled: [6, 10].includes(a.agentNumber),
      mode: "draft",
    })),
    connectedAccounts: [
      { platform: "gmail", label: "Gmail", status: "connected" },
      { platform: "linkedin", label: "LinkedIn", status: "pending" },
    ],
  },
];
