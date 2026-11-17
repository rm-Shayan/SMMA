export interface AgentItem {
  id: number;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  status: 'active' | 'idle' | 'paused';
  creditsPerAct: number;
  lastActive: string;
  iconName: string;
  category: 'growth' | 'operations' | 'support' | 'intelligence';
}

export interface AgentRunHistory {
  id: string;
  agentNumber: string;
  agentName: string;
  iconName: string;
  taskDescription: string;
  status: 'completed' | 'running' | 'failed' | 'queued';
  creditsUsed: number;
  time: string;
}

export const initialAgentsList: AgentItem[] = [
  {
    id: 1,
    number: '#1',
    name: 'Own-Post Engager',
    subtitle: 'Audience Amplification',
    description: 'Automatically likes and engages with agency social posts to boost initial algorithmic momentum.',
    status: 'active',
    creditsPerAct: 2,
    lastActive: '4 min ago',
    iconName: 'ThumbsUp',
    category: 'growth',
  },
  {
    id: 2,
    number: '#2',
    name: 'Competitor Researcher',
    subtitle: 'Market Intel',
    description: 'Scrapes competitor pricing tiers, promo landing pages, and daily social posting frequency.',
    status: 'active',
    creditsPerAct: 5,
    lastActive: '18 min ago',
    iconName: 'Radar',
    category: 'growth',
  },
  {
    id: 3,
    number: '#3',
    name: 'Comment Responder',
    subtitle: 'Community Support',
    description: 'Crafts tailored, on-brand responses to inbound comments across LinkedIn and X posts.',
    status: 'active',
    creditsPerAct: 3,
    lastActive: '12 min ago',
    iconName: 'MessageSquare',
    category: 'support',
  },
  {
    id: 4,
    number: '#4',
    name: 'Analytics',
    subtitle: 'Performance Telemetry',
    description: 'Aggregates engagement velocity, impression surges, and weekly conversion telemetry.',
    status: 'idle',
    creditsPerAct: 1,
    lastActive: '2 hours ago',
    iconName: 'BarChart3',
    category: 'operations',
  },
  {
    id: 5,
    number: '#5',
    name: 'Daily Brief',
    subtitle: 'Executive Digest',
    description: 'Compiles morning operational briefs and executive action items for agency operators.',
    status: 'idle',
    creditsPerAct: 2,
    lastActive: '6 hours ago',
    iconName: 'Newspaper',
    category: 'operations',
  },
  {
    id: 6,
    number: '#6',
    name: 'Outreach',
    subtitle: 'Sales Automation',
    description: 'Orchestrates multi-touch personalized cold outreach sequences with dynamic company merge tags.',
    status: 'active',
    creditsPerAct: 4,
    lastActive: '7 min ago',
    iconName: 'Send',
    category: 'growth',
  },
  {
    id: 7,
    number: '#7',
    name: 'Competitor Engager',
    subtitle: 'Thread Placement',
    description: 'Identifies high-performing competitor threads and strategically participates in discussions.',
    status: 'active',
    creditsPerAct: 3,
    lastActive: '25 min ago',
    iconName: 'Crosshair',
    category: 'growth',
  },
  {
    id: 8,
    number: '#8',
    name: 'Publisher',
    subtitle: 'Content Delivery',
    description: 'Dispatches scheduled multi-channel content drafts to social feeds and verification queues.',
    status: 'active',
    creditsPerAct: 2,
    lastActive: '42 min ago',
    iconName: 'Calendar',
    category: 'operations',
  },
  {
    id: 9,
    number: '#9',
    name: 'Inbox Responder',
    subtitle: 'Lead Qualification',
    description: 'Handles direct messages, qualifies inbound leads, and auto-routes disputes to human operators.',
    status: 'active',
    creditsPerAct: 3,
    lastActive: '2 min ago',
    iconName: 'MailCheck',
    category: 'support',
  },
  {
    id: 10,
    number: '#10',
    name: 'Trainee SOP',
    subtitle: 'Training & QA',
    description: 'Evaluates employee playbook training runs, grades quiz certifications, and logs SOP compliance.',
    status: 'idle',
    creditsPerAct: 1,
    lastActive: '1 day ago',
    iconName: 'GraduationCap',
    category: 'operations',
  },
  {
    id: 11,
    number: '#11',
    name: 'Company Ops',
    subtitle: 'Guardrail Control',
    description: 'Monitors workspace credit burn rates, seat quotas, and automated kill-switch guardrails.',
    status: 'paused',
    creditsPerAct: 1,
    lastActive: 'Paused by Admin (3d)',
    iconName: 'ShieldAlert',
    category: 'operations',
  },
  {
    id: 12,
    number: '#12',
    name: 'Supervisor',
    subtitle: 'Consensus & Review',
    description: 'Verifies agent output sentiment, quality thresholds, and resolves cross-agent execution conflicts.',
    status: 'idle',
    creditsPerAct: 2,
    lastActive: '55 min ago',
    iconName: 'CheckCircle2',
    category: 'intelligence',
  },
];

export const initialRecentRuns: AgentRunHistory[] = [
  {
    id: 'run-1',
    agentNumber: '#9',
    agentName: 'Inbox Responder',
    iconName: 'MailCheck',
    taskDescription: 'Auto-replied to LinkedIn inquiry from Daniel Carter',
    status: 'completed',
    creditsUsed: 3,
    time: '2 min ago',
  },
  {
    id: 'run-2',
    agentNumber: '#1',
    agentName: 'Own-Post Engager',
    iconName: 'ThumbsUp',
    taskDescription: 'Engagement boost on ‘Q4 SaaS Benchmarks’ post',
    status: 'completed',
    creditsUsed: 2,
    time: '4 min ago',
  },
  {
    id: 'run-3',
    agentNumber: '#6',
    agentName: 'Outreach',
    iconName: 'Send',
    taskDescription: 'Dispatched Step 1 email batch (18 prospects)',
    status: 'running',
    creditsUsed: 18,
    time: 'Just now',
  },
  {
    id: 'run-4',
    agentNumber: '#2',
    agentName: 'Competitor Researcher',
    iconName: 'Radar',
    taskDescription: 'Scraped Northstar pricing updates and quarterly offer bundles',
    status: 'completed',
    creditsUsed: 5,
    time: '18 min ago',
  },
  {
    id: 'run-5',
    agentNumber: '#8',
    agentName: 'Publisher',
    iconName: 'Calendar',
    taskDescription: 'Scheduled 3 weekly LinkedIn thought-leadership carousels',
    status: 'completed',
    creditsUsed: 2,
    time: '42 min ago',
  },
];
