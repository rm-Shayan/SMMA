'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  SlidersHorizontal,
  CheckCircle2,
  Zap,
  Unlink,
  PauseCircle,
  Radar,
  Users,
  GraduationCap,
  Receipt,
  ArrowRight,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { getNotificationsApi, markNotificationReadApi } from '@/services/notificationsService';
import { useWebSocketTopic } from '@/hooks/useWebSocketTopic';
import type { NotificationDto } from '@/types/notifications';

type UICategory = 'all' | 'unread' | 'approvals' | 'credits' | 'connectors' | 'system';

interface UiNotification {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  category: Exclude<UICategory, 'all' | 'unread'>;
  unread: boolean;
  avatarIcon: string;
  severity?: 'normal' | 'warning' | 'critical';
  actionUrl?: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  CheckCircle2: <CheckCircle2 className="w-4 h-4 text-primary" />,
  Zap: <Zap className="w-4 h-4 text-amber-500" />,
  Unlink: <Unlink className="w-4 h-4 text-error" />,
  PauseCircle: <PauseCircle className="w-4 h-4 text-secondary" />,
  Radar: <Radar className="w-4 h-4 text-primary" />,
  Users: <Users className="w-4 h-4 text-emerald-600" />,
  GraduationCap: <GraduationCap className="w-4 h-4 text-indigo-600" />,
  Receipt: <Receipt className="w-4 h-4 text-teal-600" />,
};

function inferCategory(n: NotificationDto): UiNotification['category'] {
  const c = String(n.category || n.type || '').toLowerCase();
  if (c.includes('approval')) return 'approvals';
  if (c.includes('credit') || c.includes('billing') || c.includes('invoice') || c.includes('low_balance')) return 'credits';
  if (c.includes('connector') || c.includes('oauth') || c.includes('channel') || c.includes('token')) return 'connectors';
  return 'system';
}

function inferIcon(category: UiNotification['category'], n: NotificationDto): string {
  if (n.avatarIcon || n.avatar_icon) return String(n.avatarIcon || n.avatar_icon);
  const t = `${n.type || ''} ${n.title || ''} ${n.message || ''}`.toLowerCase();
  if (category === 'approvals') return t.includes('quiz') || t.includes('certif') ? 'GraduationCap' : 'CheckCircle2';
  if (category === 'credits') return t.includes('invoice') || t.includes('receipt') ? 'Receipt' : 'Zap';
  if (category === 'connectors') return 'Unlink';
  if (t.includes('pause')) return 'PauseCircle';
  if (t.includes('lead') || t.includes('enrich')) return 'Users';
  if (t.includes('competitor') || t.includes('radar')) return 'Radar';
  return 'Bell';
}

