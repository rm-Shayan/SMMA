export interface ScheduledPost {
  id: string;
  day: number;
  time: string;
  title: string;
  platform: "LinkedIn" | "Twitter" | "Facebook" | "Instagram";
  status: "draft" | "scheduled" | "published" | "failed";
  likes?: number;
  comments?: number;
  reposts?: number;
}

export const MOCK_PUBLISHING_DATA = {
  currentPost: {
    platform: "LinkedIn" as const,
    tone: "Executive",
    content: `Most B2B SaaS teams spend 40+ hours per week manually distributing content across channels without tracking actual pipeline impact. \n\nHere is our exact 3-step playbook to automate cross-channel syndication while preserving authentic founder voice 🧵👇`,
    charCount: 212,
    charLimit: 3000,
    voiceProfile: "Founder & CEO (Active)",
    attachment: {
      name: "growth-analytics-q3.png",
      size: "1.2 MB",
      status: "Uploaded & Optimized",
    },
    suggestedHashtags: ["#B2BGrowth", "#SaaSMarketing", "#AIAutomation", "#FounderLedSales"],
    telemetry: {
      readabilityScore: 94,
      estImpressions: "3.2k–4.8k",
      viralityIndex: "High Virality Index",
      insight: "Post includes clear numerical proof points which increases CEO engagement by 41%.",
    },
  },
  scheduledCalendar: [
    {
      id: "cal-1",
      day: 3,
      time: "09:00",
      title: "Product launch announcement",
      platform: "LinkedIn",
      status: "published",
      likes: 148,
      comments: 24,
      reposts: 9,
    },
    {
      id: "cal-2",
      day: 5,
      time: "11:00",
      title: "Founder reflections & agency playbook",
      platform: "Twitter",
      status: "draft",
    },
    {
      id: "cal-3",
      day: 7,
      time: "13:15",
      title: "Q3 Retention benchmarks",
      platform: "LinkedIn",
      status: "published",
      likes: 92,
      comments: 11,
      reposts: 4,
    },
    {
      id: "cal-4",
      day: 9,
      time: "08:30",
      title: "Video sync payload",
      platform: "Facebook",
      status: "failed",
    },
    {
      id: "cal-5",
      day: 10,
      time: "16:00",
      title: "Testimonial snippet from FinTech client",
      platform: "LinkedIn",
      status: "published",
      likes: 210,
      comments: 35,
      reposts: 18,
    },
    {
      id: "cal-6",
      day: 14,
      time: "10:00",
      title: "Growth playbook syndication",
      platform: "LinkedIn",
      status: "scheduled",
    },
    {
      id: "cal-7",
      day: 14,
      time: "15:00",
      title: "Product Teaser for Q4 release",
      platform: "Twitter",
      status: "scheduled",
    },
    {
      id: "cal-8",
      day: 17,
      time: "09:00",
      title: "Engineering doc walkthrough",
      platform: "LinkedIn",
      status: "scheduled",
    },
    {
      id: "cal-9",
      day: 18,
      time: "14:30",
      title: "AI Ops workflow breakdown",
      platform: "LinkedIn",
      status: "scheduled",
    },
    {
      id: "cal-10",
      day: 24,
      time: "09:00",
      title: "SaaS recap & growth matrix",
      platform: "LinkedIn",
      status: "scheduled",
    },
  ] as ScheduledPost[],
};
