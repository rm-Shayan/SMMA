export interface CampaignItem {
  id: string;
  name: string;
  owner: string;
  ownerInitials: string;
  agent: string;
  channel: "Direct Mail" | "LinkedIn" | "Meta" | "Multi-channel";
  sentToday: number;
  capToday: number;
  percent: number;
  status: "Running" | "Paused" | "Throttled";
  dispatchedAt: string;
}

export interface EmployeeSendPermission {
  id: string;
  name: string;
  email: string;
  role: "Manager" | "Operator" | "Trainee";
  avatar: string;
  directSendEnabled: boolean;
  restricted: boolean;
  restrictionReason?: string;
}

export interface CampaignsOverviewData {
  diagnostics: {
    activeCampaigns: number;
    totalCampaigns: number;
    channelsCount: number;
    messagesSentToday: number;
    dailyLimit: number;
    bufferRemaining: number;
    dailyCapPercent: number;
    pausedCount: number;
  };
  campaigns: CampaignItem[];
  employeePermissions: EmployeeSendPermission[];
}

export const MOCK_CAMPAIGNS_DATA: CampaignsOverviewData = {
  diagnostics: {
    activeCampaigns: 4,
    totalCampaigns: 5,
    channelsCount: 3,
    messagesSentToday: 182,
    dailyLimit: 235,
    bufferRemaining: 53,
    dailyCapPercent: 78,
    pausedCount: 1,
  },
  campaigns: [
    {
      id: "camp-1",
      name: "SaaS Founders Q3 Cold Outreach",
      owner: "Sarah Klein",
      ownerInitials: "SK",
      agent: "Agent #06 Outreach",
      channel: "Direct Mail",
      sentToday: 45,
      capToday: 50,
      percent: 90,
      status: "Running",
      dispatchedAt: "Today, 08:30 AM",
    },
    {
      id: "camp-2",
      name: "Fintech VP Eng LinkedIn Connect",
      owner: "David Chen",
      ownerInitials: "DC",
      agent: "Agent #02 Social",
      channel: "LinkedIn",
      sentToday: 68,
      capToday: 100,
      percent: 68,
      status: "Running",
      dispatchedAt: "Today, 09:15 AM",
    },
    {
      id: "camp-3",
      name: "Inbound High-Intent Follow-ups",
      owner: "Elena Rostova",
      ownerInitials: "ER",
      agent: "Agent #04 Nurture",
      channel: "Direct Mail",
      sentToday: 12,
      capToday: 80,
      percent: 15,
      status: "Paused",
      dispatchedAt: "Yesterday, 14:00",
    },
    {
      id: "camp-4",
      name: "Q3 Event Invites - Enterprise",
      owner: "Marcus Vance",
      ownerInitials: "MV",
      agent: "Agent #01 Event",
      channel: "LinkedIn",
      sentToday: 25,
      capToday: 25,
      percent: 100,
      status: "Throttled",
      dispatchedAt: "Today, 10:45 AM",
    },
    {
      id: "camp-5",
      name: "Re-engagement - Stale MQLs",
      owner: "Alex Mercer",
      ownerInitials: "AM",
      agent: "Agent #09 Reactivation",
      channel: "Direct Mail",
      sentToday: 32,
      capToday: 60,
      percent: 53,
      status: "Running",
      dispatchedAt: "Today, 11:10 AM",
    },
  ],
  employeePermissions: [
    {
      id: "emp-1",
      name: "Alex Mercer",
      email: "alex.mercer@agencypro.ai",
      role: "Manager",
      avatar: "AM",
      directSendEnabled: true,
      restricted: false,
    },
    {
      id: "emp-2",
      name: "David Chen",
      email: "david.chen@agencypro.ai",
      role: "Operator",
      avatar: "DC",
      directSendEnabled: true,
      restricted: false,
    },
    {
      id: "emp-3",
      name: "Marcus Vance",
      email: "marcus.v@agencypro.ai",
      role: "Trainee",
      avatar: "MV",
      directSendEnabled: false,
      restricted: true,
      restrictionReason: "Requires manager signoff for all sends",
    },
    {
      id: "emp-4",
      name: "Elena Rostova",
      email: "elena.rostova@agencypro.ai",
      role: "Operator",
      avatar: "ER",
      directSendEnabled: true,
      restricted: false,
    },
  ],
};
