export interface ChannelConnector {
  id: string;
  platform: 'linkedin' | 'gmail' | 'meta' | 'outlook';
  title: string;
  subtitle: string;
  status: 'connected' | 'action_needed' | 'disconnected' | 'not_connected';
  statusLabel: string;
  note: string;
  expiresInDays?: number;
  icon: string;
  badgeTone: 'emerald' | 'amber' | 'rose' | 'slate';
  connectedAccount?: string;
}

export interface SendingPaceAccount {
  id: string;
  name: string;
  channelType: string;
  platform: 'linkedin' | 'gmail' | 'outlook' | 'meta';
  status: 'sending' | 'paused' | 'waiting' | 'inactive';
  statusLabel: string;
  nextSend: string;
  todaySent: number;
  todayCap: number;
  hourlySent: number;
  hourlyCap: number;
  profileState: string;
  stateBadgeTone: 'default' | 'primary' | 'amber';
}

export const MOCK_CHANNEL_CONNECTORS: ChannelConnector[] = [
  {
    id: 'conn-linkedin',
    platform: 'linkedin',
    title: 'Apex Growth Partners',
    subtitle: 'Company Page • @alex-vance-b2b',
    status: 'connected',
    statusLabel: 'Connected',
    note: 'Token valid, expires in 48 days',
    expiresInDays: 48,
    icon: 'share-2',
    badgeTone: 'emerald',
    connectedAccount: 'Apex Growth Partners (alex.vance)',
  },
  {
    id: 'conn-gmail',
    platform: 'gmail',
    title: 'alex.vance@apexgrowth.io',
    subtitle: 'Google Workspace OAuth',
    status: 'action_needed',
    statusLabel: 'Action Needed',
    note: 'Expires in 12 days • Auth required',
    expiresInDays: 12,
    icon: 'mail',
    badgeTone: 'amber',
    connectedAccount: 'alex.vance@apexgrowth.io',
  },
  {
    id: 'conn-meta',
    platform: 'meta',
    title: 'Apex Growth Meta Suite',
    subtitle: 'Instagram Business + FB Page',
    status: 'disconnected',
    statusLabel: 'Disconnected',
    note: 'Session expired 4 days ago',
    icon: 'message-circle',
    badgeTone: 'rose',
    connectedAccount: 'Apex Growth Marketing',
  },
  {
    id: 'conn-outlook',
    platform: 'outlook',
    title: 'Microsoft 365 Exchange',
    subtitle: 'Corporate outbound alias',
    status: 'not_connected',
    statusLabel: 'Not connected',
    note: 'No active pipeline integration',
    icon: 'inbox',
    badgeTone: 'slate',
  },
];

export const MOCK_SENDING_PACE_ACCOUNTS: SendingPaceAccount[] = [
  {
    id: 'pace-1',
    name: 'Apex Growth Partners',
    channelType: 'LinkedIn Outbound',
    platform: 'linkedin',
    status: 'paused',
    statusLabel: 'Paused',
    nextSend: 'Paused (28m)',
    todaySent: 45,
    todayCap: 50,
    hourlySent: 12,
    hourlyCap: 20,
    profileState: 'Normal',
    stateBadgeTone: 'default',
  },
  {
    id: 'pace-2',
    name: 'alex.vance@apexgrowth.io',
    channelType: 'Google Mail Primary',
    platform: 'gmail',
    status: 'sending',
    statusLabel: 'Sending',
    nextSend: 'in 1m 45s',
    todaySent: 38,
    todayCap: 50,
    hourlySent: 14,
    hourlyCap: 20,
    profileState: 'Normal',
    stateBadgeTone: 'default',
  },
  {
    id: 'pace-3',
    name: 'alex.v@apexpartners.com',
    channelType: 'Secondary Domain',
    platform: 'outlook',
    status: 'waiting',
    statusLabel: 'Waiting',
    nextSend: 'in 4m 10s',
    todaySent: 12,
    todayCap: 25,
    hourlySent: 4,
    hourlyCap: 10,
    profileState: 'Warmup, 50% capacity',
    stateBadgeTone: 'primary',
  },
  {
    id: 'pace-4',
    name: 'Apex Growth Instagram DM',
    channelType: 'Meta Platform',
    platform: 'meta',
    status: 'inactive',
    statusLabel: 'Inactive',
    nextSend: '—',
    todaySent: 0,
    todayCap: 30,
    hourlySent: 0,
    hourlyCap: 15,
    profileState: 'Warmup, 50% capacity',
    stateBadgeTone: 'default',
  },
];
