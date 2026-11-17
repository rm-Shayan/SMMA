export interface NotificationDto {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  time?: string;
  created_at?: string;
  read?: boolean;
  category?: 'approvals' | 'credits' | 'connectors' | 'system';
  unread?: boolean;
  severity?: 'normal' | 'warning' | 'critical';
  actionUrl?: string;
  action_url?: string;
  subtitle?: string;
  timestamp?: string;
  avatarIcon?: string;
  avatar_icon?: string;
}

export interface NotificationPreferencesDto {
  lowCreditThreshold?: number;
  emailAlerts?: boolean;
  approvalAlerts?: boolean;
  lowBalance?: boolean;
  pendingApprovals?: boolean;
  failedRuns?: boolean;
  dailyBrief?: boolean;
  [key: string]: unknown;
}

export interface NotificationsListResponse {
  success?: boolean;
  notifications?: NotificationDto[];
  items?: NotificationDto[];
}

export interface NotificationPreferencesResponse {
  success?: boolean;
  preferences?: NotificationPreferencesDto;
  companyId?: string;
  lowCreditThreshold?: number;
  emailAlerts?: boolean;
  approvalAlerts?: boolean;
}
