export interface LeadItem {
  id: string;
  name: string;
  initials: string;
  company: string;
  email: string;
  phone: string;
  source: 'LinkedIn' | 'Instagram DM' | 'Email' | 'Meta Ads';
  sourceIcon: string;
  score: 'Hot' | 'Warm' | 'Cold';
  scoreTone: 'error' | 'amber' | 'slate';
  stage: 'New' | 'Contacted' | 'Replied' | 'Qualified' | 'Won';
  stageTone: 'slate' | 'primary' | 'primary' | 'tertiary' | 'emerald';
  lastActivity: string;
  agentOwner: string;
  dealSize?: string;
  notes?: string;
}

export interface PipelineColumn {
  id: 'New' | 'Contacted' | 'Replied' | 'Qualified' | 'Won';
  title: string;
  count: number;
  dotColor: string;
}

export const MOCK_LEADS_DATA: LeadItem[] = [
  {
    id: 'lead-1',
    name: 'Daniel Carter',
    initials: 'DC',
    company: 'Northwind Digital',
    email: 'd.carter@northwind.io',
    phone: '+1 (555) 382-9014',
    source: 'LinkedIn',
    sourceIcon: 'in',
    score: 'Hot',
    scoreTone: 'error',
    stage: 'Qualified',
    stageTone: 'tertiary',
    lastActivity: '2 hours ago',
    agentOwner: 'Agent #6 Outreach',
    dealSize: '$4,200/mo',
    notes: 'High intent enterprise prospect. Inquiring about custom SLA setup.',
  },
  {
    id: 'lead-2',
    name: 'Sophia Martinez',
    initials: 'SM',
    company: 'Horizon Media Labs',
    email: 's.martinez@horizonmedia.co',
    phone: '+1 (555) 491-2280',
    source: 'Instagram DM',
    sourceIcon: 'ig',
    score: 'Warm',
    scoreTone: 'amber',
    stage: 'Replied',
    stageTone: 'primary',
    lastActivity: '4 hours ago',
    agentOwner: 'Agent #1 Own-Post Engager',
    dealSize: '$1,800/mo',
    notes: 'Responded with praise on case study carousel.',
  },
  {
    id: 'lead-3',
    name: 'Marcus Vance',
    initials: 'MV',
    company: 'Kinetix Solutions',
    email: 'm.vance@kinetixgrowth.com',
    phone: '+1 (555) 712-3091',
    source: 'Email',
    sourceIcon: 'mail',
    score: 'Warm',
    scoreTone: 'amber',
    stage: 'Contacted',
    stageTone: 'primary',
    lastActivity: 'Yesterday',
    agentOwner: 'Agent #6 Outreach',
    dealSize: '$2,500/mo',
    notes: 'Opened step 1 email twice in last 24h.',
  },
  {
    id: 'lead-4',
    name: 'Elena Rostova',
    initials: 'ER',
    company: 'Veloce Brand Studio',
    email: 'elena@veloce.agency',
    phone: '+1 (555) 830-4921',
    source: 'LinkedIn',
    sourceIcon: 'in',
    score: 'Hot',
    scoreTone: 'error',
    stage: 'Qualified',
    stageTone: 'tertiary',
    lastActivity: 'Yesterday',
    agentOwner: 'Agent #7 Competitor Engager',
    dealSize: '$5,000/mo',
    notes: 'Evaluated competitor agencies. Requested discovery deck.',
  },
  {
    id: 'lead-5',
    name: "Liam O'Connor",
    initials: 'LO',
    company: 'Crestline SaaS Partners',
    email: 'liam@crestline.io',
    phone: '+1 (555) 204-8832',
    source: 'LinkedIn',
    sourceIcon: 'in',
    score: 'Hot',
    scoreTone: 'error',
    stage: 'Contacted',
    stageTone: 'primary',
    lastActivity: '2 days ago',
    agentOwner: 'Agent #6 Outreach',
    dealSize: '$3,100/mo',
    notes: 'Connection request accepted on LinkedIn.',
  },
  {
    id: 'lead-6',
    name: 'Priya Patel',
    initials: 'PP',
    company: 'Lumina Ad Ventures',
    email: 'priya.p@luminaads.com',
    phone: '+1 (555) 918-2041',
    source: 'Meta Ads',
    sourceIcon: 'meta',
    score: 'Cold',
    scoreTone: 'slate',
    stage: 'New',
    stageTone: 'slate',
    lastActivity: '2 days ago',
    agentOwner: 'Inbound Webhook',
    dealSize: '$1,200/mo',
    notes: 'Filled top of funnel form from paid campaign.',
  },
  {
    id: 'lead-7',
    name: 'Tyler Brooks',
    initials: 'TB',
    company: 'PeakScale Agency',
    email: 'tbrooks@peakscale.dev',
    phone: '+1 (555) 673-1194',
    source: 'Email',
    sourceIcon: 'mail',
    score: 'Warm',
    scoreTone: 'amber',
    stage: 'Contacted',
    stageTone: 'primary',
    lastActivity: '3 days ago',
    agentOwner: 'Agent #6 Outreach',
    dealSize: '$2,800/mo',
    notes: 'Scheduled for step 2 follow-up in 48h.',
  },
  {
    id: 'lead-8',
    name: 'Claire Dupont',
    initials: 'CD',
    company: 'Nova Growth Paris',
    email: 'c.dupont@novagrowth.fr',
    phone: '+33 1 42 68 55 00',
    source: 'LinkedIn',
    sourceIcon: 'in',
    score: 'Hot',
    scoreTone: 'error',
    stage: 'Won',
    stageTone: 'emerald',
    lastActivity: '4 days ago',
    agentOwner: 'Alex Vance',
    dealSize: '$6,400/mo',
    notes: 'Closed won! Signed Agency Pro multi-tenant tier.',
  },
];

