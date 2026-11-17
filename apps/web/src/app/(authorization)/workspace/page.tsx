"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    Wallet,
    FileText,
    Share2,
    Mail,
    Send,
    Plus,
    Sliders,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    Sparkles,
    BookOpen,
    Play,
    CheckCircle2,
    CheckCheck,
    RotateCcw,
    Clock,
    ExternalLink,
    MessageSquare,
    X,
} from "lucide-react";
import {
    MOCK_WORKSPACE_DATA,
    WorkspaceDraft,
    DraftStatus,
} from "@/mocks/workspaceData";
import { useGetEmployeeTasksQuery } from "@/redux/api/teamApi";
import { useWebSocketTopic } from "@/shared/hooks/useWebSocketTopic";

function getTaskErrorMessage(error: unknown): string {
    if (typeof error === "object" && error !== null && "data" in error) {
        const data = error.data;
        if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
            return data.message;
        }
    }
    return "Could not load your tasks.";
}

export default function WorkspacePage() {
    const [data, setData] = useState(MOCK_WORKSPACE_DATA);
    const {
        data: tasksResponse,
        isLoading: tasksLoading,
        error: tasksError,
        refetch: refetchTasks,
    } = useGetEmployeeTasksQuery({ limit: 50 });

    useWebSocketTopic("notifications", () => {
        void refetchTasks();
    });
    const [filterType, setFilterType] = useState<string>("all");
    const [activeReviseDraft, setActiveReviseDraft] = useState<WorkspaceDraft | null>(null);
    const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    const handleReconnect = (platform: string) => {
        toast.success(`Refreshing ${platform} OAuth 2.1 token... Connected!`);
    };

    const handleRequestTopup = () => {
        toast.success("Top-up request of 100 credits sent to your Workspace Admin!");
    };

    const handleSendDraft = (id: string, title: string) => {
        setData((prev) => ({
            ...prev,
            drafts: prev.drafts.map((d) =>
                d.id === id ? { ...d, status: "dispatched" as DraftStatus, timestamp: "Just now" } : d
            ),
            draftActivity: {
                ...prev.draftActivity,
                approved: Math.max(0, prev.draftActivity.approved - 1),
                published: prev.draftActivity.published + 1,
            },
        }));
        toast.success(`Dispatched "${title}" to queue.`);
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        const newDraft: WorkspaceDraft = {
            id: `dr-${Date.now()}`,
            title: newTaskTitle,
            type: "Social Post",
            status: "draft",
            timestamp: "Just now",
            authorOrBot: "Ahmer Ali",
        };
        setData((prev) => ({
            ...prev,
            drafts: [newDraft, ...prev.drafts],
        }));
        setNewTaskTitle("");
        setIsNewTaskOpen(false);
        toast.success("Draft created and added to queue.");
    };

    const filteredDrafts = data.drafts.filter((d) =>
        filterType === "all" ? true : d.type.toLowerCase().includes(filterType.toLowerCase())
    );

    const getColDrafts = (status: DraftStatus) =>
        filteredDrafts.filter((d) => d.status === status);
    const tasks = tasksResponse?.tasks ?? [];

    return (
        <div className="w-full space-y-6 pb-12">
            {/* Top Workspace Action Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            My Workspace
                        </h1>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary tracking-wide">
                            LIVE QUEUE
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Your personal credits, drafts, and assigned training.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    <button
                        onClick={() => {
                            setFilterType((prev) => (prev === "all" ? "social" : prev === "social" ? "email" : "all"));
                            toast.success(`Filter switched: showing ${filterType === "all" ? "Social Drafts" : filterType === "social" ? "Email Sequences" : "All Drafts"}`);
                        }}
                        className="h-9 px-3 rounded-lg bg-card border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:bg-muted transition-colors"
                    >
                        <Sliders className="w-4 h-4 text-muted-foreground" />
                        <span>Filter: {filterType.toUpperCase()}</span>
                    </button>
                    <button
                        onClick={() => setIsNewTaskOpen(true)}
                        className="h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 shadow-sm hover:opacity-95 transition-all active:scale-[0.98]"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create new task</span>
                    </button>
                </div>
            </div>

            {/* Operational Metrics Triptych */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: Credit Allocation */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-primary" />
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                Credit Allocation
                            </span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            Monthly Pool
                        </span>
                    </div>

                    <div className="flex flex-col mb-4">
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">
                                {data.credits.available}
                            </span>
                            <span className="text-xs text-muted-foreground tabular-nums">
                                / {data.credits.monthlyLimit} monthly assigned
                            </span>
                        </div>
                        <span className="text-xs text-muted-foreground mt-0.5">
                            Credits available for your automated workflows
                        </span>
                    </div>

                    <div className="space-y-2.5">
                        <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                <span>{data.credits.percentAvailable}% Available</span>
                                <span className="font-medium text-foreground tabular-nums">
                                    {data.credits.consumed} consumed
                                </span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-primary rounded-full transition-all duration-500"
                                    style={{ width: `${data.credits.percentAvailable}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-border/60">
                            <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Renews {data.credits.renewDate}
                            </span>
                            <button
                                onClick={handleRequestTopup}
                                className="h-7 px-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium flex items-center gap-1 transition-colors"
                            >
                                <span>Request top-up</span>
                                <Send className="w-3 h-3 text-muted-foreground" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Card 2: Draft Activity */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                Draft Activity
                            </span>
                        </div>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            Today
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-auto py-2">
                        <div className="bg-muted/50 rounded-lg p-2.5 flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span className="text-[11px] text-muted-foreground">Pending</span>
                            </div>
                            <span className="text-2xl font-bold text-foreground tabular-nums">
                                {data.draftActivity.pending}
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">In review</span>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-2.5 flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-[11px] text-muted-foreground">Approved</span>
                            </div>
                            <span className="text-2xl font-bold text-foreground tabular-nums">
                                {data.draftActivity.approved}
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Ready to send</span>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-2.5 flex flex-col">
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="text-[11px] text-muted-foreground">Published</span>
                            </div>
                            <span className="text-2xl font-bold text-foreground tabular-nums">
                                {data.draftActivity.published}
                            </span>
                            <span className="text-[11px] text-muted-foreground mt-0.5">Dispatched</span>
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                        <span className="flex items-center gap-1 text-emerald-600 ">
                            <TrendingUp className="w-3.5 h-3.5" />
                            {data.draftActivity.velocityDelta}
                        </span>
                        <Link href="/audit-log" className="text-primary font-medium hover:underline">
                            Audit trail
                        </Link>
                    </div>
                </div>

                {/* Card 3: Connected Accounts */}
                <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-primary" />
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                                Connected Accounts
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>2 Active</span>
                        </div>
                    </div>

                    <div className="space-y-2 my-auto">
                        {data.connectedAccounts.map((acc) => (
                            <div
                                key={acc.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60"
                            >
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-7 h-7 rounded-md bg-card border border-border flex items-center justify-center shadow-xs shrink-0">
                                        {acc.platform === "Gmail" ? (
                                            <Mail className="w-4 h-4 text-red-500" />
                                        ) : (
                                            <Share2 className="w-4 h-4 text-primary" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-semibold text-foreground truncate">
                                            {acc.name}
                                        </span>
                                        {acc.warningText ? (
                                            <span className="text-[11px] text-amber-600 flex items-center gap-1 truncate">
                                                <AlertTriangle className="w-3 h-3" />
                                                {acc.warningText}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-muted-foreground truncate">
                                                {acc.accountHandle}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {acc.status === "ExpiringSoon" ? (
                                    <button
                                        onClick={() => handleReconnect(acc.platform)}
                                        className="h-6 px-2 rounded-md bg-card border border-border hover:bg-muted text-foreground text-[11px] font-medium transition-colors shrink-0"
                                    >
                                        Reconnect
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-medium shrink-0">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        Connected
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border/60">
                        <span>OAuth 2.1 protocol</span>
                        <Link
                            href="/channels"
                            className="text-primary font-medium hover:underline flex items-center gap-0.5 text-xs"
                        >
                            <span>Manage all</span>
                            <ArrowRight className="w-3 h-3" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Live personal tasks */}
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">My tasks</h2>
                        <p className="text-xs text-muted-foreground">Tasks assigned to your account.</p>
                    </div>
                    {tasksResponse && (
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                            {tasks.length} tasks
                        </span>
                    )}
                </div>
                {tasksError ? (
                    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-destructive/10 p-3 text-sm text-foreground">
                        <span>{getTaskErrorMessage(tasksError)}</span>
                        <button
                            type="button"
                            onClick={() => void refetchTasks()}
                            className="shrink-0 font-semibold text-primary hover:underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : tasksLoading ? (
                    <p className="py-4 text-sm text-muted-foreground">Loading your tasks…</p>
                ) : tasks.length === 0 ? (
                    <p className="py-4 text-sm text-muted-foreground">No tasks are assigned to your account.</p>
                ) : (
                    <div className="divide-y divide-border/60">
                        {tasks.map((task) => (
                            <article key={task.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center">
                                <div className="min-w-0">
                                    <h3 className="break-words text-sm font-medium text-foreground">
                                        {task.request || "Untitled task"}
                                    </h3>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        {task.created_at ? new Date(task.created_at).toLocaleString() : "Date not available"}
                                        {task.credit_budget != null ? ` · ${task.credit_budget} credits budgeted` : ""}
                                    </p>
                                </div>
                                <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold capitalize text-muted-foreground">
                                    {task.status || "Unknown"}
                                </span>
                            </article>
                        ))}
                    </div>
                )}
            </section>

            {/* Main Kanban Pipeline: My Drafts */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                {/* Header & Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-border/60">
                    <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-semibold text-foreground">My drafts</h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                            {filteredDrafts.length} active drafts across review pipeline
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-lg bg-muted p-0.5 text-xs text-muted-foreground">
                            {["all", "Social", "Email", "Comment"].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type === "all" ? "all" : type)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-colors ${(type === "all" && filterType === "all") || filterType === type
                                            ? "bg-card text-foreground shadow-xs"
                                            : "hover:text-foreground"
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 5-Column Kanban Board Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    {/* Col 1: Draft */}
                    <div className="flex flex-col bg-muted/40 rounded-xl p-3 min-h-[340px]">
                        <div className="flex items-center justify-between px-1 mb-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-muted-foreground"></span>
                                <span className="text-xs font-semibold text-foreground">Draft</span>
                            </div>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-card text-muted-foreground font-semibold">
                                {getColDrafts("draft").length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5 flex-1">
                            {getColDrafts("draft").map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-card border border-border/80 p-3 rounded-lg shadow-xs hover:shadow transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                                {draft.type}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">{draft.timestamp}</span>
                                        </div>
                                        <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {draft.title}
                                        </h3>
                                    </div>
                                    <div className="mt-3 pt-2 flex items-center justify-between text-muted-foreground border-t border-border/60 text-[11px]">
                                        <span className="flex items-center gap-1">
                                            <Sparkles className="w-3 h-3 text-primary" />
                                            {draft.authorOrBot}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Col 2: In review */}
                    <div className="flex flex-col bg-muted/40 rounded-xl p-3 min-h-[340px]">
                        <div className="flex items-center justify-between px-1 mb-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                <span className="text-xs font-semibold text-foreground">In review</span>
                            </div>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-card text-muted-foreground font-semibold">
                                {getColDrafts("review").length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5 flex-1">
                            {getColDrafts("review").map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-card border border-border/80 p-3 rounded-lg shadow-xs hover:shadow transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 font-semibold">
                                                {draft.type}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">{draft.timestamp}</span>
                                        </div>
                                        <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {draft.title}
                                        </h3>
                                    </div>
                                    <div className="mt-3 pt-2 flex items-center justify-between text-muted-foreground border-t border-border/60 text-[11px]">
                                        <span className="flex items-center gap-1 text-amber-600 ">
                                            <Clock className="w-3 h-3" />
                                            {draft.reviewer || "Pending QA"}
                                        </span>
                                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Col 3: Approved */}
                    <div className="flex flex-col bg-muted/40 rounded-xl p-3 min-h-[340px]">
                        <div className="flex items-center justify-between px-1 mb-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                <span className="text-xs font-semibold text-foreground">Approved</span>
                            </div>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-card text-muted-foreground font-semibold">
                                {getColDrafts("approved").length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5 flex-1">
                            {getColDrafts("approved").map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-card border border-border/80 p-3 rounded-lg shadow-xs hover:shadow transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                                                {draft.type}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">{draft.timestamp}</span>
                                        </div>
                                        <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {draft.title}
                                        </h3>
                                    </div>
                                    <div className="mt-3 pt-2 flex items-center justify-between border-t border-border/60">
                                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Ready to send
                                        </span>
                                        <button
                                            onClick={() => handleSendDraft(draft.id, draft.title)}
                                            className="h-6 px-2 rounded bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90 flex items-center gap-1 shadow-xs"
                                        >
                                            <Send className="w-3 h-3" />
                                            <span>Send</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Col 4: Dispatched */}
                    <div className="flex flex-col bg-muted/40 rounded-xl p-3 min-h-[340px]">
                        <div className="flex items-center justify-between px-1 mb-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                <span className="text-xs font-semibold text-foreground">Dispatched</span>
                            </div>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-card text-muted-foreground font-semibold">
                                {getColDrafts("dispatched").length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5 flex-1">
                            {getColDrafts("dispatched").map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-card border border-border/80 p-3 rounded-lg shadow-xs hover:shadow transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                                                {draft.type}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">{draft.timestamp}</span>
                                        </div>
                                        <h3 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                            {draft.title}
                                        </h3>
                                    </div>
                                    <div className="mt-3 pt-2 flex items-center justify-between border-t border-border/60 text-xs">
                                        <span className="inline-flex items-center gap-1 text-emerald-600 text-[11px] font-medium">
                                            <CheckCheck className="w-3.5 h-3.5" />
                                            Delivered
                                        </span>
                                        <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Col 5: Rejected (with Manager feedback) */}
                    <div className="flex flex-col bg-muted/40 rounded-xl p-3 min-h-[340px]">
                        <div className="flex items-center justify-between px-1 mb-2.5">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                <span className="text-xs font-semibold text-foreground">Rejected</span>
                            </div>
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-card text-muted-foreground font-semibold">
                                {getColDrafts("rejected").length}
                            </span>
                        </div>
                        <div className="flex flex-col gap-2.5 flex-1">
                            {getColDrafts("rejected").map((draft) => (
                                <div
                                    key={draft.id}
                                    className="bg-card border border-border/80 p-3 rounded-lg shadow-xs hover:shadow transition-all group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-1 mb-1.5">
                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-700 font-semibold">
                                                {draft.type}
                                            </span>
                                            <span className="text-[11px] text-muted-foreground">{draft.timestamp}</span>
                                        </div>
                                        <h3 className="text-xs font-semibold text-foreground">
                                            {draft.title}
                                        </h3>

                                        {draft.rejectionFeedback && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 my-2 text-left">
                                                <div className="flex items-center gap-1 text-red-600 mb-1">
                                                    <MessageSquare className="w-3 h-3" />
                                                    <span className="text-[10px] font-semibold">
                                                        Manager Note:
                                                    </span>
                                                </div>
                                                <p className="text-xs text-foreground leading-tight italic">
                                                    &quot;{draft.rejectionFeedback}&quot;
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-border/60">
                                        <span className="text-[11px] text-muted-foreground">Action needed</span>
                                        <button
                                            onClick={() => setActiveReviseDraft(draft)}
                                            className="h-6 px-2.5 rounded bg-primary text-primary-foreground text-[10px] font-semibold hover:opacity-90 flex items-center gap-1 shadow-xs"
                                        >
                                            <RotateCcw className="w-3 h-3" />
                                            <span>Revise</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Training SOPs & Playbooks */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-border/60">
                    <div>
                        <h2 className="text-base font-semibold text-foreground">Training</h2>
                        <p className="text-xs text-muted-foreground">Assigned SOPs & Agency Playbooks</p>
                    </div>
                    <Link
                        href="/academy"
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                        <span>Go to SOP Academy</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-muted/40 border border-border/60 hover:bg-muted/60 transition-colors">
                    <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-semibold text-foreground">
                                    {data.assignedTraining.title}
                                </h3>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
                                    {data.assignedTraining.badge}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                {data.assignedTraining.description}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 sm:gap-6 flex-wrap lg:flex-nowrap justify-between lg:justify-end">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold">
                                <Clock className="w-3.5 h-3.5" />
                                {data.assignedTraining.dueIn}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {data.assignedTraining.progress}
                            </span>
                        </div>

                        <Link
                            href={data.assignedTraining.quizRoute}
                            className="h-8 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-opacity"
                        >
                            <span>Start</span>
                            <Play className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Revise Modal */}
            {activeReviseDraft && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
                    <div className="fixed inset-0 -z-10" onClick={() => setActiveReviseDraft(null)} />
                    <div className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
                        <button
                            onClick={() => setActiveReviseDraft(null)}
                            className="absolute top-4 right-4 text-outline hover:text-on-surface-variant p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                                Revise & Resubmit
                            </span>
                            <h3 className="text-lg font-bold text-on-surface mt-0.5">
                                {activeReviseDraft.title}
                            </h3>
                        </div>

                        {activeReviseDraft.rejectionFeedback && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-700">
                                <strong>Feedback:</strong> &quot;{activeReviseDraft.rejectionFeedback}&quot;
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant">
                                Content Draft Editor
                            </label>
                            <textarea
                                rows={5}
                                defaultValue={`Hi {First_Name},\n\nHope this finds you well. Reaching out to see how your team is scaling Q3 outbound operations without incurring overhead.\n\nBest,\nAhmer`}
                                className="w-full rounded-lg bg-surface-container-lowest border border-outline-variant p-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                onClick={() => setActiveReviseDraft(null)}
                                className="h-8 px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setData((prev) => ({
                                        ...prev,
                                        drafts: prev.drafts.map((d) =>
                                            d.id === activeReviseDraft.id
                                                ? { ...d, status: "review" as DraftStatus, timestamp: "Resubmitted just now" }
                                                : d
                                        ),
                                    }));
                                    setActiveReviseDraft(null);
                                    toast.success("Draft updated and resubmitted to Sarah Khan for review!");
                                }}
                                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-2xs transition-colors"
                            >
                                Resubmit for Review
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* New Task Modal */}
            {isNewTaskOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-inverse-surface/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
                    <div className="fixed inset-0 -z-10" onClick={() => setIsNewTaskOpen(false)} />
                    <form
                        onSubmit={handleCreateTask}
                        className="relative bg-surface-container-lowest border border-outline-variant w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
                    >
                        <button
                            type="button"
                            onClick={() => setIsNewTaskOpen(false)}
                            className="absolute top-4 right-4 text-outline hover:text-on-surface-variant p-1.5 rounded-lg hover:bg-surface-container-low transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div>
                            <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">
                                Quick Action
                            </span>
                            <h3 className="text-lg font-bold text-on-surface mt-0.5">Create new task</h3>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface-variant">Task or Draft Title</label>
                            <input
                                type="text"
                                required
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="e.g. Q4 Inbound Nurture Sequence"
                                className="w-full h-9 rounded-lg bg-surface-container-lowest border border-outline-variant px-3 text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            />
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsNewTaskOpen(false)}
                                className="h-8 px-3.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="h-8 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-2xs transition-colors"
                            >
                                Create Draft
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
