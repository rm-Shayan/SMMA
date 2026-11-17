"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppSelector } from "@/redux/hooks";
import {
    useGetMetricsQuery,
    useGetDailyBriefsQuery,
    useGetSnapshotsQuery,
    type DailyBriefItemDto,
    type DailyBriefDto,
    type SnapshotMetricsDto,
    type AnalyticsSnapshotDto,
} from "@/redux/api/dashboardApi";
import { useWebSocketTopic } from "@/hooks/useWebSocketTopic";

export interface TacticalBriefItem {
    id: string;
    botTag: string;
    timestamp: string;
    title: string;
    impactTag: string;
    impactColor: "high" | "scheduled" | "opportunity";
    targetDetail: string;
    actionText: string;
}
import {
    Building2,
    Users,
    Bot,
    Flame,
    DollarSign,
    CheckCircle2,
    Plus,
    Clock,
    Sparkles,
    Shield,
    LogOut,
    Lock,
} from "lucide-react";
import {
    CartesianGrid,
    Legend,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import toast from "react-hot-toast";

type MetricFilter = "ALL" | "OUTREACH" | "PUBLISHING";

const METRIC_FILTERS: { key: MetricFilter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "OUTREACH", label: "Outreach" },
    { key: "PUBLISHING", label: "Publishing" },
];

interface BriefStyle {
    impactTag: string;
    impactColor: TacticalBriefItem["impactColor"];
    actionText: string;
}

const PRIORITY_STYLES: Record<string, BriefStyle> = {
    high: { impactTag: "High Impact", impactColor: "high", actionText: "Execute" },
    medium: { impactTag: "Scheduled", impactColor: "scheduled", actionText: "Review" },
    low: { impactTag: "Opportunity", impactColor: "opportunity", actionText: "Deploy" },
};

const AGENT_TAGS: Record<number, string> = {
    2: "CompetitorRadar",
    6: "OutreachBot",
    8: "ContentBot",
    9: "InboxBot",
    12: "SupervisorAI",
};

function parseBriefItems(items: DailyBriefDto["items"]): DailyBriefItemDto[] {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    try {
        const parsed: unknown = JSON.parse(items);
        return Array.isArray(parsed) ? (parsed as DailyBriefItemDto[]) : [];
    } catch {
        return [];
    }
}

function parseSnapshotMetrics(metrics: AnalyticsSnapshotDto["metrics"]): SnapshotMetricsDto {
    if (!metrics) return {};
    if (typeof metrics === "string") {
        try {
            const parsed: unknown = JSON.parse(metrics);
            return parsed && typeof parsed === "object" ? (parsed as SnapshotMetricsDto) : {};
        } catch {
            return {};
        }
    }
    return metrics;
}

