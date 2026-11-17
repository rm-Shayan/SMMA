export interface DashboardKpi {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendLabel: string;
  isPositive: boolean;
  subtext: string;
  badge?: string;
  sparklineData?: number[];
}

export interface PlatformStat {
  id: string;
  name: string;
  category: string;
  abbr: string;
  badgeColor: string;
  activeConvs: number;
  percentage: number;
  color: string;
  aiHandledRate: number;
  leadConversion: number;
  trend: string;
  isTrendPositive: boolean;
}

export interface TacticalBriefItem {
  id: string;
  botTag: string;
  timestamp: string;
  title: string;
  impactTag: string;
  impactColor: "high" | "scheduled" | "opportunity" | "urgent";
  targetDetail: string;
  actionText: string;
}

export interface DashboardData {
  workspaceName: string;
  autopilotActive: boolean;
  kpis: DashboardKpi[];
  platformStats: PlatformStat[];
  totalConversations: number;
  briefItems: TacticalBriefItem[];
}

export const MOCK_DASHBOARD_DATA: DashboardData = {
  workspaceName: "Workspace 01",
  autopilotActive: true,
  totalConversations: 18450,
  kpis: [
    {
      id: "leads",
      label: "Total Leads",
      value: "4,829",
      trend: "+14.2%",
      trendLabel: "vs last week",
      isPositive: true,
      subtext: "Across 6 active campaigns",
      sparklineData: [10, 14, 12, 18, 22, 28],
    },
    {
      id: "hot_leads",
      label: "Hot Leads",
      value: "342",
      trend: "+8.6%",
      trendLabel: "qualification",
      isPositive: true,
      subtext: "AI confidence > 85%",
      badge: "Priority",
    },
    {
      id: "conversations",
      label: "Conversations",
      value: "18,450",
      trend: "94.8% AI",
      trendLabel: "(+3.1%)",
      isPositive: true,
      subtext: "Avg response: 18s",
    },
    {
      id: "scheduled",
      label: "Scheduled Posts",
      value: "128",
      trend: "Today 2:00 PM",
      trendLabel: "next batch",
      isPositive: true,
      subtext: "5 channels queued",
    },
    {
      id: "published",
      label: "Published Posts",
      value: "942",
      trend: "+24 today",
      trendLabel: "on schedule",
      isPositive: true,
      subtext: "100% success rate",
    },
  ],
  platformStats: [
    {
      id: "linkedin",
      name: "LinkedIn",
      category: "B2B Outbound",
      abbr: "in",
      badgeColor: "bg-[#0077B5] text-white",
      activeConvs: 7011,
      percentage: 38,
      color: "#063cbc",
      aiHandledRate: 96.4,
      leadConversion: 18.4,
      trend: "+4.2%",
      isTrendPositive: true,
    },
    {
      id: "instagram",
      name: "Instagram",
      category: "Direct Messages & Stories",
      abbr: "ig",
      badgeColor: "bg-gradient-to-tr from-amber-500 to-pink-500 text-white",
      activeConvs: 4797,
      percentage: 26,
      color: "#89f5e7",
      aiHandledRate: 94.2,
      leadConversion: 14.2,
      trend: "+2.8%",
      isTrendPositive: true,
    },
    {
      id: "facebook",
      name: "Facebook",
      category: "Community Pages",
      abbr: "fb",
      badgeColor: "bg-[#1877F2] text-white",
      activeConvs: 2952,
      percentage: 16,
      color: "#b7c4ff",
      aiHandledRate: 91.8,
      leadConversion: 9.5,
      trend: "-0.1%",
      isTrendPositive: false,
    },
    {
      id: "twitter",
      name: "Twitter / X",
      category: "Replies & Mentions",
      abbr: "𝕏",
      badgeColor: "bg-black text-white",
      activeConvs: 2214,
      percentage: 12,
      color: "#213145",
      aiHandledRate: 95.0,
      leadConversion: 7.8,
      trend: "+1.5%",
      isTrendPositive: true,
    },
    {
      id: "whatsapp",
      name: "WhatsApp",
      category: "Direct Agent Chat",
      abbr: "wa",
      badgeColor: "bg-[#25D366] text-white",
      activeConvs: 1476,
      percentage: 8,
      color: "#00544d",
      aiHandledRate: 98.1,
      leadConversion: 22.6,
      trend: "+6.4%",
      isTrendPositive: true,
    },
  ],
  briefItems: [
    {
      id: "brief_1",
      botTag: "OutreachBot-01",
      timestamp: "15m ago",
      title: "Approve 12 high-priority replies for LinkedIn B2B campaign",
      impactTag: "High Impact",
      impactColor: "high",
      targetDetail: "Targeting VP Marketing tier",
      actionText: "Execute",
    },
    {
      id: "brief_2",
      botTag: "ContentBot-08",
      timestamp: "42m ago",
      title: "Publish Q3 Performance Carousel to Instagram & Facebook",
      impactTag: "Scheduled",
      impactColor: "scheduled",
      targetDetail: "Creative asset #408 approved",
      actionText: "Review",
    },
    {
      id: "brief_3",
      botTag: "CompetitorRadar-07",
      timestamp: "1h ago",
      title: "Counter-campaign ready for Competitor pricing change",
      impactTag: "Opportunity",
      impactColor: "opportunity",
      targetDetail: "3 targeted battle-cards synthesized",
      actionText: "Deploy",
    },
    {
      id: "brief_4",
      botTag: "InboxBot-09",
      timestamp: "2h ago",
      title: "3 enterprise leads waiting in inbox needing approval",
      impactTag: "Urgent",
      impactColor: "urgent",
      targetDetail: "Deal value > $15k pipeline",
      actionText: "Open Inbox",
    },
  ],
};
