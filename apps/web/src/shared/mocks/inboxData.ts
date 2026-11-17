export interface InboxMessage {
  id: string;
  sender: 'contact' | 'agent' | 'user';
  senderName: string;
  avatar?: string;
  content: string;
  timestamp: string;
  channel: string;
  ruleTag?: string;
}

export interface InboxThread {
  id: string;
  name: string;
  initials: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  channel: 'LinkedIn' | 'Instagram' | 'Facebook' | 'WhatsApp' | 'Email';
  channelIcon: string;
  unread: boolean;
  priorityTag: 'Hot lead' | 'General praise' | 'Pricing dispute' | 'Escalated';
  priorityTone: 'error' | 'surface' | 'secondary';
  lastMessage: string;
  lastTime: string;
  activeStatus: string;
  stage: 'Qualified' | 'Lead' | 'Meeting Booked' | 'Closed Won';
  sopNotes: string;
  messages: InboxMessage[];
  suggestedReply?: {
    text: string;
    confidence: string;
    citations: string[];
    autoExecuteMinutes: number;
    creditsCost: number;
  };
}

export const MOCK_INBOX_THREADS: InboxThread[] = [
  {
    id: 'thread-1',
    name: 'Daniel Carter',
    initials: 'DC',
    company: 'Northwind Digital',
    role: 'VP of Growth & Partnerships',
    email: 'd.carter@northwind.io',
    phone: '+1 (555) 382-9014',
    location: 'San Francisco, CA (PST)',
    channel: 'LinkedIn',
    channelIcon: 'in',
    unread: true,
    priorityTag: 'Hot lead',
    priorityTone: 'error',
    lastMessage: 'Can we schedule a 15-min call to discuss enterprise tiers?',
    lastTime: '10:42 AM',
    activeStatus: 'Active now • Synced via Apex Growth Partners',
    stage: 'Qualified',
    sopNotes: 'Evaluated 3 competing AI automation platforms. High intent on enterprise SLA with custom API rate limits. Target onboard: Q1.',
    suggestedReply: {
      text: "Hi Daniel, I'd be happy to walk you through our Enterprise tier. I have availability this Thursday at 2:00 PM EST or Friday at 11:00 AM EST. Does either time work for you? Looking forward to connecting.",
      confidence: '98%',
      citations: ['Pricing Policy.pdf', 'Service Packages.pdf'],
      autoExecuteMinutes: 8,
      creditsCost: 1,
    },
    messages: [
      {
        id: 'msg-1',
        sender: 'contact',
        senderName: 'Daniel Carter',
        content: 'Hi Alex, saw your recent update on autonomous cold outreach workflows. We are looking to scale our outbound volume to 40k contacts/month across 12 agency accounts.',
        timestamp: '10:35 AM • Delivered via LinkedIn',
        channel: 'LinkedIn',
      },
      {
        id: 'msg-2',
        sender: 'agent',
        senderName: 'Styre Bot',
        content: 'Hey Daniel, appreciate you reaching out! That scale is right in our sweet spot. Our multi-tenant architecture handles automated rotation and rate-limit guardrails natively.',
        timestamp: '10:38 AM • Sent by Styre Bot (Rule #4)',
        channel: 'LinkedIn',
        ruleTag: 'Rule #4',
      },
      {
        id: 'msg-3',
        sender: 'contact',
        senderName: 'Daniel Carter',
        content: 'That sounds ideal. Can we schedule a 15-min call this Thursday or Friday to discuss enterprise tiers and custom SLA setup?',
        timestamp: '10:42 AM • Delivered via LinkedIn',
        channel: 'LinkedIn',
      },
    ],
  },
  {
    id: 'thread-2',
    name: 'Sophia Martinez',
    initials: 'SM',
    company: 'BrightEdge Labs',
    role: 'Head of Content Marketing',
    email: 'sophia@brightedge.com',
    phone: '+1 (555) 714-2280',
    location: 'Austin, TX (CST)',
    channel: 'Instagram',
    channelIcon: 'ig',
    unread: true,
    priorityTag: 'General praise',
    priorityTone: 'surface',
    lastMessage: 'Hey, love the recent case study post! Really inspiring work.',
    lastTime: '09:15 AM',
    activeStatus: 'Active 2h ago • Instagram DM',
    stage: 'Lead',
    sopNotes: 'Engaged with LinkedIn carousel. Interested in autonomous content distribution workflow.',
    suggestedReply: {
      text: 'Thanks Sophia! Glad the playbook helped. Happy to share the raw prompt template if helpful!',
      confidence: '92%',
      citations: ['Case Studies Library.pdf'],
      autoExecuteMinutes: 15,
      creditsCost: 1,
    },
    messages: [
      {
        id: 'msg-2-1',
        sender: 'contact',
        senderName: 'Sophia Martinez',
        content: 'Hey, love the recent case study post! Really inspiring work. Did your team generate those carousels autonomously?',
        timestamp: '09:15 AM • Instagram DM',
        channel: 'Instagram',
      },
    ],
  },
  {
    id: 'thread-3',
    name: 'Marcus Vance',
    initials: 'MV',
    company: 'Apex Media Corp',
    role: 'Operations Director',
    email: 'marcus@apexmedia.co',
    phone: '+1 (555) 441-9002',
    location: 'New York, NY (EST)',
    channel: 'Email',
    channelIcon: 'mail',
    unread: false,
    priorityTag: 'Pricing dispute',
    priorityTone: 'secondary',
    lastMessage: 'Invoice #1049 seems to have billed us for extra seat add-ons...',
    lastTime: 'Yesterday',
    activeStatus: 'Synced via Google Workspace',
    stage: 'Qualified',
    sopNotes: 'Billing inquiry routed to Agent #11 and Finance queue.',
    messages: [
      {
        id: 'msg-3-1',
        sender: 'contact',
        senderName: 'Marcus Vance',
        content: 'Invoice #1049 seems to have billed us for extra seat add-ons that were decommissioned last month. Could we review this?',
        timestamp: 'Yesterday 4:18 PM • Gmail',
        channel: 'Email',
      },
    ],
  },
  {
    id: 'thread-4',
    name: 'Elena Rostova',
    initials: 'ER',
    company: 'Skyline Ventures',
    role: 'Partner',
    email: 'elena@skylinevc.com',
    phone: '+1 (555) 880-3112',
    location: 'London, UK (GMT)',
    channel: 'WhatsApp',
    channelIcon: 'wa',
    unread: false,
    priorityTag: 'Escalated',
    priorityTone: 'error',
    lastMessage: 'Urgent: bot paused outbound sending unexpectedly on our main...',
    lastTime: 'Yesterday',
    activeStatus: 'WhatsApp Business API',
    stage: 'Meeting Booked',
    sopNotes: 'Safety guardrail tripped due to LinkedIn daily connection request limit.',
    messages: [
      {
        id: 'msg-4-1',
        sender: 'contact',
        senderName: 'Elena Rostova',
        content: 'Urgent: bot paused outbound sending unexpectedly on our main campaign. Is this expected?',
        timestamp: 'Yesterday 6:02 PM • WhatsApp',
        channel: 'WhatsApp',
      },
    ],
  },
  {
    id: 'thread-5',
    name: "Liam O'Connor",
    initials: 'LO',
    company: 'Tidewater Capital',
    role: 'Principal',
    email: 'liam@tidewatercap.com',
    phone: '+1 (555) 234-5678',
    location: 'Boston, MA (EST)',
    channel: 'LinkedIn',
    channelIcon: 'in',
    unread: false,
    priorityTag: 'Hot lead',
    priorityTone: 'error',
    lastMessage: 'Thanks for sending over the deck. Reviewing with team today.',
    lastTime: 'Oct 28',
    activeStatus: 'Offline • Synced via LinkedIn',
    stage: 'Meeting Booked',
    sopNotes: 'Pitch deck sent. Requested follow-up call next Tuesday.',
    messages: [
      {
        id: 'msg-5-1',
        sender: 'contact',
        senderName: "Liam O'Connor",
        content: 'Thanks for sending over the deck. Reviewing with team today. Will revert with calendar invites.',
        timestamp: 'Oct 28 11:20 AM • LinkedIn',
        channel: 'LinkedIn',
      },
    ],
  },
  {
    id: 'thread-6',
    name: 'Priya Patel',
    initials: 'PP',
    company: 'SaaS Pulse Media',
    role: 'Founder',
    email: 'priya@saaspulse.io',
    phone: '+1 (555) 912-8833',
    location: 'Toronto, Canada (EST)',
    channel: 'Facebook',
    channelIcon: 'fb',
    unread: false,
    priorityTag: 'General praise',
    priorityTone: 'surface',
    lastMessage: 'What are your SLAs for autonomous sequence approvals?',
    lastTime: 'Oct 27',
    activeStatus: 'Active 1d ago • Facebook Page',
    stage: 'Lead',
    sopNotes: 'Interested in White-label Styre-Bot enterprise tier.',
    messages: [
      {
        id: 'msg-6-1',
        sender: 'contact',
        senderName: 'Priya Patel',
        content: 'What are your SLAs for autonomous sequence approvals? Are comments posted in under 3 minutes?',
        timestamp: 'Oct 27 3:15 PM • Facebook',
        channel: 'Facebook',
      },
    ],
  },
];