function formatBriefDate(briefDate?: string | null): string {
    if (!briefDate) return "Today";
    const day = String(briefDate).slice(0, 10);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate(),
    ).padStart(2, "0")}`;
    if (day === today) return "Today";
    const parsed = new Date(`${day}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return day;
    return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSnapshotLabel(createdAt?: string | null): string {
    if (!createdAt) return "—";
    const parsed = new Date(createdAt);
    if (Number.isNaN(parsed.getTime())) return String(createdAt);
    return parsed.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function toBriefItem(
    item: DailyBriefItemDto,
    briefDate: string | null | undefined,
    index: number,
): TacticalBriefItem {
    const style =
        PRIORITY_STYLES[(item.priority ?? "medium").toLowerCase()] ?? PRIORITY_STYLES.medium;
    const agentId = item.suggestedAgentId;
    return {
        id: item.id ?? `brief-${index}`,
        botTag: agentId != null ? AGENT_TAGS[agentId] ?? `Agent-${agentId}` : "DailyBrief",
        timestamp: formatBriefDate(briefDate),
        title: item.title ?? "Tactical action pending",
        impactTag: style.impactTag,
        impactColor: style.impactColor,
        targetDetail: item.description ?? "Awaiting human sign-off",
        actionText: style.actionText,
    };
}

function formatKpiValue(card: { key: string; value: number | null }): string {
    if (card.value == null) return "—";
    if (card.key === "cost") return `$${card.value.toFixed(2)}`;
    return card.value.toLocaleString("en-US");
}

export default function DashboardPage() {
    const user = useAppSelector((state) => state.auth.user);
    const isSuperAdmin = user?.role === "SUPERADMIN";

    const [timeRange, setTimeRange] = useState<"7D" | "24H" | "30D">("7D");
    const [metricFilter, setMetricFilter] = useState<MetricFilter>("ALL");
    const [impersonating, setImpersonating] = useState(false);
    const [dismissedBriefs, setDismissedBriefs] = useState<string[]>([]);

    const displayName = user?.name || "Admin";
    const workspaceName = "Styre Tech Platform";

    // 20.1 — KPI summary cards ← GET /api/v1/admin/metrics (super_admin only)
    const {
        data: metricsData,
        isLoading: metricsLoading,
        error: metricsError,
        refetch: refetchMetrics,
    } = useGetMetricsQuery();
    const metrics = metricsData?.metrics;
    const metricsStatus = (metricsError as { status?: number } | undefined)?.status;

    // 20.2 — Tactical Action Briefs ← GET /api/v1/orchestration/daily-briefs
    const {
        data: briefsData,
        isLoading: briefsLoading,
        isError: briefsFailed,
        refetch: refetchBriefs,
    } = useGetDailyBriefsQuery({ limit: 5 });

    // 20.3 — Conversion Charts ← GET /api/v1/reporting/analytics/snapshots
    const {
        data: snapshotsData,
        isLoading: snapshotsLoading,
        isError: snapshotsFailed,
        refetch: refetchSnapshots,
    } = useGetSnapshotsQuery({ limit: 30 });

    // Live tenant WebSocket fanout: instantly updates KPIs and conversion snapshots
    useWebSocketTopic<{ event_type?: string }>("all", () => {
        void refetchMetrics();
        void refetchBriefs();
        void refetchSnapshots();
    });

    const latestBrief = briefsData?.briefs?.[0];
    const briefItems = useMemo<TacticalBriefItem[]>(() => {
        if (!latestBrief) return [];
        return parseBriefItems(latestBrief.items)
            .map((item, index) => toBriefItem(item, latestBrief.brief_date, index))
            .filter((brief) => !dismissedBriefs.includes(brief.id));
    }, [latestBrief, dismissedBriefs]);

    const rangeMs =
        timeRange === "24H"
            ? 24 * 60 * 60 * 1000
            : timeRange === "7D"
                ? 7 * 24 * 60 * 60 * 1000
                : 30 * 24 * 60 * 60 * 1000;

    const chartData = useMemo(() => {
        const points = (snapshotsData?.snapshots ?? []).map((snapshot) => {
            const m = parseSnapshotMetrics(snapshot.metrics);
            const ts = snapshot.created_at ? new Date(snapshot.created_at).getTime() : Number.NaN;
            const totalRuns = m.totalRuns ?? 0;
            return {
                ts,
                label: formatSnapshotLabel(snapshot.created_at),
                conversion:
                    totalRuns > 0 ? Math.round(((m.completedRuns ?? 0) / totalRuns) * 1000) / 10 : 0,
                outreach: m.outreachSent ?? 0,
                queued: m.queuedOutbox ?? 0,
                published: m.socialPostsPublished ?? 0,
            };
        });

        // Anchor the range to the newest snapshot instead of Date.now()
        // (impure during render → fails react-hooks/purity lint).
        const newest = points.reduce(
            (max, point) => (Number.isFinite(point.ts) && point.ts > max ? point.ts : max),
            Number.NEGATIVE_INFINITY,
        );
        const cutoff = Number.isFinite(newest) ? newest - rangeMs : Number.NEGATIVE_INFINITY;

        return points
            .filter((point) => Number.isFinite(point.ts) && point.ts >= cutoff)
            .sort((a, b) => a.ts - b.ts);
    }, [snapshotsData, rangeMs]);

    const latestSnapshot = snapshotsData?.snapshots?.[0];
    const latestMetrics = useMemo<SnapshotMetricsDto | null>(
        () => (latestSnapshot ? parseSnapshotMetrics(latestSnapshot.metrics) : null),
        [latestSnapshot],
    );
    const totalRuns = latestMetrics?.totalRuns ?? 0;
    const conversionRate =
        totalRuns > 0
            ? (Math.round(((latestMetrics?.completedRuns ?? 0) / totalRuns) * 1000) / 10).toFixed(1)
            : "0.0";

    const kpiCards = [
        {
            key: "companies",
            label: "Total Companies",
            icon: Building2,
            iconClass: "text-primary",
            hint: "Registered tenant workspaces",
            footer: "Multi-tenant SaaS",
            value: metrics?.companies ?? null,
        },
        {
            key: "users",
            label: "Platform Users",
            icon: Users,
            iconClass: "text-primary",
            hint: "Accounts across all tenants",
            footer: "Admins, managers & employees",
            value: metrics?.users ?? null,
        },
        {
            key: "runs",
            label: "Agent Runs",
            icon: Bot,
            iconClass: "text-primary",
            hint: "Autonomous executions recorded",
            footer: "Completed + failed + queued",
            value: metrics?.runs ?? null,
        },
        {
            key: "credits",
            label: "Credits Burned",
            icon: Flame,
            iconClass: "text-amber-500",
            hint: "Total credits consumed",
            footer: "Across every agent run",
            value: metrics?.creditsBurned ?? null,
        },
        {
            key: "cost",
            label: "Estimated Cost",
            icon: DollarSign,
            iconClass: "text-emerald-600",
            hint: "LLM spend to date",
            footer: "USD · token usage",
            value: metrics?.costUsd ?? null,
        },
    ];

    const handleExecuteBrief = (id: string, title: string) => {
        toast.success(`Executed: ${title}`);
        setDismissedBriefs((prev) => (prev.includes(id) ? prev : [...prev, id]));
    };

    return (
        <div className="flex flex-col w-full max-w-[1560px] mx-auto space-y-6">
            {/* SuperAdmin Impersonation Banner (Screen #38) */}
            {impersonating && (
                <div className="w-full rounded-xl bg-amber-100 border border-amber-300 text-amber-950 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs animate-in fade-in duration-200">
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <Shield className="w-4 h-4 text-amber-700 shrink-0" />
                        <span className="text-xs font-bold text-amber-900">
                            You are viewing <span className="underline font-extrabold">Northwind Digital</span> as Super Admin
                        </span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-lowest/80 border border-amber-300 text-amber-900 text-[11px] font-mono font-bold shadow-2xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-600" />
                            </span>
                            <span>Time left 24:10</span>
                        </div>
                        <span className="text-amber-800/60 text-xs hidden md:inline">•</span>
                        <span className="text-xs text-amber-800 hidden md:inline">
                            Reason: Support request & billing escalation
                        </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => toast.success("Extended session by 15 minutes")}
                            className="px-2.5 py-1 rounded-lg bg-surface-container-lowest/90 hover:bg-surface-container-lowest text-amber-900 text-xs font-semibold border border-amber-300 transition-colors shadow-2xs"
                        >
                            Extend 15m
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setImpersonating(false);
                                toast("Exited impersonation mode");
                            }}
                            className="px-3 py-1 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            Exit
                        </button>
                    </div>
                </div>
            )}

            {/* Dashboard Top Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-outline-variant/30">
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Dashboard</h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            {impersonating ? "Northwind Digital" : workspaceName}
                        </span>
                    </div>
                    <p className="text-xs text-secondary mt-1">
                        Good morning, {displayName.split(" ")[0]} · Here&apos;s your autonomous AI fleet overview for today.
                    </p>
                </div>

                {/* Action Toolbar */}
                <div className="flex items-center flex-wrap gap-2.5">
                    {/* Live Autopilot indicator pill */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-outline-variant/40 shadow-2xs text-xs font-semibold text-on-surface">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span>Live Autopilot: Active</span>
                    </div>

                    {/* Timeframe Switcher */}
                    <div className="flex items-center bg-surface-container-low p-1 rounded-lg border border-outline-variant/30 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setTimeRange("24H")}
                            className={`px-2.5 py-1 rounded transition-all ${timeRange === "24H"
                                    ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
                                    : "text-secondary hover:text-on-surface"
                                }`}
                        >
                            24h
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange("7D")}
                            className={`px-2.5 py-1 rounded transition-all ${timeRange === "7D"
                                    ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
                                    : "text-secondary hover:text-on-surface"
                                }`}
                        >
                            7 Days
                        </button>
                        <button
                            type="button"
                            onClick={() => setTimeRange("30D")}
                            className={`px-2.5 py-1 rounded transition-all ${timeRange === "30D"
                                    ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
                                    : "text-secondary hover:text-on-surface"
                                }`}
                        >
                            30 Days
                        </button>
                    </div>

                    {/* New Automation CTA */}
                    <Link
                        href="/workflows"
                        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-xs font-semibold shadow-xs transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        New Automation
                    </Link>
                </div>
            </div>

            {/* 5 KPI Metric Cards Row — live from GET /api/v1/admin/metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {kpiCards.map((card) => {
                    const Icon = card.icon;
                    const locked = !metricsLoading && !metrics && metricsStatus === 403;
                    const unavailable = !metricsLoading && !metrics && Boolean(metricsStatus);
                    return (
                        <div
                            key={card.key}
                            className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-secondary">
                                    <span className="text-[11px] font-bold uppercase tracking-wider">{card.label}</span>
                                    <Icon className={`w-4 h-4 ${card.iconClass}`} />
                                </div>
                                <div className="text-2xl font-bold text-on-surface tabular-nums tracking-tight">
                                    {metricsLoading ? <span className="animate-pulse">—</span> : formatKpiValue(card)}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-semibold text-secondary">
                                    <span>
                                        {locked ? "Requires Super Admin role" : unavailable ? "Metrics unavailable" : card.hint}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-3 mt-3 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-secondary">
                                <span>{locked ? "Super Admin only" : card.footer}</span>
                                {locked ? (
                                    <Lock className="w-3 h-3" />
                                ) : (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Lower Section: 2-Column Asymmetric Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Conversion Analytics (8 cols) — live from GET /api/v1/reporting/analytics/snapshots */}
                <div className="lg:col-span-8 flex flex-col p-5 sm:p-6 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-5">
                    {/* Panel Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-on-surface">Conversion Analytics</h2>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    Real Snapshots
                                </span>
                            </div>
                            <p className="text-xs text-secondary mt-0.5">
                                Conversion throughput and agent performance computed from persisted Analytics Agent snapshots
                            </p>
                        </div>

                        {/* Metric Filter Pills */}
                        <div className="flex items-center bg-surface-container-low p-1 rounded-lg text-xs border border-outline-variant/30">
                            {METRIC_FILTERS.map((filter) => (
                                <button
                                    key={filter.key}
                                    type="button"
                                    onClick={() => setMetricFilter(filter.key)}
                                    className={`px-2.5 py-1 rounded font-semibold transition-all ${metricFilter === filter.key
                                            ? "bg-surface-container-lowest text-on-surface shadow-2xs font-bold"
                                            : "text-secondary hover:text-on-surface"
                                        }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Snapshot Trend Chart */}
                    {snapshotsLoading ? (
                        <div className="h-[240px] w-full rounded-lg bg-surface-container-low animate-pulse" aria-hidden="true" />
                    ) : snapshotsFailed ? (
                        <div className="h-[240px] flex flex-col items-center justify-center gap-2 text-center">
                            <p className="text-xs text-secondary">Couldn&apos;t load analytics snapshots.</p>
                            <button
                                type="button"
                                onClick={refetchSnapshots}
                                className="text-xs font-bold text-primary hover:underline"
                            >
                                Retry
                            </button>
                        </div>
                    ) : chartData.length === 0 ? (
                        <div className="h-[240px] flex flex-col items-center justify-center gap-1.5 text-center px-6">
                            <Clock className="w-7 h-7 text-secondary mx-auto" />
                            <p className="text-xs font-semibold text-on-surface">No snapshots in this window</p>
                            <p className="text-[11px] text-secondary max-w-sm">
                                The Analytics Agent persists a snapshot after every run — widen the time range to see
                                earlier history.
                            </p>
                        </div>
                    ) : (
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 8, right: metricFilter === "ALL" ? 8 : 16, left: 0, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(6,60,188,0.08)" vertical={false} />
                                    <XAxis
                                        dataKey="label"
                                        tick={{ fontSize: 10, fill: "#6b7280" }}
                                        axisLine={false}
                                        tickLine={false}
                                        minTickGap={28}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 10, fill: "#6b7280" }}
                                        axisLine={false}
                                        tickLine={false}
                                        width={44}
                                    />
                                    {metricFilter === "ALL" && (
                                        <YAxis
                                            yAxisId="right"
                                            orientation="right"
                                            domain={[0, 100]}
                                            tick={{ fontSize: 10, fill: "#6b7280" }}
                                            axisLine={false}
                                            tickLine={false}
                                            width={36}
                                        />
                                    )}
                                    <Tooltip
                                        contentStyle={{
                                            fontSize: 11,
                                            borderRadius: 10,
                                            border: "1px solid rgba(6,60,188,0.15)",
                                            boxShadow: "0 4px 14px rgba(6,60,188,0.12)",
                                            padding: "6px 10px",
                                        }}
                                        labelStyle={{ fontSize: 11, fontWeight: 700, color: "#0f172a" }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                                    {metricFilter === "ALL" && (
                                        <>
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="conversion"
                                                name="Conversion %"
                                                stroke="#063cbc"
                                                strokeWidth={2.5}
                                                dot={{ r: 2.5 }}
                                                activeDot={{ r: 4 }}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="outreach"
                                                name="Outreach Sent"
                                                stroke="#10b981"
                                                strokeWidth={2.5}
                                                dot={{ r: 2.5 }}
                                                activeDot={{ r: 4 }}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="published"
                                                name="Published Posts"
                                                stroke="#f59e0b"
                                                strokeWidth={2.5}
                                                dot={{ r: 2.5 }}
                                                activeDot={{ r: 4 }}
                                            />
                                        </>
                                    )}
                                    {metricFilter === "OUTREACH" && (
                                        <>
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="outreach"
                                                name="Outreach Sent"
                                                stroke="#10b981"
                                                strokeWidth={2.5}
                                                dot={{ r: 2.5 }}
                                                activeDot={{ r: 4 }}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="queued"
                                                name="Queued Outbox"
                                                stroke="#94a3b8"
                                                strokeWidth={2.5}
                                                dot={{ r: 2.5 }}
                                                activeDot={{ r: 4 }}
                                            />
                                        </>
                                    )}
                                    {metricFilter === "PUBLISHING" && (
                                        <Line
                                            yAxisId="left"
                                            type="monotone"
                                            dataKey="published"
                                            name="Published Posts"
                                            stroke="#063cbc"
                                            strokeWidth={2.5}
                                            dot={{ r: 2.5 }}
                                            activeDot={{ r: 4 }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Latest Snapshot Stat Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/30 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                Conversion Rate
                            </span>
                            <div className="text-lg font-bold text-primary tabular-nums">
                                {snapshotsLoading || snapshotsFailed ? "—" : `${conversionRate}%`}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/30 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                Outreach Sent
                            </span>
                            <div className="text-lg font-bold text-on-surface tabular-nums">
                                {snapshotsLoading || snapshotsFailed
                                    ? "—"
                                    : (latestMetrics?.outreachSent ?? 0).toLocaleString("en-US")}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/30 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                Published Posts
                            </span>
                            <div className="text-lg font-bold text-on-surface tabular-nums">
                                {snapshotsLoading || snapshotsFailed
                                    ? "—"
                                    : (latestMetrics?.socialPostsPublished ?? 0).toLocaleString("en-US")}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/30 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary">
                                Pending Approvals
                            </span>
                            <div className="text-lg font-bold text-amber-600 tabular-nums">
                                {snapshotsLoading || snapshotsFailed
                                    ? "—"
                                    : (latestMetrics?.pendingApprovals ?? 0).toLocaleString("en-US")}
                            </div>
                        </div>
                    </div>

                    {/* AI Summary from the latest snapshot */}
                    {latestSnapshot?.ai_summary && (
                        <div className="flex items-start gap-2 pt-2 border-t border-outline-variant/30 text-[11px] text-secondary">
                            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-px" />
                            <p className="leading-relaxed">{latestSnapshot.ai_summary}</p>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="pt-2 flex items-center justify-between border-t border-outline-variant/30 text-xs">
                        <span className="text-[11px] text-secondary">
                            {latestSnapshot
                                ? `Snapshot ${formatSnapshotLabel(latestSnapshot.created_at)}${latestSnapshot.period ? ` · ${latestSnapshot.period}` : ""
                                }`
                                : "No snapshot recorded yet"}
                        </span>
                        <span className="text-[11px] text-secondary">
                            {chartData.length} point{chartData.length === 1 ? "" : "s"} in range
                        </span>
                    </div>
                </div>

                {/* Right: Today's Brief (4 cols) */}
                <div className="lg:col-span-4 flex flex-col p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/40 shadow-xs space-y-4">
                    {/* Card Header */}
                    <div className="space-y-1 pb-3 border-b border-outline-variant/30">
                        <div className="flex items-center justify-between">
                            <h2 className="text-base font-bold text-on-surface">Today&apos;s Brief</h2>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Ready to dispatch
                            </span>
                        </div>
                        <p className="text-xs text-secondary">
                            {briefsLoading
                                ? "Loading prioritized actions from the Daily Brief agent…"
                                : `AI agents generated ${briefItems.length} prioritized tactical action${briefItems.length === 1 ? "" : "s"
                                } requiring human execution or sign-off.`}
                        </p>
                    </div>

                    {/* Tactical Actions List */}
                    <div className="space-y-2.5">
                        {!briefsLoading && !briefsFailed && briefItems.map((b) => (
                            <div
                                key={b.id}
                                className="p-3 rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low border border-outline-variant/30 space-y-2 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                                            {b.botTag} • {b.timestamp}
                                        </span>
                                        <p className="text-xs font-semibold text-on-surface leading-snug mt-0.5">
                                            {b.title}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0 ${b.impactColor === "high"
                                                ? "bg-red-100 text-red-800 "
                                                : b.impactColor === "scheduled"
                                                    ? "bg-amber-100 text-amber-800 "
                                                    : "bg-surface-container-high text-secondary"
                                            }`}
                                    >
                                        {b.impactTag}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between pt-1 text-[11px]">
                                    <span className="text-secondary truncate">{b.targetDetail}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleExecuteBrief(b.id, b.title)}
                                        className="h-6 px-2.5 rounded bg-primary hover:bg-primary-hover text-on-primary font-bold text-[10px] transition-colors shadow-2xs"
                                    >
                                        {b.actionText}
                                    </button>
                                </div>
                            </div>
                        ))}

                        {briefsLoading && (
                            <div className="space-y-2.5 animate-pulse" aria-hidden="true">
                                {[0, 1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="p-3 rounded-lg bg-surface-container-low/60 border border-outline-variant/30 space-y-2"
                                    >
                                        <div className="h-3 w-24 bg-surface-container-high rounded" />
                                        <div className="h-3.5 w-3/4 bg-surface-container-high rounded" />
                                        <div className="h-3 w-1/2 bg-surface-container-high rounded" />
                                    </div>
                                ))}
                            </div>
                        )}

                        {briefsFailed && (
                            <div className="py-8 text-center space-y-2">
                                <p className="text-xs text-secondary">Couldn&apos;t load today&apos;s brief.</p>
                                <button
                                    type="button"
                                    onClick={refetchBriefs}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {!briefsLoading && !briefsFailed && briefItems.length === 0 && (
                            <div className="py-8 text-center text-xs text-secondary">
                                {dismissedBriefs.length > 0 ? (
                                    <>
                                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                                        All tactical briefs signed off for today!
                                    </>
                                ) : (
                                    <>
                                        <Clock className="w-8 h-8 text-secondary mx-auto mb-2" />
                                        No tactical briefs yet — the Daily Brief agent publishes the executive agenda every
                                        morning.
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
