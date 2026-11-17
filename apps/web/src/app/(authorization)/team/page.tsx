'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
    Users,
    UserPlus,
    Search,
    Filter,
    Mail,
    Activity,
    Zap,
    X,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { RoleBadge } from '@/components/shared/RoleBadge';
import { StatusPill } from '@/components/shared/StatusPill';
import { useCreateInviteMutation } from '@/redux/api/authApi';
import { useGetTeamsQuery, useGetUsersQuery, type UserRow } from '@/redux/api/teamApi';
import { ApiError } from '@/services/api';
import { useWebSocketTopic } from '@/shared/hooks/useWebSocketTopic';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'company_admin' | 'manager' | 'employee';
    lastActive: string;
    status: 'active' | 'invited' | 'suspended' | 'inactive';
    initials: string;
}

function toTeamMember(user: UserRow): TeamMember {
    const name = user.name?.trim() || user.email;
    const role = ['super_admin', 'company_admin', 'manager', 'employee'].includes(user.role)
        ? (user.role as TeamMember['role'])
        : 'employee';
    const status = user.status === 'invited'
        ? 'invited'
        : user.status === 'suspended'
            ? 'suspended'
            : user.status === 'inactive'
                ? 'inactive'
                : 'active';
    return {
        id: user.id,
        name,
        email: user.email,
        role,
        lastActive: user.created_at && !Number.isNaN(Date.parse(user.created_at))
            ? new Date(user.created_at).toLocaleDateString()
            : 'Not available',
        status,
        initials: name.split(/\s+/).map((part) => part[0] ?? '').join('').toUpperCase().slice(0, 2),
    };
}

