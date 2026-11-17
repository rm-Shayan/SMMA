export type DraftStatus = "draft" | "review" | "approved" | "dispatched" | "rejected";

export interface WorkspaceDraft {
  id: string;
  title: string;
  type: "Social Post" | "Cold Email" | "Comment";
  status: DraftStatus;
  timestamp: string;
  authorOrBot: string;
  reviewer?: string;
  rejectionFeedback?: string;
}

export interface WorkspaceTrainingItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  dueIn: string;
  progress: string;
  quizRoute: string;
}

export interface WorkspaceData {
  credits: {
    available: number;
    monthlyLimit: number;
    consumed: number;
    percentAvailable: number;
    renewDate: string;
  };
  draftActivity: {
    pending: number;
    approved: number;
    published: number;
    velocityDelta: string;
  };
  connectedAccounts: Array<{
    id: string;
    platform: "Gmail" | "LinkedIn";
    name: string;
    accountHandle: string;
    status: "Connected" | "ExpiringSoon";
    warningText?: string;
  }>;
  drafts: WorkspaceDraft[];
  assignedTraining: WorkspaceTrainingItem;
}

export const MOCK_WORKSPACE_DATA: WorkspaceData = {
  credits: {
    available: 145,
    monthlyLimit: 200,
    consumed: 55,
    percentAvailable: 72.5,
    renewDate: "1st of next month",
  },
  draftActivity: {
    pending: 4,
    approved: 12,
    published: 3,
    velocityDelta: "+18% velocity vs. last week",
  },
  connectedAccounts: [
    {
      id: "acc-1",
      platform: "Gmail",
      name: "Gmail Outreach",
      accountHandle: "ahmer.a@styre.agency",
      status: "Connected",
    },
    {
      id: "acc-2",
      platform: "LinkedIn",
      name: "LinkedIn Personal Profile",
      accountHandle: "linkedin.com/in/ahmer-ali",
      status: "ExpiringSoon",
      warningText: "Expires in 12 days",
    },
  ],
  drafts: [
    {
      id: "dr-1",
      title: "Q3 FinTech Inbound DM Follow-up",
      type: "Social Post",
      status: "draft",
      timestamp: "20m ago",
      authorOrBot: "Styre Bot v2.4",
    },
    {
      id: "dr-2",
      title: "Agency intro to Tier-1 Growth leads",
      type: "Cold Email",
      status: "draft",
      timestamp: "2h ago",
      authorOrBot: "AI Prompted",
    },
    {
      id: "dr-3",
      title: "AI Workflows Breakdown Carousel",
      type: "Social Post",
      status: "review",
      timestamp: "45m ago",
      authorOrBot: "Sarah Klein",
      reviewer: "Sarah Khan",
    },
    {
      id: "dr-4",
      title: "Event Invite: Scaling Ops Panel",
      type: "Cold Email",
      status: "review",
      timestamp: "1h ago",
      authorOrBot: "Outreach Lead",
      reviewer: "Pending QA",
    },
    {
      id: "dr-5",
      title: "Thought Leadership: Human in the loop",
      type: "Social Post",
      status: "approved",
      timestamp: "10:15 AM",
      authorOrBot: "Styre Editorial",
    },
    {
      id: "dr-6",
      title: "Re-engagement reply to VP Marketing",
      type: "Comment",
      status: "dispatched",
      timestamp: "09:30 AM",
      authorOrBot: "Agent #03 Responder",
    },
    {
      id: "dr-7",
      title: "Enterprise Pitch - Pricing Tier Intro",
      type: "Cold Email",
      status: "rejected",
      timestamp: "Yesterday",
      authorOrBot: "Agent #06 Outreach",
      rejectionFeedback: "Remove the price mention and resubmit",
    },
  ],
  assignedTraining: {
    id: "trn-1",
    title: "Agency Cold Outreach Playbook v2",
    badge: "Mandatory SOP",
    description: "Module 3: Autonomous outreach guardrails & escalation protocol (15 min read)",
    dueIn: "Due in 3 days",
    progress: "0/4 completed",
    quizRoute: "/academy/quiz",
  },
};
