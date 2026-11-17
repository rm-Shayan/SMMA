export interface LibraryTemplate {
  id: string;
  title: string;
  type: "post" | "email" | "brand";
  badge: string;
  snippet?: string;
  stepsCount?: number;
  openRate?: string;
  tags: string[];
  updatedAt: string;
}

export const MOCK_CONTENT_LIBRARY: LibraryTemplate[] = [
  {
    id: "lib-1",
    title: "Product launch announcement",
    type: "post",
    badge: "Ready",
    snippet: "Excited to reveal what we've been building for 6 months. Meet the next gen AI orchestrator...",
    tags: ["#Launch", "#LinkedIn"],
    updatedAt: "Updated 2 days ago",
  },
  {
    id: "lib-2",
    title: "Cold outreach, 3 steps",
    type: "email",
    badge: "3 steps • Avg 42% open rate",
    stepsCount: 3,
    openRate: "42%",
    tags: ["#Outbound", "#B2B"],
    updatedAt: "Updated 2 days ago",
  },
  {
    id: "lib-3",
    title: "Weekly tips post",
    type: "post",
    badge: "Verified",
    snippet: "3 tactical agency growth habits that saved us 15 hours every week: 1. Batching client audits...",
    tags: ["#ThoughtLeadership", "#Twitter/X"],
    updatedAt: "Updated 3 days ago",
  },
  {
    id: "lib-4",
    title: "Logo pack",
    type: "brand",
    badge: "Vector SVG",
    tags: ["#SVG", "#Vector"],
    updatedAt: "Updated 2 days ago",
  },
  {
    id: "lib-5",
    title: "Follow-up after demo",
    type: "email",
    badge: "4 steps • Demo follow-up & pricing",
    stepsCount: 4,
    openRate: "38%",
    tags: ["#Sales", "#HighIntent"],
    updatedAt: "Updated 5 days ago",
  },
  {
    id: "lib-6",
    title: "Brand colors guide",
    type: "brand",
    badge: "Palette Tokens",
    tags: ["#Tokens", "#Palette"],
    updatedAt: "Updated 1 week ago",
  },
  {
    id: "lib-7",
    title: "Customer case study spotlight",
    type: "post",
    badge: "+450% ARR",
    snippet: "How Acme scaled from $20k to $110k MRR without hiring extra account managers...",
    tags: ["#CaseStudy", "#ROI"],
    updatedAt: "Updated 4 days ago",
  },
  {
    id: "lib-8",
    title: "Q3 Growth Infographic",
    type: "brand",
    badge: "Analytics Visual",
    tags: ["#Graphics", "#Infographic"],
    updatedAt: "Updated 1 week ago",
  },
];