export const MOCK_PIPELINE_COLUMNS: PipelineColumn[] = [
  { id: 'New', title: 'New', count: 42, dotColor: 'bg-secondary' },
  { id: 'Contacted', title: 'Contacted', count: 112, dotColor: 'bg-primary-container' },
  { id: 'Replied', title: 'Replied', count: 41, dotColor: 'bg-tertiary-container' },
  { id: 'Qualified', title: 'Qualified', count: 36, dotColor: 'bg-primary-fixed-dim' },
  { id: 'Won', title: 'Won', count: 17, dotColor: 'bg-emerald-500' },
];

export interface CompetitorData {
  id: string;
  name: string;
  initials: string;
  domain: string;
  badge: string;
  starterPrice: string;
  starterDesc: string;
  growthPrice: string;
  growthDesc: string;
  enterprisePrice: string;
  enterpriseDesc: string;
  activeOffer: string;
  offerExpiry: string;
  postCadence: string;
  cadenceDelta: string;
  primaryChannel: string;
  channelShare: string;
  latestPost: string;
  reportDate: string;
}

export const MOCK_COMPETITORS: CompetitorData[] = [
  {
    id: 'comp-1',
    name: 'Northstar Agency',
    initials: 'NA',
    domain: 'northstaragency.co',
    badge: 'Tracked daily',
    starterPrice: '$499',
    starterDesc: '5 active campaigns',
    growthPrice: '$1,250',
    growthDesc: 'Unlimited outreach',
    enterprisePrice: '$2,800',
    enterpriseDesc: 'Custom SDR seats',
    activeOffer: '20% off first 3 months',
    offerExpiry: 'Expires Nov 30',
    postCadence: '14 posts',
    cadenceDelta: '+3 vs lw',
    primaryChannel: 'LinkedIn',
    channelShare: '82% share',
    latestPost: 'Yesterday 4:15 PM',
    reportDate: 'Nov 13',
  },
  {
    id: 'comp-2',
    name: 'Brightlane Media',
    initials: 'BM',
    domain: 'brightlanemedia.io',
    badge: 'Tracked daily',
    starterPrice: '$850',
    starterDesc: 'Fixed scope',
    growthPrice: '$2,100',
    growthDesc: '+ Rev share',
    enterprisePrice: 'Custom',
    enterpriseDesc: 'On quotation',
    activeOffer: 'Free outbound audit ($500 value)',
    offerExpiry: 'Ongoing promo',
    postCadence: '22 posts',
    cadenceDelta: 'High cadence',
    primaryChannel: 'Instagram',
    channelShare: 'Reels focused',
    latestPost: 'Today 10:30 AM',
    reportDate: 'Nov 13',
  },
  {
    id: 'comp-3',
    name: 'Peak Social Studio',
    initials: 'PS',
    domain: 'peaksocialstudio.com',
    badge: 'Tracked daily',
    starterPrice: '$650',
    starterDesc: 'Bi-weekly reporting',
    growthPrice: '$1,450',
    growthDesc: 'AI Engine Included',
    enterprisePrice: '$3,200',
    enterpriseDesc: 'Dedicated Manager',
    activeOffer: '$0 setup fee for Q4 signups',
    offerExpiry: 'Limit 5 clients',
    postCadence: '9 posts',
    cadenceDelta: 'Steady',
    primaryChannel: 'LinkedIn',
    channelShare: 'Thought leadership',
    latestPost: 'Nov 11 2:00 PM',
    reportDate: 'Nov 13',
  },
];

export const MOCK_COMPETITOR_CHANGES = [
  {
    id: 'ch-1',
    date: 'Nov 12',
    agency: 'Northstar Agency',
    description: 'Lowered Pro plan price from $1,400 to $1,250/mo',
    tag: 'Pricing decrease',
    time: '11:42 AM',
  },
  {
    id: 'ch-2',
    date: 'Nov 10',
    agency: 'Brightlane Media',
    description: 'Started a new offer: Free outbound audit landing page launched',
    tag: 'New offer',
    time: '03:15 PM',
  },
  {
    id: 'ch-3',
    date: 'Nov 08',
    agency: 'Peak Social Studio',
    description: 'Shifted core focus from Facebook Lead Ads to LinkedIn Organic B2B',
    tag: 'Strategy shift',
    time: '09:20 AM',
  },
];
