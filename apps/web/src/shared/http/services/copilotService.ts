import type { CopilotActionCard } from "@/types/copilot";

export interface CopilotProcessResult {
  text: string;
  agentNumber: number;
  agentName: string;
  actionCard?: CopilotActionCard;
}

/**
 * Intelligent Client Orchestrator for Agent #12 (Supervisor).
 * When the backend API is live (e.g. POST /api/agents/supervisor/chat),
 * this function can directly proxy to the API.
 */
export async function sendCopilotMessageApi(prompt: string): Promise<CopilotProcessResult> {
  // Simulate network thinking latency (500-1000ms)
  await new Promise((resolve) => setTimeout(resolve, 800));

  const lower = prompt.toLowerCase();

  // 1. Post / Scheduling / Publishing (Agent #8)
  if (
    lower.includes("post") ||
    lower.includes("schedule") ||
    lower.includes("publish") ||
    lower.includes("linkedin") ||
    lower.includes("tweet") ||
    lower.includes("instagram")
  ) {
    return {
      agentNumber: 8,
      agentName: "Agent #8 (Publisher & Distributor)",
      text: "I have prepared an optimized draft and queued it with Agent #8 (Publisher). Here is the preview ready for one-click approval:",
      actionCard: {
        type: "schedule_post",
        title: "LinkedIn Thought Leadership Post",
        description: "Optimal engagement slot detected tomorrow at 09:30 AM EST.",
        payload: {
          platform: "linkedin",
          content:
            "🚀 Elevating our enterprise workflows with multi-agent orchestration. By deploying autonomous lead qualifiers and responsive inbox workers, we cut response latency by 80%!\n\n#Automation #StyreBot #AgenticAI",
          time: "Tomorrow, 09:30 AM (Optimal AI Slot)",
          estimatedCredits: 3,
        },
      },
    };
  }

  // 2. Leads / Outreach / Clients (Agent #2 & #6)
  if (
    lower.includes("lead") ||
    lower.includes("outreach") ||
    lower.includes("prospect") ||
    lower.includes("pipeline") ||
    lower.includes("client")
  ) {
    return {
      agentNumber: 6,
      agentName: "Agent #6 (Outreach & Deal Closer)",
      text: "Agent #2 (Researcher) and Agent #6 (Outreach) analyzed your pipeline. You have 3 high-intent leads requiring immediate attention:",
      actionCard: {
        type: "view_lead",
        title: "3 High-Intent Pipeline Opportunities",
        description: "SaaS & FinTech companies with >85 Lead Score ready for demo sequence.",
        payload: {
          leads: [
            { name: "Sarah Jenkins", company: "FinTech Scale", score: 92, status: "Hot Qualified" },
            { name: "Michael Vance", company: "CyberShield AI", score: 88, status: "Meeting Booked" },
            { name: "Elena Rostova", company: "Nordic Commerce", score: 85, status: "Proposal Sent" },
          ],
          destination: "/leads",
        },
      },
    };
  }

  // 3. Inbox / Escalations / Comments (Agent #3 & #9)
  if (
    lower.includes("inbox") ||
    lower.includes("comment") ||
    lower.includes("dm") ||
    lower.includes("reply") ||
    lower.includes("escalat") ||
    lower.includes("message")
  ) {
    return {
      agentNumber: 9,
      agentName: "Agent #9 (Inbox Responder)",
      text: "I scanned incoming DMs and comments. Agent #9 flagged 1 urgent pricing inquiry that requires your sign-off before dispatching:",
      actionCard: {
        type: "approve_inbox",
        title: "Instagram DM: Pricing & Enterprise Scope",
        description: "From: @tech_founder_dan — Sentiment: Positive / High-Urgency",
        payload: {
          userMessage: '"Hey team, love your AI bot orchestration demo. Do you have custom pricing for agencies managing 15+ sub-brands?"',
          draftReply: '"Hi Dan! Yes, our Enterprise tier includes unlimited sub-brands, custom credit pools, and dedicated supervisor bots. I have attached our agency pricing sheet!"',
          conversationId: "conv_dm_402",
        },
      },
    };
  }

  // 4. Credits / Wallet / Analytics (Agent #4 & #12)
  if (
    lower.includes("credit") ||
    lower.includes("wallet") ||
    lower.includes("balance") ||
    lower.includes("usage") ||
    lower.includes("cost") ||
    lower.includes("spend")
  ) {
    return {
      agentNumber: 12,
      agentName: "Styre Bot (Supervisor Orchestrator)",
      text: "Here is your live real-time credit ledger balance across all active agents:",
      actionCard: {
        type: "check_credits",
        title: "Company Credit Balance & Ledger",
        description: "Ledger status: Healthy (No low-balance alert)",
        payload: {
          available: 680,
          allocated: 1000,
          reserved: 45,
          consumedToday: 28,
          costUsdToday: "$1.40",
        },
      },
    };
  }

  // 5. Channels & Social Profiles (Agent #1 & #7)
  if (
    lower.includes("channel") ||
    lower.includes("meta") ||
    lower.includes("facebook") ||
    lower.includes("connect")
  ) {
    return {
      agentNumber: 1,
      agentName: "Agent #1 (Own-Post Engager)",
      text: "Your social integrations are operational. 4 channels active (LinkedIn, Instagram, X/Twitter, Facebook).",
      actionCard: {
        type: "navigate",
        title: "Manage Channels & Connected Accounts",
        description: "All OAuth tokens valid. Next token refresh in 18 days.",
        payload: {
          destination: "/channels",
          label: "Open Channels Hub",
        },
      },
    };
  }

  // Default Fallback: Styre Bot
  return {
    agentNumber: 12,
    agentName: "Styre Bot (Supervisor Orchestrator)",
    text: `Received: "${prompt}". I am monitoring all 11 agents in your organization. You can ask me to:\n• "Schedule a post on LinkedIn for tomorrow"\n• "Show my top hot leads in the pipeline"\n• "Check escalated customer DMs in inbox"\n• "What is my credit balance?"`,
  };
}

