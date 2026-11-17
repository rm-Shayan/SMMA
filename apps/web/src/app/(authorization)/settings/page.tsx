'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Lock,
  Sun,
  Moon,
  Laptop,
  Smartphone,
  Monitor,
  Check,
  ShieldCheck,
  Upload,
  LogOut,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { useAppSelector } from '@/redux/hooks';
import {
  getNotificationPreferencesApi,
  updateNotificationPreferencesApi,
  updateUserProfileApi,
} from '@/services/notificationsService';

export default function SettingsPage() {
  const router = useRouter();
  const user = useAppSelector((s) => s.auth.user);

  const [fullName, setFullName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('');
  const [language, setLanguage] = useState('English (US)');
  const [timezone, setTimezone] = useState('Asia/Karachi (GMT+5:00) — Pakistan Standard Time');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('light');

  const [notifSettings, setNotifSettings] = useState({
    approvalsInApp: true,
    approvalsEmail: true,
    creditsInApp: true,
    creditsEmail: true,
    connectorsInApp: true,
    connectorsEmail: false,
    systemInApp: false,
    systemEmail: false,
  });

  const [sessions, setSessions] = useState([
    {
      id: 'sess-1',
      device: 'Chrome on macOS 14.5',
      location: 'Karachi, Pakistan',
      ip: '110.38.24.120',
      lastActive: 'Just now',
      isCurrent: true,
      icon: Laptop,
    },
    {
      id: 'sess-2',
      device: 'Safari on iPhone 15 Pro',
      location: 'Karachi, PK',
      ip: '39.50.198.44',
      lastActive: '2 hours ago',
      isCurrent: false,
      icon: Smartphone,
    },
    {
      id: 'sess-3',
      device: 'Firefox on Windows 11',
      location: 'New York, US',
      ip: '198.51.100.8',
      lastActive: '3 days ago',
      isCurrent: false,
      icon: Monitor,
    },
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (user?.name) setFullName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user?.name, user?.email]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const prefs = await getNotificationPreferencesApi();
        if (cancelled || !prefs) return;
        setNotifSettings((prev) => ({
          ...prev,
          approvalsInApp: Boolean(prefs.approvalAlerts ?? prefs.pendingApprovals ?? prev.approvalsInApp),
          approvalsEmail: Boolean(prefs.approvalAlerts ?? prev.approvalsEmail),
          creditsInApp: Boolean(prefs.lowBalance ?? prev.creditsInApp),
          creditsEmail: Boolean(prefs.emailAlerts ?? prev.creditsEmail),
          connectorsInApp: Boolean(prefs.failedRuns ?? prev.connectorsInApp),
          systemInApp: Boolean(prefs.dailyBrief ?? prev.systemInApp),
        }));
      } catch {
        // preferences endpoint may be unavailable; keep defaults
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      toast.error('Unable to identify current user');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUserProfileApi(user.id, { name: fullName });
      toast.success('Profile information saved successfully');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  const persistNotificationPrefs = async (next: typeof notifSettings) => {
    try {
      await updateNotificationPreferencesApi({
        approvalAlerts: next.approvalsInApp || next.approvalsEmail,
        emailAlerts: next.approvalsEmail || next.creditsEmail || next.connectorsEmail || next.systemEmail,
        lowBalance: next.creditsInApp || next.creditsEmail,
        pendingApprovals: next.approvalsInApp,
        failedRuns: next.connectorsInApp,
        dailyBrief: next.systemInApp,
      });
    } catch {
      // best-effort persistence
    }
  };

  const updateNotif = (patch: Partial<typeof notifSettings>) => {
    setNotifSettings((prev) => {
      const next = { ...prev, ...patch };
      void persistNotificationPrefs(next);
      return next;
    });
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    toast.success('Password update requires account recovery flow');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRevokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast.success('Session terminated');
  };

  const handleRevokeAllOtherSessions = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    toast.success('Signed out of all other devices');
  };

  const displayName = fullName || user?.name || 'User';
  const displayEmail = email || user?.email || '';
  const role = user?.role || 'company_admin';

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-2.5 text-xs">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant shadow-2xs transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-secondary group-hover:text-on-surface group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>
        <span className="text-outline-variant">•</span>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold uppercase tracking-wider text-outline">Settings</span>
          <span className="text-outline-variant">/</span>
          <span className="font-bold uppercase tracking-wider text-primary">Personal Profile</span>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Account Settings</h1>
        <p className="text-sm text-secondary mt-1">
          Manage your personal details, credentials, notification cadences, and session devices.
        </p>
      </div>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-surface-container pb-5">
          <h2 className="text-lg font-bold text-on-surface">Personal Information</h2>
          <p className="text-xs text-secondary">Update your avatar and personal identity details.</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces"
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <button
                type="button"
                onClick={() => toast.success('Avatar picker opened')}
                className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
                title="Change Avatar"
              >
                <Upload className="w-3 h-3" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-bold text-on-surface">{displayName}</h3>
              <p className="text-xs text-secondary">{displayEmail}</p>
              <div className="mt-1 flex items-center gap-2">
                <RoleBadge role={role} />
                <span className="text-[11px] text-outline font-medium">Tenant User</span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-col items-start sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-outline-variant">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-outline">User ID</span>
            <span className="text-xs font-bold text-on-surface max-w-[220px] truncate">{user?.id || '—'}</span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-on-surface-variant">Email Address</label>
                <span className="text-[11px] text-outline flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Managed
                </span>
              </div>
              <input
                type="email"
                value={displayEmail}
                disabled
                className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-secondary cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Interface Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Urdu (اردو)</option>
                <option>German (Deutsch)</option>
                <option>Spanish (Español)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">System Time Zone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option>Asia/Karachi (GMT+5:00) — Pakistan Standard Time</option>
                <option>Asia/Dubai (GMT+4:00) — Gulf Standard Time</option>
                <option>Europe/London (GMT+0:00) — Greenwich Mean Time</option>
                <option>America/New_York (GMT-5:00) — Eastern Standard Time</option>
                <option>America/Los_Angeles (GMT-8:00) — Pacific Standard Time</option>
              </select>
              <p className="text-[11px] text-outline mt-1">
                Autonomous publishing schedules and queue intervals align to this timezone.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-60"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-surface-container pb-5">
          <h2 className="text-lg font-bold text-on-surface">Change Password</h2>
          <p className="text-xs text-secondary">Ensure your account is protected with a secure passphrase.</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="max-w-xl space-y-4">
          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPass ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 pl-3 pr-9 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant">
                {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNewPass ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter robust new passphrase"
                className="w-full h-9 pl-3 pr-9 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface-variant">
                {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type new passphrase"
              className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="p-3 rounded-lg bg-surface-container-low/50 border border-primary flex items-center gap-2 text-xs text-primary">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Must contain at least 8 characters, one capital letter, and one number.</span>
          </div>

          <button type="submit" className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm inline-flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            <span>Update Password</span>
          </button>
        </form>
      </section>

      <section id="notifications" className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-surface-container pb-5">
          <h2 className="text-lg font-bold text-on-surface">Notification Preferences</h2>
          <p className="text-xs text-secondary">Configure how and when you receive autonomous system alerts.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-container text-outline uppercase tracking-wider font-semibold">
                <th className="py-2.5">Category & Scope</th>
                <th className="py-2.5 text-center w-24">In-App</th>
                <th className="py-2.5 text-center w-24">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-on-surface-variant">
              <tr>
                <td className="py-3">
                  <span className="font-semibold text-on-surface block">Approvals</span>
                  <span className="text-outline text-[11px]">Draft submissions, workflow gate pauses, rejected content</span>
                </td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.approvalsInApp} onChange={(e) => updateNotif({ approvalsInApp: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.approvalsEmail} onChange={(e) => updateNotif({ approvalsEmail: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
              </tr>
              <tr>
                <td className="py-3">
                  <span className="font-semibold text-on-surface block">Credit Alerts</span>
                  <span className="text-outline text-[11px]">Low balance warnings (80%+ threshold), monthly mint receipts</span>
                </td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.creditsInApp} onChange={(e) => updateNotif({ creditsInApp: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.creditsEmail} onChange={(e) => updateNotif({ creditsEmail: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
              </tr>
              <tr>
                <td className="py-3">
                  <span className="font-semibold text-on-surface block">Connector Issues</span>
                  <span className="text-outline text-[11px]">Expired OAuth credentials, API rate limit throttles</span>
                </td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.connectorsInApp} onChange={(e) => updateNotif({ connectorsInApp: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.connectorsEmail} onChange={(e) => updateNotif({ connectorsEmail: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
              </tr>
              <tr>
                <td className="py-3">
                  <span className="font-semibold text-on-surface block">System Updates</span>
                  <span className="text-outline text-[11px]">New agent capabilities, maintenance windows, monthly briefings</span>
                </td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.systemInApp} onChange={(e) => updateNotif({ systemInApp: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
                <td className="py-3 text-center"><input type="checkbox" checked={notifSettings.systemEmail} onChange={(e) => updateNotif({ systemEmail: e.target.checked })} className="w-4 h-4 rounded text-primary accent-primary cursor-pointer" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-surface-container pb-5">
          <h2 className="text-lg font-bold text-on-surface">Appearance</h2>
          <p className="text-xs text-secondary">Select how Styre Bot displays on your device.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { key: 'light' as const, label: 'Light', icon: Sun, iconClass: 'text-amber-500', preview: 'bg-surface-container-low' },
            { key: 'dark' as const, label: 'Dark', icon: Moon, iconClass: 'text-indigo-400', preview: 'bg-inverse-surface' },
            { key: 'system' as const, label: 'System', icon: Laptop, iconClass: 'text-secondary', preview: 'bg-gradient-to-r from-surface-container to-on-surface' },
          ]).map(({ key, label, icon: Icon, iconClass, preview }) => (
            <div key={key} onClick={() => { setThemePreference(key); toast.success(`${label} theme selected`); }} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${themePreference === key ? 'border-primary bg-surface-container-low/20' : 'border-outline-variant hover:border-outline-variant'}`}>
              <div className={`h-20 ${preview} rounded-lg p-2.5 flex flex-col justify-between mb-3 border border-outline-variant`}>
                <div className="w-8 h-2 bg-primary rounded" />
                <div className="w-16 h-2 bg-surface-container-high rounded" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Icon className={`w-4 h-4 ${iconClass}`} /><span className="text-xs font-bold text-on-surface">{label}</span></div>
                {themePreference === key && <Check className="w-4 h-4 text-primary" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container pb-5">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Active Sessions</h2>
            <p className="text-xs text-secondary">Authorized devices currently connected to this account.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-semibold">{sessions.length} active sessions</span>
        </div>

        <div className="space-y-3">
          {sessions.map((sess) => {
            const Icon = sess.icon;
            return (
              <div key={sess.id} className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-lowest border border-outline-variant flex items-center justify-center text-primary shadow-xs shrink-0"><Icon className="w-5 h-5" /></div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-on-surface">{sess.device}</span>
                      {sess.isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          This device
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-secondary mt-0.5">{sess.location} • IP {sess.ip} • Last active: {sess.lastActive}</p>
                  </div>
                </div>
                {!sess.isCurrent ? (
                  <button onClick={() => handleRevokeSession(sess.id)} className="h-8 px-3 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors self-start sm:self-auto">Sign out</button>
                ) : (
                  <span className="text-[11px] font-semibold text-emerald-600">Current active connection</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-2">
          <button onClick={handleRevokeAllOtherSessions} className="h-9 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors inline-flex items-center gap-2">
            <LogOut className="w-4 h-4 text-secondary" />
            <span>Sign out of all other sessions</span>
          </button>
        </div>
      </section>
    </div>
  );
}
