export interface TenantCompany {
  id: string;
  name: string;
  slug: string;
  tier: 'Agency Starter' | 'Agency Pro' | 'Enterprise';
  status: 'active' | 'past_due' | 'suspended';
  seats: string;
  creditBalance: number;
  monthlyBurn: number;
  adminName: string;
  adminEmail: string;
  createdDate: string;
}

export interface PricingRateItem {
  id: string;
  agentNumber: string;
  agentName: string;
  action: string;
  currentCost: number;
  newCost: number;
  lastChanged: string;
  changedBy: string;
  isChanged: boolean;
}

export interface TenantTransaction {
  id: string;
  timestamp: string;
  type: 'Purchased' | 'Consumed' | 'Reserved' | 'Revoked';
  tenantName: string;
  referenceId: string;
  actor: string;
  delta: number;
  balanceAfter: number;
}

export const initialTenants: TenantCompany[] = [
  {
    id: 'ten-1',
    name: 'Northwind Digital',
    slug: 'northwind-digital',
    tier: 'Agency Pro',
    status: 'active',
    seats: '8 / 10',
    creditBalance: 18400,
    monthlyBurn: 4200,
    adminName: 'Danial Ahmed',
    adminEmail: 'danial@northwind.io',
    createdDate: 'Oct 14, 2026',
  },
  {
    id: 'ten-2',
    name: 'Brightlane Media',
    slug: 'brightlane-media',
    tier: 'Agency Starter',
    status: 'active',
    seats: '4 / 5',
    creditBalance: 3200,
    monthlyBurn: 1100,
    adminName: 'Marcus Chen',
    adminEmail: 'marcus@brightlane.com',
    createdDate: 'Oct 22, 2026',
  },
  {
    id: 'ten-3',
    name: 'Peak Social Studio',
    slug: 'peak-social',
    tier: 'Enterprise',
    status: 'active',
    seats: '24 / 25',
    creditBalance: 48000,
    monthlyBurn: 9800,
    adminName: 'Sarah Jenkins',
    adminEmail: 's.jenkins@peaksocial.com',
    createdDate: 'Sep 02, 2026',
  },
  {
    id: 'ten-4',
    name: 'Apex Growth Partners',
    slug: 'apex-growth',
    tier: 'Agency Pro',
    status: 'active',
    seats: '10 / 10',
    creditBalance: 680,
    monthlyBurn: 2400,
    adminName: 'Ahmer Ali',
    adminEmail: 'ahmer@apexgrowth.com',
    createdDate: 'Nov 01, 2026',
  },
  {
    id: 'ten-5',
    name: 'Vanguard Brand Co',
    slug: 'vanguard-brand',
    tier: 'Agency Starter',
    status: 'past_due',
    seats: '2 / 5',
    creditBalance: 120,
    monthlyBurn: 850,
    adminName: 'Oliver Vance',
    adminEmail: 'oliver@vanguard.io',
    createdDate: 'Aug 18, 2026',
  },
  {
    id: 'ten-6',
    name: 'Horizon Media Group',
    slug: 'horizon-media',
    tier: 'Enterprise',
    status: 'active',
    seats: '18 / 25',
    creditBalance: 31200,
    monthlyBurn: 7200,
    adminName: 'Maya Lin',
    adminEmail: 'maya@horizonmg.com',
    createdDate: 'Jul 29, 2026',
  },
];

export const initialPricingRates: PricingRateItem[] = [
  {
    id: 'rate-1',
    agentNumber: '#6',
    agentName: 'Outreach',
    action: 'Send outreach email',
    currentCost: 1,
    newCost: 2,
    lastChanged: 'Oct 28',
    changedBy: 'you',
    isChanged: true,
  },
  {
    id: 'rate-2',
    agentNumber: '#8',
    agentName: 'Publisher',
    action: 'Publish multi-channel social post',
    currentCost: 2,
    newCost: 2,
    lastChanged: 'Sep 14',
    changedBy: 'Super Admin',
    isChanged: false,
  },
  {
    id: 'rate-3',
    agentNumber: '#2',
    agentName: 'Competitor Researcher',
    action: 'Scrape competitor pricing and offers',
    currentCost: 5,
    newCost: 5,
    lastChanged: 'Sep 10',
    changedBy: 'Super Admin',
    isChanged: false,
  },
  {
    id: 'rate-4',
    agentNumber: '#1',
    agentName: 'Own-Post Engager',
    action: 'Engagement boost reaction & seed comment',
    currentCost: 2,
    newCost: 2,
    lastChanged: 'Aug 22',
    changedBy: 'Super Admin',
    isChanged: false,
  },
  {
    id: 'rate-5',
    agentNumber: '#3',
    agentName: 'Comment Responder',
    action: 'Generate on-brand comment response',
    currentCost: 3,
    newCost: 3,
    lastChanged: 'Oct 04',
    changedBy: 'Super Admin',
    isChanged: false,
  },
  {
    id: 'rate-6',
    agentNumber: '#9',
    agentName: 'Inbox Responder',
    action: 'Qualify lead & auto-reply DM',
    currentCost: 3,
    newCost: 3,
    lastChanged: 'Oct 11',
    changedBy: 'Super Admin',
    isChanged: false,
  },
  {
    id: 'rate-7',
    agentNumber: '#10',
    agentName: 'Trainee SOP',
    action: 'Grade training quiz and verify compliance',
    currentCost: 1,
    newCost: 1,
    lastChanged: 'Sep 30',
    changedBy: 'Super Admin',
    isChanged: false,
  },
  {
    id: 'rate-8',
    agentNumber: '#12',
    agentName: 'Supervisor',
    action: 'Cross-agent arbitration and review check',
    currentCost: 2,
    newCost: 2,
    lastChanged: 'Oct 19',
    changedBy: 'Super Admin',
    isChanged: false,
  },
];

export const initialTransactions: TenantTransaction[] = [
  {
    id: 'tx-1',
    timestamp: 'Nov 14, 18:22',
    type: 'Purchased',
    tenantName: 'Northwind Digital',
    referenceId: 'sub_live_9941a',
    actor: 'Stripe Webhook',
    delta: 5000,
    balanceAfter: 18400,
  },
  {
    id: 'tx-2',
    timestamp: 'Nov 14, 17:05',
    type: 'Consumed',
    tenantName: 'Apex Growth Partners',
    referenceId: 'run_8f3a21',
    actor: 'Sarah Jenkins',
    delta: -15,
    balanceAfter: 680,
  },
  {
    id: 'tx-3',
    timestamp: 'Nov 14, 16:40',
    type: 'Reserved',
    tenantName: 'Peak Social Studio',
    referenceId: 'run_71bc99',
    actor: 'Workflow Queue',
    delta: -50,
    balanceAfter: 48000,
  },
  {
    id: 'tx-4',
    timestamp: 'Nov 14, 15:10',
    type: 'Consumed',
    tenantName: 'Brightlane Media',
    referenceId: 'run_44b109',
    actor: 'Marcus Chen',
    delta: -2,
    balanceAfter: 3200,
  },
  {
    id: 'tx-5',
    timestamp: 'Nov 13, 21:00',
    type: 'Revoked',
    tenantName: 'Vanguard Brand Co',
    referenceId: 'policy_cap_rev',
    actor: 'Admin Overwrite',
    delta: -200,
    balanceAfter: 120,
  },
];
