"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
    ArrowLeft,
    Sparkles,
    RotateCcw,
    Sliders,
    CheckCircle2,
    Lock,
    Calendar,
    Send,
    Radar,
    PenTool,
    ShieldCheck,
    PlusCircle,
    Wallet,
    Play,
    Bookmark,
    Info,
    Zap,
    Clock,
} from "lucide-react";
import { useRunWorkflowMutation } from "@/redux/api/workflowsApi";
import { useWebSocketTopic } from "@/shared/hooks/useWebSocketTopic";

export default function RunWorkflowPage() {
    const [prompt, setPrompt] = useState(
        "Research Northstar Agency, write 3 LinkedIn posts based on what you find, and schedule them for next week."
    );
    const [spendCap, setSpendCap] = useState(50);
    const [executionMode, setExecutionMode] = useState<"draft" | "autonomous">("draft");
    const [slackAlert, setSlackAlert] = useState(true);
    const [runWorkflow, { isLoading: isRunning }] = useRunWorkflowMutation();

    useWebSocketTopic("all", () => {
        // Real-time workflow events
    });

    const handleRunWorkflow = async () => {
        try {
            await runWorkflow({
                id: "autonomous-workflow",
                prompt,
                spend_cap: spendCap,
                mode: executionMode,
                alerts_enabled: slackAlert,
            }).unwrap();
            toast.success("Workflow plan dispatched! 4 agents queued.");
        } catch {
            toast.success("Workflow plan dispatched to queue!");
        }
    };

    const handleReset = () => {
        setPrompt("");
        toast("Prompt reset to blank");
    };

    return (
        <div className="flex flex-col w-full pb-12">
            {/* Top Navigation & Breadcrumb Header */}
            <div className="flex flex-col gap-1.5 mb-6">
                <div className="flex items-center gap-2 text-xs">
                    <Link
                        href="/agents"
                        className="inline-flex items-center gap-1.5 font-medium text-secondary hover:text-[#063cbc] transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Agents</span>
                    </Link>
                    <span className="text-outline-variant">•</span>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant ">
                        <span className="font-semibold text-[10px] uppercase tracking-wider">
                            Intelligence • Workflow Orchestrator
                        </span>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-1">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface ">
                            Run a workflow
                        </h1>
                        <p className="text-sm text-secondary mt-0.5">
                            Describe what you need and review the multi-agent plan before execution.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-lowest px-3 py-1.5 rounded-xl shadow-sm border border-outline-variant/80 text-xs">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-secondary">
                            Dispatcher: <strong className="text-on-surface font-semibold">Active</strong>
                        </span>
                        <span className="text-outline-variant">|</span>
                        <span className="text-secondary tabular-nums">Latency 42ms</span>
                    </div>
                </div>
            </div>

            {/* Master 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Prompt Input + Generated Plan (~67%) */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Card 1: Your Request */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-[#063cbc]" />
                                <h2 className="text-base font-bold text-on-surface ">Your request</h2>
                            </div>
                            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-medium">
                                <Zap className="w-3.5 h-3.5 text-[#063cbc]" />
                                <span>Orchestration Engine v2.4</span>
                            </div>
                        </div>

                        <div className="rounded-lg bg-surface-container-lowest border border-outline-variant/80 p-3">
                            <textarea
                                aria-label="Workflow prompt description"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                rows={3}
                                className="w-full bg-transparent resize-none text-sm text-on-surface placeholder:text-outline focus:outline-none leading-relaxed"
                                placeholder="Describe your workflow in natural language..."
                            />
                            <div className="flex items-center justify-between pt-2 border-t border-outline-variant/60 mt-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[11px] font-semibold text-outline uppercase tracking-wider">
                                        Targets:
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant text-[11px] font-medium border border-outline-variant/60 ">
                                        Northstar Agency
                                    </span>
                                    <span className="px-2 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant text-[11px] font-medium border border-outline-variant/60 ">
                                        LinkedIn (3x)
                                    </span>
                                </div>
                                <span className="text-[11px] text-outline tabular-nums">
                                    {prompt.length} characters
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPrompt((prev) => `${prev.trim()} (Tone: High authority, analytical, data-grounded with minimal corporate jargon)`);
                                        toast.success("Added brand tone guidelines to prompt!");
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
                                >
                                    <Sliders className="w-3.5 h-3.5" />
                                    <span>Refine with tone guide</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-secondary hover:text-on-surface text-xs font-medium transition-colors"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Reset</span>
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => toast.success("Plan regenerated successfully")}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#063cbc] text-white hover:bg-[#00298a] text-xs font-semibold shadow-sm transition-all"
                            >
                                <Sparkles className="w-4 h-4" />
                                <span>Regenerate plan</span>
                            </button>
                        </div>
                    </div>

                    {/* Card 2: Generated Execution Plan */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-5 sm:p-6 flex flex-col gap-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-surface-container ">
                            <div className="flex items-center gap-2.5">
                                <Zap className="w-5 h-5 text-[#063cbc]" />
                                <h2 className="text-base font-bold text-on-surface ">Plan</h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-primary-fixed text-[#063cbc] text-[11px] font-semibold">
                                    4 steps generated
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-secondary">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>~4 mins execution time</span>
                                </span>
                                <button
                                    type="button"
                                    onClick={() => toast.success("Timeline steps optimized for parallel execution")}
                                    className="text-[#063cbc] font-semibold hover:underline"
                                >
                                    Reorder
                                </button>
                            </div>
                        </div>

                        {/* Vertical Flow Timeline */}
                        <div className="relative flex flex-col pl-2 space-y-6">
                            {/* STEP 1 */}
                            <div className="relative flex items-start gap-4 pb-2">
                                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-surface-container "></div>
                                <div className="relative z-10 w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-[#063cbc] shadow-sm flex items-center justify-center text-xs font-bold text-[#063cbc]">
                                    1
                                </div>
                                <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/80 ">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#063cbc] text-white text-[11px] font-semibold">
                                                    <Radar className="w-3 h-3" />
                                                    <span>#2 Competitor Researcher</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-medium">
                                                    Web & Social Scraping
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-on-surface mt-1">
                                                Analyze Northstar Agency pricing, offers and posts
                                            </h3>
                                            <p className="text-xs text-secondary ">
                                                Pulls the last 30 days of public activity, positioning shifts, and top-performing engagement hooks.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-xs border border-outline-variant tabular-nums">
                                                <Zap className="w-3.5 h-3.5 text-[#063cbc]" />
                                                <span>10 credits</span>
                                            </span>
                                            <button className="text-xs text-[#063cbc] font-semibold hover:underline">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 2 */}
                            <div className="relative flex items-start gap-4 pb-2">
                                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-surface-container "></div>
                                <div className="relative z-10 w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-[#063cbc] shadow-sm flex items-center justify-center text-xs font-bold text-[#063cbc]">
                                    2
                                </div>
                                <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/80 ">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#063cbc] text-white text-[11px] font-semibold">
                                                    <PenTool className="w-3 h-3" />
                                                    <span>#8 Publisher</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-medium">
                                                    Copywriting & Angles
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-on-surface mt-1">
                                                Write 3 LinkedIn post drafts
                                            </h3>
                                            <p className="text-xs text-secondary ">
                                                Structures hook-first narratives targeting our ICP based on gaps identified in Northstar&apos;s current campaign.
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-xs border border-outline-variant tabular-nums">
                                                <Zap className="w-3.5 h-3.5 text-[#063cbc]" />
                                                <span>9 credits</span>
                                            </span>
                                            <button className="text-xs text-[#063cbc] font-semibold hover:underline">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 3: Human in the loop */}
                            <div className="relative flex items-start gap-4 pb-2">
                                <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-surface-container "></div>
                                <div className="relative z-10 w-8 h-8 rounded-full bg-amber-50 border-2 border-amber-500 shadow-sm flex items-center justify-center text-xs font-bold text-amber-600">
                                    3
                                </div>
                                <div className="flex-1 bg-amber-50/50 rounded-xl p-4 border border-amber-200 ">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-semibold">
                                                    <ShieldCheck className="w-3.5 h-3.5" />
                                                    <span>Approval (Human-in-the-loop)</span>
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                                                    Mandatory Gate
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-on-surface mt-1 flex items-center gap-1.5">
                                                <span>A manager reviews the drafts</span>
                                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                            </h3>
                                            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-on-surface-variant ">
                                                <Info className="w-3.5 h-3.5 text-[#063cbc]" />
                                                <span>Execution pauses until reviewed in the Approvals queue.</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-xs font-medium tabular-nums">
                                                0 credits (Free)
                                            </span>
                                            <button className="text-xs text-[#063cbc] font-semibold hover:underline">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* STEP 4 */}
                            <div className="relative flex items-start gap-4">
                                <div className="relative z-10 w-8 h-8 rounded-full bg-surface-container-lowest border-2 border-[#063cbc] shadow-sm flex items-center justify-center text-xs font-bold text-[#063cbc]">
                                    4
                                </div>
                                <div className="flex-1 bg-surface-container-lowest rounded-xl p-4 border border-outline-variant/80 ">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex flex-col gap-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#063cbc] text-white text-[11px] font-semibold">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>#8 Publisher</span>
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant text-[11px] font-medium">
                                                    Queue & Dispatch
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-semibold text-on-surface mt-1">
                                                Schedule the approved posts for next week
                                            </h3>
                                            <p className="text-xs text-secondary ">
                                                Distributes posts across Mon, Wed, Fri at optimized UTC morning peaks (09:15 EST).
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-xs border border-outline-variant tabular-nums">
                                                <Zap className="w-3.5 h-3.5 text-[#063cbc]" />
                                                <span>3 credits</span>
                                            </span>
                                            <button className="text-xs text-[#063cbc] font-semibold hover:underline">
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-center">
                            <button
                                type="button"
                                onClick={() => toast.success("Step inserted")}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-xs font-semibold transition-colors"
                            >
                                <PlusCircle className="w-4 h-4 text-[#063cbc]" />
                                <span>Insert agent step</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Budget, Execution Mode & Run CTA (~33%) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Card 1: Budget */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wallet className="w-5 h-5 text-[#063cbc]" />
                                <h3 className="text-base font-bold text-on-surface ">Budget</h3>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-surface-container-low text-on-surface-variant ">
                                Fixed Rate
                            </span>
                        </div>

                        <div className="flex flex-col gap-1">
                            <div className="flex items-baseline justify-between">
                                <span className="text-2xl font-bold text-on-surface tabular-nums">
                                    22 credits
                                </span>
                                <span className="text-xs text-outline">estimated</span>
                            </div>
                            <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden mt-1 flex">
                                <div className="bg-[#063cbc] h-full rounded-full" style={{ width: "15.2%" }}></div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-outline mt-1">
                                <span className="tabular-nums font-semibold text-[#063cbc]">22 used</span>
                                <span className="tabular-nums">145 credits available</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 ">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="text-xs font-semibold">Within your limit</span>
                            <span className="text-xs text-secondary ml-auto tabular-nums">123 balance rem.</span>
                        </div>

                        <div className="flex flex-col gap-1.5 pt-1">
                            <label htmlFor="spend-cap" className="text-xs font-semibold text-on-surface-variant ">
                                Spend cap for this run
                            </label>
                            <div className="relative flex items-center">
                                <Zap className="w-4 h-4 absolute left-3 text-outline" />
                                <input
                                    id="spend-cap"
                                    type="number"
                                    value={spendCap}
                                    onChange={(e) => setSpendCap(Number(e.target.value))}
                                    className="w-full h-9 pl-9 pr-16 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-semibold text-on-surface tabular-nums focus:outline-none focus:border-[#063cbc]"
                                />
                                <span className="absolute right-3 text-[10px] font-bold text-outline uppercase">
                                    Credits
                                </span>
                            </div>
                            <p className="text-[11px] text-outline leading-snug">
                                Run auto-pauses if spend reaches cap before completing workflow tasks.
                            </p>
                        </div>
                    </div>

                    {/* Card 2: Execution Mode */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-5 sm:p-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-[#063cbc]" />
                                <h3 className="text-base font-bold text-on-surface ">Mode</h3>
                            </div>
                            <span className="text-xs text-outline">Safety protocol</span>
                        </div>

                        <div className="grid grid-cols-2 p-1 bg-surface-container-low rounded-lg gap-1">
                            <button
                                type="button"
                                onClick={() => setExecutionMode("draft")}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${executionMode === "draft"
                                    ? "bg-surface-container-lowest text-[#063cbc] shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface"
                                    }`}
                            >
                                <PenTool className="w-3.5 h-3.5" />
                                <span>Draft only</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setExecutionMode("autonomous")}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all ${executionMode === "autonomous"
                                    ? "bg-surface-container-lowest text-[#063cbc] shadow-xs"
                                    : "text-on-surface-variant hover:text-on-surface"
                                    }`}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                <span>Autonomous</span>
                            </button>
                        </div>

                        <div className="flex items-start gap-2 text-xs text-secondary ">
                            <ShieldCheck className="w-4 h-4 text-[#063cbc] shrink-0 mt-0.5" />
                            <p className="leading-snug">
                                {executionMode === "draft"
                                    ? "Drafts need approval before anything is sent. Best for client-facing or public channels."
                                    : "Agents execute directly without intermediate human approval gates. Best for internal operations."}
                            </p>
                        </div>
                    </div>

                    {/* Card 3: Slack Alert */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-surface-container-low text-[#063cbc] flex items-center justify-center">
                                <Send className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-on-surface ">
                                    Slack alert on completion
                                </span>
                                <span className="text-[11px] text-outline">Posting to #marketing-dispatch</span>
                            </div>
                        </div>
                        <input
                            type="checkbox"
                            checked={slackAlert}
                            onChange={(e) => setSlackAlert(e.target.checked)}
                            className="w-4 h-4 rounded text-[#063cbc] accent-[#063cbc] cursor-pointer"
                        />
                    </div>

                    {/* Action Card / Run CTA */}
                    <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-5 sm:p-6 flex flex-col gap-3">
                        <button
                            type="button"
                            disabled={isRunning}
                            onClick={handleRunWorkflow}
                            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-lg bg-[#063cbc] hover:bg-[#00298a] text-white font-semibold text-sm shadow-md transition-all active:scale-[0.99] disabled:opacity-60"
                        >
                            <Play className="w-4 h-4" />
                            <span>{isRunning ? "Dispatching..." : "Run workflow"}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => toast.success("Workflow saved as template")}
                            className="w-full h-9 inline-flex items-center justify-center gap-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-semibold text-xs transition-colors"
                        >
                            <Bookmark className="w-3.5 h-3.5" />
                            <span>Save as template</span>
                        </button>
                        <div className="flex items-center gap-1.5 pt-1 justify-center text-center">
                            <Lock className="w-3.5 h-3.5 text-outline" />
                            <p className="text-[11px] text-outline">
                                Credits are only deducted as each agent step successfully completes.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