function toUiNotification(n: NotificationDto, index: number): UiNotification {
  const category = inferCategory(n);
  const title = String(n.title || n.message || n.type || 'Notification');
  const subtitle = String(n.subtitle || (n.title ? n.message : '') || n.type || 'System update');
  const timestamp = String(n.timestamp || n.time || n.created_at || 'Just now');
  const severity = n.severity || (String(n.type || '').includes('critical') ? 'critical' : 'normal');
  return {
    id: String(n.id ?? `${category}-${index}`),
    title,
    subtitle,
    timestamp,
    category,
    unread: n.unread ?? (n.read === undefined ? true : !n.read),
    avatarIcon: inferIcon(category, n),
    severity,
    actionUrl: n.actionUrl || n.action_url || undefined,
  };
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<UiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<UICategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getNotificationsApi();
        if (cancelled) return;
        setNotifications(Array.isArray(data) ? data.map(toUiNotification) : []);
      } catch {
        if (!cancelled) toast.error('Failed to load notifications');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live WebSocket for alerts & real-time system broadcasts
  useWebSocketTopic<{ event_type?: string }>('notifications', () => {
    getNotificationsApi().then((data) => {
      setNotifications(Array.isArray(data) ? data.map(toUiNotification) : []);
    });
  });

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = async () => {
    const unread = notifications.filter((n) => n.unread);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    await Promise.allSettled(unread.map((n) => markNotificationReadApi(n.id)));
    toast.success('All notifications marked as read');
  };

  const markSingleAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    try {
      await markNotificationReadApi(id);
    } catch {
      // best-effort; local state already updated
    }
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification cleared');
  };

  const filteredNotifications = useMemo(() => {
    return notifications
      .filter((item) => {
        if (activeTab === 'unread') return item.unread;
        if (activeTab !== 'all') return item.category === activeTab;
        return true;
      })
      .filter((item) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      });
  }, [notifications, activeTab, searchQuery]);

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant shadow-2xs transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-secondary group-hover:text-on-surface group-hover:-translate-x-0.5 transition-transform" />
            <span>Back</span>
          </button>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider text-outline">Overview</span>
            <span className="text-outline-variant">/</span>
            <span className="font-bold uppercase tracking-wider text-primary">Notifications</span>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-secondary">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Real-time sync operational</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Notifications</h1>
          <p className="text-sm text-secondary mt-1">
            Real-time automation alerts, quota thresholds, connector health, and approval gates.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="h-9 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-xs font-semibold flex items-center gap-2 shadow-sm hover:bg-surface-container-lowest disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <CheckCheck className="w-4 h-4 text-primary" />
            <span>Mark all as read</span>
          </button>
          <Link
            href="/settings#notifications"
            className="h-9 px-3.5 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-xs font-semibold flex items-center gap-2 shadow-sm hover:bg-surface-container-lowest transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-secondary" />
            <span>Preferences</span>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(['all', 'unread', 'approvals', 'credits', 'connectors', 'system'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm capitalize ${
                activeTab === tab
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-outline-variant'
              }`}
            >
              {tab === 'unread' ? (
                <span className="inline-flex items-center gap-1.5">
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center font-bold ${activeTab === 'unread' ? 'bg-surface-container-lowest/20 text-white' : 'bg-primary text-white'}`}>
                      {unreadCount}
                    </span>
                  )}
                </span>
              ) : tab}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts..."
            className="w-full h-8 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-secondary">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            title="No notifications found"
            description="You are completely caught up! We will ping you when an autonomous agent requires action or input."
            icon={<Bell className="w-8 h-8 text-outline" />}
          />
        ) : (
          <div className="divide-y divide-surface-container">
            {filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => { void markSingleAsRead(notif.id); }}
                className={`p-4 flex items-start justify-between gap-4 transition-colors cursor-pointer group ${
                  notif.unread ? 'bg-surface-container-low/40 hover:bg-surface-container-low/70' : 'bg-surface-container-lowest hover:bg-surface-container-lowest'
                }`}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      notif.severity === 'critical'
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : notif.severity === 'warning'
                        ? 'bg-amber-50 border-amber-200 text-amber-600'
                        : 'bg-surface-container-low border-primary text-primary'
                    }`}
                  >
                    {categoryIcons[notif.avatarIcon] || <Bell className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm truncate ${notif.unread ? 'font-bold text-on-surface' : 'font-medium text-on-surface'}`}>
                        {notif.title}
                      </h4>
                      {notif.unread && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider">
                        {notif.category}
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant line-clamp-1">{notif.subtitle}</p>

                    <div className="flex items-center gap-3 text-[11px] text-outline">
                      <span>{notif.timestamp}</span>
                      {notif.severity === 'critical' && <span className="text-rose-600 font-semibold">• High Priority Action</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-center">
                  {notif.actionUrl && (
                    <Link
                      href={notif.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 rounded bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:text-primary hover:border-primary text-xs font-medium transition-colors flex items-center gap-1 shadow-xs"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                  <button
                    onClick={(e) => deleteNotification(notif.id, e)}
                    className="p-1.5 text-outline hover:text-rose-600 hover:bg-surface-container-low rounded transition-colors"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
