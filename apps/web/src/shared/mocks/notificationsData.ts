export interface NotificationItem {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  category: 'approvals' | 'credits' | 'connectors' | 'system';
  unread: boolean;
  avatarIcon: string; // Lucide icon name or type
  severity?: 'normal' | 'warning' | 'critical';
  actionUrl?: string;
}

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New draft waiting for approval',
    subtitle: 'Sarah Khan submitted a post for LinkedIn',
    timestamp: '12m ago',
    category: 'approvals',
    unread: true,
    avatarIcon: 'CheckCircle2',
    actionUrl: '/approvals',
  },
  {
    id: 'notif-2',
    title: 'Low credit balance alert',
    subtitle: 'Ahmer Ali reached 92% of monthly quota allocation',
    timestamp: '34m ago',
    category: 'credits',
    unread: true,
    avatarIcon: 'Zap',
    severity: 'warning',
    actionUrl: '/credits',
  },
  {
    id: 'notif-3',
    title: 'Gmail connector disconnected',
    subtitle: 'OAuth token revoked • Re-authorization required immediately',
    timestamp: '1h ago',
    category: 'connectors',
    unread: true,
    avatarIcon: 'Unlink',
    severity: 'critical',
    actionUrl: '/channels',
  },
  {
    id: 'notif-4',
    title: 'Sending paused on LinkedIn',
    subtitle: 'Rate limit active • Scheduled outreach automatically resumes in 45m',
    timestamp: '2h ago',
    category: 'system',
    unread: true,
    avatarIcon: 'PauseCircle',
    actionUrl: '/sequences/new',
  },
  {
    id: 'notif-5',
    title: 'Competitor radar spike detected',
    subtitle: 'Competitor TechFlow launched a pricing refresh with 3 new ad creatives',
    timestamp: '3h ago',
    category: 'system',
    unread: true,
    avatarIcon: 'Radar',
    actionUrl: '/competitor-radar',
  },
  {
    id: 'notif-6',
    title: 'Lead enrichment completed',
    subtitle: 'Agent #8 successfully enriched 142 enterprise prospects from CSV upload',
    timestamp: '5h ago',
    category: 'system',
    unread: false,
    avatarIcon: 'Users',
    actionUrl: '/leads',
  },
  {
    id: 'notif-7',
    title: 'Quiz certified: Cold Outreach Playbook v2',
    subtitle: 'Trainee Zaid passed with 95% score and unlocked autonomous publishing access',
    timestamp: 'Yesterday',
    category: 'approvals',
    unread: false,
    avatarIcon: 'GraduationCap',
    actionUrl: '/academy/quiz/result',
  },
  {
    id: 'notif-8',
    title: 'Monthly invoice ready',
    subtitle: 'Invoice INV-2026-003 for $4,200.00 processed via Stripe',
    timestamp: '3 days ago',
    category: 'credits',
    unread: false,
    avatarIcon: 'Receipt',
    actionUrl: '/credits/invoices',
  },
];
