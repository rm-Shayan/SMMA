'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Search,
    Filter,
    Calendar,
    RotateCcw,
    ChevronRight,
    X,
    Copy,
    Download,
    Bot,
    CheckCircle2,
    ArrowRight,
    Activity,
    UserCheck,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { initialAuditEvents, AuditEvent } from '@/mocks/auditLogData';
import { EmptyState } from '@/components/shared/EmptyState';
import { useGetAuditLogsQuery } from '@/redux/api/auditApi';
import { useWebSocketTopic } from '@/shared/hooks/useWebSocketTopic';

export default function AuditLogPage() {
    const router = useRouter();
    const { data: auditData, isLoading: isAuditLoading, refetch } = useGetAuditLogsQuery({ limit: 100 });

    useWebSocketTopic("all", () => {
        void refetch();
    });

    const liveEvents = React.useMemo<AuditEvent[]>(() => {
        if (!auditData?.auditLogs || auditData.auditLogs.length === 0) {
            return initialAuditEvents;
        }
        return auditData.auditLogs.map((log) => ({
            id: log.id.slice(0, 8).toUpperCase(),
            timestamp: new Date(log.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
            actor: {
                name: log.user_id ? `User ${log.user_id.slice(0, 8)}` : 'System Service',
                role: log.user_id ? 'Authenticated User' : 'Core Automation',
                isAi: !log.user_id,
            },
            action: (log.action.charAt(0).toUpperCase() + log.action.slice(1)) as AuditEvent['action'],
            target: `${log.entity}${log.entity_id ? ` (${log.entity_id.slice(0, 8)})` : ''}`,
            details: log.meta ? JSON.stringify(log.meta) : `Audit logged for ${log.action} on ${log.entity}`,
            ipAddress: (log.meta?.ip as string) || '127.0.0.1',
            location: 'Company Tenant',
            status: '200 OK',
            userAgent: (log.meta?.user_agent as string) || 'Styre Bot Internal',
            rawPayload: (log.meta as Record<string, unknown>) || { id: log.id, action: log.action, entity: log.entity },
        }));
    }, [auditData]);

    const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
    const [actionFilter, setActionFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('7d');
    const [searchQuery, setSearchQuery] = useState('');

    const currentSelected = selectedEvent || liveEvents[0] || null;

    const filteredEvents = liveEvents.filter((evt) => {
        if (actionFilter !== 'ALL' && evt.action !== actionFilter) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchActor = evt.actor.name.toLowerCase().includes(q);
            const matchTarget = evt.target.toLowerCase().includes(q);
            const matchDetails = evt.details.toLowerCase().includes(q);
            const matchIp = evt.ipAddress.toLowerCase().includes(q);
            const matchId = evt.id.toLowerCase().includes(q);
            if (!matchActor && !matchTarget && !matchDetails && !matchIp && !matchId) return false;
        }
        return true;
    });

    const handleCopyJson = (payload: Record<string, unknown>) => {
        navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        toast.success('Event payload copied to clipboard');
    };

    const getActionBadgeColor = (action: string) => {
        switch (action) {
            case 'Approved':
                return 'bg-emerald-100 text-emerald-800';
            case 'Created':
                return 'bg-teal-100 text-teal-800';
            case 'Updated':
                return 'bg-primary-fixed text-primary';
            case 'Impersonation':
                return 'bg-amber-100 text-amber-800';
            case 'Revoked':
            case 'Deleted':
                return 'bg-rose-100 text-rose-800';
            case 'Exported':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-surface-container-low text-on-surface';
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* Category Eyebrow */}
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
                        <span className="font-semibold uppercase tracking-wider text-outline">Security & Compliance</span>
                        <span className="text-outline-variant">/</span>
                        <span className="font-bold uppercase tracking-wider text-primary">Audit Log</span>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-secondary">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span>Live tamper-evident stream</span>
                </div>
            </div>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-on-surface">Audit Log</h1>
                    <p className="text-sm text-secondary mt-1">
                        Tamper-evident record of all security, workforce, credit, and administrative events.
                    </p>
                </div>
                <button
                    onClick={() => toast.success('Exporting full audit trail to CSV...')}
                    className="h-9 px-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-on-surface-variant text-xs font-semibold flex items-center gap-2 shadow-sm hover:bg-surface-container-lowest transition-all self-start md:self-auto"
                >
                    <Download className="w-4 h-4 text-secondary" />
                    <span>Export Audit Trail</span>
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-surface-container-low text-primary flex items-center justify-center shrink-0">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-outline uppercase tracking-wider">Total Recorded Events</span>
                        <div className="text-2xl font-bold text-on-surface mt-0.5">14,892</div>
                        <span className="text-[11px] text-emerald-600 font-medium">100% cryptographic integrity</span>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-outline uppercase tracking-wider">Impersonation Sessions</span>
                        <div className="text-2xl font-bold text-on-surface mt-0.5">3</div>
                        <span className="text-[11px] text-secondary font-medium">Authorized by SuperAdmin</span>
                    </div>
                </div>

                <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-outline uppercase tracking-wider">Security Anomalies</span>
                        <div className="text-2xl font-bold text-on-surface mt-0.5">0</div>
                        <span className="text-[11px] text-emerald-600 font-medium">All sessions verified</span>
                    </div>
                </div>
            </div>

            {/* Filter Toolbar */}
            <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search events, actors, targets, IP..."
                        className="w-full h-9 pl-9 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto overflow-x-auto">
                    <div className="flex items-center gap-1.5">
                        <Filter className="w-3.5 h-3.5 text-outline" />
                        <select
                            value={actionFilter}
                            onChange={(e) => setActionFilter(e.target.value)}
                            className="h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface-variant font-medium focus:outline-none focus:border-primary"
                        >
                            <option value="ALL">All Actions</option>
                            <option value="Updated">Updated</option>
                            <option value="Approved">Approved</option>
                            <option value="Impersonation">Impersonation</option>
                            <option value="Created">Created</option>
                            <option value="Revoked">Revoked</option>
                            <option value="Exported">Exported</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-outline" />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface-variant font-medium focus:outline-none focus:border-primary"
                        >
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            refetch();
                            toast.success('Audit stream refreshed');
                        }}
                        disabled={isAuditLoading}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-secondary border border-outline-variant transition-colors disabled:opacity-50"
                        title="Refresh Stream"
                    >
                        <RefreshCw className={`w-4 h-4 ${isAuditLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <button
                        onClick={() => {
                            setActionFilter('ALL');
                            setDateFilter('7d');
                            setSearchQuery('');
                            toast.success('Filters reset');
                        }}
                        className="h-9 w-9 flex items-center justify-center rounded-lg bg-surface-container-lowest hover:bg-surface-container-low text-secondary border border-outline-variant transition-colors"
                        title="Reset Filters"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Main Content Area: Table + Detail Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Table column */}
                <div className={`${selectedEvent ? 'lg:col-span-7' : 'lg:col-span-12'} bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden`}>
                    <div className="p-4 border-b border-surface-container flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold text-on-surface">Activity Stream</h2>
                            <span className="px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant text-[10px] font-semibold">
                                {filteredEvents.length} events
                            </span>
                        </div>
                        <span className="text-xs text-outline font-medium">Click a row to inspect payload</span>
                    </div>

                    {filteredEvents.length === 0 ? (
                        <EmptyState
                            title="No events match your criteria"
                            description="Try adjusting your filter options or search term."
                        />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="bg-surface-container-lowest border-b border-outline-variant text-secondary uppercase tracking-wider font-semibold">
                                        <th className="py-2.5 px-4">Timestamp</th>
                                        <th className="py-2.5 px-3">Actor</th>
                                        <th className="py-2.5 px-3">Action</th>
                                        <th className="py-2.5 px-3">Target</th>
                                        <th className="py-2.5 px-3">Details</th>
                                        <th className="py-2.5 px-3">IP</th>
                                        <th className="py-2.5 px-2 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container text-on-surface-variant">
                                    {filteredEvents.map((evt) => {
                                        const isSelected = selectedEvent?.id === evt.id;
                                        return (
                                            <tr
                                                key={evt.id}
                                                onClick={() => setSelectedEvent(evt)}
                                                className={`cursor-pointer transition-colors group ${isSelected
                                                        ? 'bg-surface-container-low/70'
                                                        : 'hover:bg-surface-container-lowest'
                                                    }`}
                                            >
                                                <td className="py-3 px-4 whitespace-nowrap text-secondary font-medium">
                                                    {evt.timestamp}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {evt.actor.isAi ? (
                                                            <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                                                                <Bot className="w-3.5 h-3.5" />
                                                            </div>
                                                        ) : evt.actor.avatar ? (
                                                            <Image
                                                                src={evt.actor.avatar}
                                                                alt={evt.actor.name}
                                                                width={24}
                                                                height={24}
                                                                className="w-6 h-6 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-6 h-6 rounded-full bg-inverse-surface text-white flex items-center justify-center text-[10px] font-bold">
                                                                {evt.actor.initials || 'AD'}
                                                            </div>
                                                        )}
                                                        <span className="font-semibold text-on-surface truncate max-w-[120px]">
                                                            {evt.actor.name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionBadgeColor(
                                                            evt.action
                                                        )}`}
                                                    >
                                                        {evt.action}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap font-medium text-on-surface truncate max-w-[130px]">
                                                    {evt.target}
                                                </td>
                                                <td className="py-3 px-3 text-secondary truncate max-w-[180px]">
                                                    {evt.details}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap font-mono text-[11px] text-outline">
                                                    {evt.ipAddress}
                                                </td>
                                                <td className="py-3 px-2 text-right">
                                                    <ChevronRight
                                                        className={`w-4 h-4 transition-transform ${isSelected ? 'text-primary rotate-90' : 'text-outline-variant group-hover:text-on-surface-variant'
                                                            }`}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Drawer column */}
                {selectedEvent && (
                    <div className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm p-5 space-y-5 sticky top-20">
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between border-b border-surface-container pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-on-surface">{selectedEvent.id}</span>
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                        {selectedEvent.status}
                                    </span>
                                </div>
                                <p className="text-[11px] text-outline mt-0.5">{selectedEvent.timestamp}</p>
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => handleCopyJson(selectedEvent.rawPayload)}
                                    className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                    title="Copy JSON Payload"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setSelectedEvent(null)}
                                    className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-container-low transition-colors"
                                    title="Close Details"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Actor Details */}
                        <div className="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Security Context</span>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    {selectedEvent.actor.avatar ? (
                                        <Image
                                            src={selectedEvent.actor.avatar}
                                            alt={selectedEvent.actor.name}
                                            width={32}
                                            height={32}
                                            className="w-8 h-8 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-inverse-surface text-white flex items-center justify-center text-xs font-bold">
                                            {selectedEvent.actor.initials || 'A'}
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-xs font-bold text-on-surface">{selectedEvent.actor.name}</h4>
                                        <span className="text-[10px] text-secondary">{selectedEvent.actor.role}</span>
                                    </div>
                                </div>
                                <span className="text-[11px] font-mono text-secondary">{selectedEvent.ipAddress}</span>
                            </div>
                            <div className="text-[11px] text-outline border-t border-outline-variant/60 pt-2">
                                Origin: <strong className="text-on-surface-variant">{selectedEvent.location}</strong> • Client: {selectedEvent.userAgent.slice(0, 36)}...
                            </div>
                        </div>

                        {/* Action & Target */}
                        <div className="space-y-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Action & Target</span>
                            <div className="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/60 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getActionBadgeColor(
                                            selectedEvent.action
                                        )}`}
                                    >
                                        {selectedEvent.action}
                                    </span>
                                    <span className="text-xs font-semibold text-on-surface">{selectedEvent.target}</span>
                                </div>
                                <p className="text-xs text-on-surface-variant">{selectedEvent.details}</p>
                            </div>
                        </div>

                        {/* Audit Change Diff */}
                        {selectedEvent.changesDiff && selectedEvent.changesDiff.length > 0 && (
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Attribute Changes</span>
                                <div className="space-y-1.5">
                                    {selectedEvent.changesDiff.map((diff, idx) => (
                                        <div
                                            key={idx}
                                            className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/60 text-xs flex items-center justify-between font-mono"
                                        >
                                            <span className="text-on-surface-variant">{diff.field}</span>
                                            <div className="flex items-center gap-1.5 text-[11px]">
                                                <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 line-through">
                                                    {diff.before}
                                                </span>
                                                <ArrowRight className="w-3 h-3 text-outline" />
                                                <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                                                    {diff.after}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Raw JSON Payload */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Raw Event Payload</span>
                                <span className="text-[10px] text-outline font-mono">application/json</span>
                            </div>
                            <pre className="p-3 rounded-lg bg-inverse-surface text-inverse-on-surface/80 text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed">
                                {JSON.stringify(selectedEvent.rawPayload, null, 2)}
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
