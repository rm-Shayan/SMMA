export interface ApprovalItem {
  id: string;
  submitterName: string;
  submitterInitials: string;
  companyName: string;
  channel: "linkedin" | "instagram" | "email" | "comment";
  channelLabel: string;
  agentNumber: number;
  agentName: string;
  timeAgo: string;
  priority: "urgent" | "due_today" | "normal";
  previewSnippet: string;
  fullContent: string;
  destinationAccount: string;
  mediaUrl?: string;
  mediaName?: string;
  mediaSize?: string;
  hashtags: string[];
  characterCount: number;
  maxCharacters: number;
  aiSafetyScore: number;
}

export const MOCK_APPROVAL_ITEMS: ApprovalItem[] = [
  {
    id: "appr_1",
    submitterName: "Sarah Khan",
    submitterInitials: "SK",
    companyName: "Apex Growth Partners",
    channel: "linkedin",
    channelLabel: "Social Post",
    agentNumber: 8,
    agentName: "Publisher & Distributor",
    timeAgo: "12 min ago",
    priority: "urgent",
    previewSnippet: "Thrilled to share how we scaled multi-agent AI workflows for B2B pipeline growth across 4 connected accounts...",
    fullContent: `Thrilled to share how we scaled multi-agent AI workflows for B2B pipeline growth across 4 connected accounts. Human oversight paired with deterministic agency guardrails delivers 3.4x faster turnaround without sacrificing tone or compliance.\n\nRead our full breakdown on social ops architecture below 👇`,
    destinationAccount: "LinkedIn • Apex Growth Partners (Company Page)",
    mediaUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop",
    mediaName: "b2b_ops_framework_v2.png",
    mediaSize: "1.2 MB • 1920x1080 • PNG High Res",
    hashtags: ["#AIOps", "#B2BMarketing", "#GrowthStrategy", "#SocialOps"],
    characterCount: 212,
    maxCharacters: 3000,
    aiSafetyScore: 99.4,
  },
  {
    id: "appr_2",
    submitterName: "David Chen",
    submitterInitials: "DC",
    companyName: "Apex Growth Partners",
    channel: "email",
    channelLabel: "Cold Email",
    agentNumber: 6,
    agentName: "Outreach (DM / Email)",
    timeAgo: "42 min ago",
    priority: "due_today",
    previewSnippet: "Follow-up on Q3 marketing automation audit for enterprise inbound leads and pipeline...",
    fullContent: `Hi Michael,\n\nFollowing up on our brief audit of your current outbound cadence. We observed that 64% of high-intent enterprise replies stall during the initial 4-hour window.\n\nOur autonomous inbound responders triage and book calendar demos in real-time. Would you be open to a 10-minute walkthrough this Thursday?\n\nBest,\nDavid`,
    destinationAccount: "Gmail • Work Email (david.c@styre.agency)",
    hashtags: [],
    characterCount: 345,
    maxCharacters: 2000,
    aiSafetyScore: 98.2,
  },
  {
    id: "appr_3",
    submitterName: "Elena Rostova",
    submitterInitials: "ER",
    companyName: "Apex Growth Partners",
    channel: "instagram",
    channelLabel: "Social Post",
    agentNumber: 8,
    agentName: "Publisher & Distributor",
    timeAgo: "1h ago",
    priority: "due_today",
    previewSnippet: "Behind the scenes: how autonomous systems categorize customer sentiment in 120ms...",
    fullContent: `Behind the scenes: how autonomous systems categorize customer sentiment in 120ms.\n\nTraditional tools take minutes. Styre Bot routes incoming comments directly to Agent #3 for instant empathetic response drafting. 🚀`,
    destinationAccount: "Instagram • @apexgrowth.agency",
    mediaUrl: "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?q=80&w=1000&auto=format&fit=crop",
    mediaName: "sentiment_engine_infographic.jpg",
    mediaSize: "840 KB • 1080x1080 • JPG",
    hashtags: ["#ArtificialIntelligence", "#CustomerExperience", "#Automation"],
    characterCount: 180,
    maxCharacters: 2200,
    aiSafetyScore: 97.9,
  },
  {
    id: "appr_4",
    submitterName: "Marcus Vance",
    submitterInitials: "MV",
    companyName: "Apex Growth Partners",
    channel: "comment",
    channelLabel: "Comment Reply",
    agentNumber: 3,
    agentName: "Comment Responder",
    timeAgo: "2h ago",
    priority: "normal",
    previewSnippet: "Great perspective on AI governance! In our testing, human-in-the-loop validation dropped churn...",
    fullContent: `Great perspective on AI governance! In our testing, human-in-the-loop validation dropped churn by 40% because senior managers maintain final approval on sensitive outreach. Thanks for sharing this piece!`,
    destinationAccount: "LinkedIn Post #8841 Comments",
    hashtags: [],
    characterCount: 185,
    maxCharacters: 1250,
    aiSafetyScore: 99.8,
  },
];