export default function TeamPage() {
    const { data: usersResponse, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useGetUsersQuery();
    const { data: teamsResponse, isLoading: teamsLoading, error: teamsError, refetch: refetchTeams } = useGetTeamsQuery();
    const [pendingInvites, setPendingInvites] = useState<TeamMember[]>([]);

    useWebSocketTopic("all", () => {
        void refetchUsers();
        void refetchTeams();
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    // Invite form state
    const [inviteName, setInviteName] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'manager' | 'employee'>('employee');

    const [createInvite, { isLoading: inviteSending }] = useCreateInviteMutation();

    const users = usersResponse?.users ?? [];
    const members = [
        ...users
            .filter((user) => !pendingInvites.some((invite) => invite.email.toLowerCase() === user.email.toLowerCase()))
            .map(toTeamMember),
        ...pendingInvites,
    ];
    const teams = teamsResponse?.teams ?? [];

    const filteredMembers = members.filter((m) => {
        if (roleFilter !== 'ALL' && m.role !== roleFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                m.name.toLowerCase().includes(q) ||
                m.email.toLowerCase().includes(q)
            );
        }
        return true;
    });

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteName || !inviteEmail) {
            toast.error('Please enter name and email');
            return;
        }

        try {
            // Real invite: POST /auth/invites (role must be manager/employee here).
            const res = await createInvite({ email: inviteEmail, role: inviteRole }).unwrap();

            const pendingInvite: TeamMember = {
                id: `invite-${inviteEmail.toLowerCase()}`,
                name: inviteName,
                email: inviteEmail,
                role: inviteRole,
                lastActive: 'Never',
                status: 'invited',
                initials: inviteName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2),
            };

            setPendingInvites((previous) => [
                pendingInvite,
                ...previous.filter((member) => member.email.toLowerCase() !== inviteEmail.toLowerCase()),
            ]);
            await refetchUsers();
            toast.success(`Invitation dispatched to ${inviteEmail}`);
            // Dev mode: the API returns the invite link (no SMTP yet) — surface it so
            // the flow can be tested end-to-end (accept → set password → login).
            if (res.invite?.url) {
                console.info('Invite link:', res.invite.url);
            }
            setIsInviteOpen(false);
            setInviteName('');
            setInviteEmail('');
        } catch (err) {
            const apiErr = err as ApiError;
            toast.error(apiErr?.message || 'Could not send the invitation. Please try again.');
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Category Eyebrow */}
            <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold uppercase tracking-wider text-outline">Administration</span>
                <span className="text-outline-variant">/</span>
                <span className="font-bold uppercase tracking-wider text-primary">Team Management</span>
            </div>

            {/* Header */}
            <PageHeader
                title="Team & Access Control"
                description="Manage workspace members, access roles, invitations, and configured teams."
                actions={
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span>Invite Member</span>
                    </button>
                }
            />

            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-outline uppercase tracking-wider">Total Seats</span>
                        <div className="text-2xl font-bold text-on-surface mt-0.5">{usersLoading ? '—' : members.length}</div>
                        <span className="text-[11px] text-secondary font-medium">{teams.length} teams</span>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-outline uppercase tracking-wider">Active Members</span>
                        <div className="text-2xl font-bold text-on-surface mt-0.5">
                            {members.filter((m) => m.status === 'active').length}
                        </div>
                        <span className="text-[11px] text-emerald-600 font-medium">From workspace directory</span>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-outline uppercase tracking-wider">Teams</span>
                        <div className="text-2xl font-bold text-on-surface mt-0.5">{teamsLoading ? '—' : teams.length}</div>
                        <span className="text-[11px] text-secondary font-medium">Configured teams</span>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                        <Mail className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-outline uppercase tracking-wider">Pending Invites</span>
                        <div className="text-2xl font-bold text-on-surface mt-0.5">
                            {members.filter((m) => m.status === 'invited').length}
                        </div>
                        <span className="text-[11px] text-secondary font-medium">Awaiting acceptance</span>
                    </div>
                </div>
            </div>

            {(usersError || teamsError) && (
                <div role="alert" className="rounded-xl border border-error/30 bg-error-container/30 p-4 text-sm text-on-surface">
                    <p>Could not load all team data.</p>
                    <button
                        type="button"
                        onClick={() => {
                            void refetchUsers();
                            void refetchTeams();
                        }}
                        className="mt-2 font-semibold text-primary hover:underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-sm font-bold text-on-surface">Workspace teams</h2>
                        <p className="mt-0.5 text-xs text-secondary">Teams configured for this company.</p>
                    </div>
                    <span className="text-xs font-semibold text-secondary">{teamsLoading ? 'Loading…' : `${teams.length} teams`}</span>
                </div>
                {teamsError ? (
                    <p className="mt-4 text-sm text-secondary">Team list is unavailable. Use Retry above to try again.</p>
                ) : teamsLoading ? (
                    <p className="mt-4 text-sm text-secondary">Loading teams…</p>
                ) : teams.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {teams.map((team) => (
                            <span key={team.id} className="rounded-full bg-surface-container-low px-3 py-1.5 text-xs font-medium text-on-surface">
                                {team.name}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="mt-4 text-sm text-secondary">No teams have been created yet.</p>
                )}
            </section>

            {/* Filter Toolbar */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name or email..."
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto">
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-outline" />
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface-variant font-medium focus:outline-none focus:border-primary"
                        >
                            <option value="ALL">All Roles</option>
                            <option value="company_admin">Company Admin</option>
                            <option value="manager">Manager</option>
                            <option value="employee">Employee</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-surface-container-lowest border-b border-outline-variant text-secondary uppercase tracking-wider font-semibold">
                                <th className="py-3 px-4">Member</th>
                                <th className="py-3 px-3">Role</th>
                                <th className="py-3 px-3">Added</th>
                                <th className="py-3 px-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-container text-on-surface-variant">
                            {usersLoading ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-secondary">Loading workspace members…</td></tr>
                            ) : !usersError && filteredMembers.length === 0 ? (
                                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-secondary">No members match this filter.</td></tr>
                            ) : filteredMembers.map((member) => (
                                <tr key={member.id} className="hover:bg-surface-container-lowest transition-colors">
                                    <td className="py-3.5 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center shrink-0">
                                                {member.initials}
                                            </div>
                                            <div>
                                                <span className="font-bold text-on-surface block">{member.name}</span>
                                                <span className="text-[11px] text-secondary">{member.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3.5 px-3">
                                        <RoleBadge role={member.role} />
                                    </td>
                                    <td className="py-3.5 px-3 text-secondary font-medium">{member.lastActive}</td>
                                    <td className="py-3.5 px-3">
                                        <StatusPill
                                            variant={
                                                member.status === 'active'
                                                    ? 'active'
                                                    : member.status === 'invited'
                                                        ? 'draft'
                                                        : 'warning'
                                            }
                                            label={member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Member Dialog Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-[9999] bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
                    <div className="fixed inset-0 -z-10" onClick={() => setIsInviteOpen(false)} />
                    <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
                        <div className="p-5 border-b border-surface-container flex items-center justify-between shrink-0">
                            <div>
                                <h3 className="text-base font-bold text-on-surface">Invite Team Member</h3>
                                <p className="text-xs text-secondary mt-0.5">Send an onboarding invite to your agency workspace.</p>
                            </div>
                            <button
                                onClick={() => setIsInviteOpen(false)}
                                className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-container-low"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSendInvite} className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    placeholder="e.g. Fatima Noor"
                                    className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Work Email</label>
                                <input
                                    type="email"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="fatima@agency.com"
                                    className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Access Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value === 'manager' ? 'manager' : 'employee')}
                                    className="w-full h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="employee">Employee / Operator</option>
                                    <option value="manager">Manager / Pod Lead</option>
                                </select>
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteOpen(false)}
                                    className="h-9 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviteSending}
                                    className="h-9 px-4 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-semibold shadow-sm"
                                >
                                    {inviteSending ? 'Sending…' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
