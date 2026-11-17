"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Rocket,
    GripVertical,
    Trash2,
    ChevronDown,
    Sparkles,
    Code,
    CheckCircle2,
    Clock,
    Plus,
    Users,
    Mail,
    Sliders,
    ShieldCheck,
    History,
    FileText,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch } from "@/redux/hooks";
import {
    campaignsApi,
    useCreateCampaignMutation,
    useGetConnectedAccountsQuery,
} from "@/redux/api/campaignsApi";
import { useGetContactsQuery } from "@/redux/api/leadsApi";

export default function NewSequencePage() {
    const dispatch = useAppDispatch();
    const [subject1, setSubject1] = useState("Quick idea for Northwind Digital");
    const [subject2, setSubject2] = useState("Re: Quick idea for Northwind Digital");
    const [subject3, setSubject3] = useState("Permission to close file?");
    const [step2NoReply, setStep2NoReply] = useState(true);
    const [step3NoReply, setStep3NoReply] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const { data: accountsData, isLoading: accountsLoading } = useGetConnectedAccountsQuery();
    const { data: contactsData, isLoading: contactsLoading } = useGetContactsQuery();
    const [createCampaign] = useCreateCampaignMutation();

    const contacts = contactsData?.contacts ?? [];
    const connectedAccountId = accountsData?.accounts?.[0]?.id;

    const submitSequence = async (mode: "draft" | "auto") => {
        if (isSaving) return;
        const goal = subject1.trim();
        if (goal.length < 5) {
            toast.error("Step 1 subject must be at least 5 characters");
            return;
        }
        if (accountsLoading || contactsLoading) {
            toast("Still checking sending account and contacts…", { icon: "⏳" });
            return;
        }
        if (!connectedAccountId) {
            toast.error("Connect a sending account first (Settings → Integrations)");
            return;
        }
        if (contacts.length === 0) {
            toast.error("Add at least one contact before launching (Leads page)");
            return;
        }

        setIsSaving(true);
        try {
            await createCampaign({
                connectedAccountId,
                goal,
                tone: "professional",
                mode,
                prospects: contacts.map((contact) => ({
                    name: contact.name,
                    email: contact.email,
                    companyName: contact.company_name ?? undefined,
                    topic: contact.topic ?? undefined,
                })),
            }).unwrap();

            // Analytics/diagnostics on /campaigns read from this cache entry.
            dispatch(campaignsApi.util.invalidateTags([{ type: "CampaignList", id: "LIST" }]));

            if (mode === "draft") {
                toast.success(`Sequence draft saved — ${contacts.length} prospects queued for approval`);
            } else {
                toast.success(`Outreach sequence launched across ${contacts.length} verified leads!`);
            }
        } catch (err) {
            const data =
                err && typeof err === "object" && "data" in err
                    ? (err as { data?: { message?: string; error?: string } }).data
                    : undefined;
            const message = data?.message || data?.error || "";
            toast.error(message || "Could not create campaign");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveDraft = () => {
        void submitSequence("draft");
    };

    const handleLaunch = () => {
        void submitSequence("auto");
    };

    return (
        <div className="space-y-6">
            {/* Context Bar & Actions */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-secondary">
                    <Link
                        href="/leads"
                        className="inline-flex items-center gap-1 hover:text-primary transition-colors font-medium"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Leads</span>
                    </Link>
                    <span className="text-outline-variant">/</span>
                    <span className="text-outline">Outreach Automation</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">New sequence</h1>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-semibold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-container" />
                            Draft
                        </span>
                        <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-secondary bg-surface-container px-2 py-0.5 rounded">
                            <History className="w-3 h-3" />
                            Auto-saved 2m ago
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={handleSaveDraft}
                            disabled={isSaving}
                            className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-sm hover:bg-surface-container transition-colors flex items-center gap-1.5 border border-outline-variant disabled:opacity-50"
                        >
                            <Save className="w-4 h-4 text-secondary" />
                            <span>Save draft</span>
                        </button>
                        <button
                            onClick={handleLaunch}
                            disabled={isSaving}
                            className="h-9 px-4 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:bg-primary transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Rocket className="w-4 h-4" />
                            <span>{isSaving ? "Working…" : "Launch sequence"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Builder Grid (2 Columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Sequence Timeline Canvas (8 cols) */}
                <div className="lg:col-span-8 flex flex-col space-y-4">
                    {/* Timeline Step 1 */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 space-y-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    title="Reorder step"
                                    className="cursor-grab text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors"
                                >
                                    <GripVertical className="w-4 h-4" />
                                </button>
                                <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-semibold text-primary-container">
                                    Step 1
                                </span>
                                <span className="text-sm font-bold text-on-surface">Email 1, Personalized outreach</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-secondary">
                                    Initial touch
                                </span>
                                <button
                                    type="button"
                                    title="Delete step"
                                    onClick={() => toast("Cannot delete the initial step", { icon: "ℹ️" })}
                                    className="p-1 rounded text-outline hover:text-error transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Subject Field */}
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary">Subject line</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={subject1}
                                    onChange={(e) => setSubject1(e.target.value)}
                                    className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary-container"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-outline px-1.5 py-0.5 rounded bg-surface-container">
                                    A/B
                                </span>
                            </div>
                        </div>

                        {/* Message Body Composer */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-secondary">Message body</label>
                                <div className="flex items-center gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => toast("Inserted tag: {company}", { icon: "🏷️" })}
                                        className="px-1.5 py-0.5 text-[11px] font-medium text-secondary hover:text-on-surface flex items-center gap-1"
                                    >
                                        <Code className="w-3.5 h-3.5" />
                                        <span>Insert tag</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => toast.success("AI polished tone and reading level")}
                                        className="px-1.5 py-0.5 text-[11px] font-semibold text-primary-container hover:underline flex items-center gap-1"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Polish</span>
                                    </button>
                                </div>
                            </div>

                            <div className="rounded-lg bg-surface-container-low p-4 border border-outline-variant space-y-3">
                                <div className="text-xs text-on-surface leading-relaxed space-y-2">
                                    <p>
                                        Hi{" "}
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-primary font-mono text-[11px] font-medium">
                                            {"{first_name}"}
                                        </span>
                                        , noticed your team at{" "}
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-primary font-mono text-[11px] font-medium">
                                            {"{company}"}
                                        </span>{" "}
                                        has been scaling outbound operations.
                                    </p>
                                    <p>
                                        We built an autonomous system that helps agencies handle multi-channel SDR outreach without hiring additional reps.
                                        Would you be open to seeing a 3-minute walkthrough?
                                    </p>
                                </div>

                                <div className="pt-2 border-t border-surface-container flex items-center justify-between text-[11px] text-secondary">
                                    <span>36 words · ~18 sec read</span>
                                    <div className="flex items-center gap-1 text-tertiary-container font-medium">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Spam score: 0.1 (Optimal)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Meta Footer */}
                        <div className="flex items-center justify-between text-xs text-secondary pt-1">
                            <span className="text-[11px]">
                                Written by <strong className="font-semibold text-primary-container">Agent #6 Outreach</strong>
                            </span>
                            <button
                                type="button"
                                onClick={() => toast("Agent prompt config (mock)", { icon: "⚙️" })}
                                className="text-[11px] font-semibold text-primary-container hover:underline"
                            >
                                Agent Prompts
                            </button>
                        </div>
                    </div>

                    {/* Timeline Connector 1 */}
                    <div className="flex flex-col items-center justify-center my-1">
                        <div className="w-0.5 h-3 bg-outline-variant/60" />
                        <div className="px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant shadow-xs flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                            <Clock className="w-3.5 h-3.5 text-secondary" />
                            <span>Wait 3 days</span>
                        </div>
                        <div className="w-0.5 h-3 bg-outline-variant/60" />
                    </div>

                    {/* Timeline Step 2 */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 space-y-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    title="Reorder step"
                                    className="cursor-grab text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors"
                                >
                                    <GripVertical className="w-4 h-4" />
                                </button>
                                <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-semibold text-primary-container">
                                    Step 2
                                </span>
                                <span className="text-sm font-bold text-on-surface">Email 2, Follow-up</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-secondary">
                                Follow-up
                            </span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary">Subject line</label>
                            <input
                                type="text"
                                value={subject2}
                                onChange={(e) => setSubject2(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary-container"
                            />
                        </div>

                        <div className="rounded-lg bg-surface-container-low p-4 border border-outline-variant text-xs text-on-surface leading-relaxed space-y-2">
                            <p>
                                Hi{" "}
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-primary font-mono text-[11px]">
                                    {"{first_name}"}
                                </span>
                                , just floating this back to the top of your inbox.
                            </p>
                            <p>
                                We recently helped another agency automate 40k monthly touches with 99.4% deliverability. Worth a brief chat this week?
                            </p>
                        </div>

                        {/* Condition Check */}
                        <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-2.5">
                            <input
                                type="checkbox"
                                id="step2-cond"
                                checked={step2NoReply}
                                onChange={(e) => setStep2NoReply(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded text-primary-container"
                            />
                            <div className="flex flex-col">
                                <label htmlFor="step2-cond" className="text-xs font-semibold text-on-surface cursor-pointer">
                                    Send only if no reply
                                </label>
                                <span className="text-[11px] text-secondary">
                                    Cancels remaining steps if prospect responds via email or books an appointment.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Timeline Connector 2 */}
                    <div className="flex flex-col items-center justify-center my-1">
                        <div className="w-0.5 h-3 bg-outline-variant/60" />
                        <div className="px-3 py-1 rounded-full bg-surface-container-lowest border border-outline-variant shadow-xs flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                            <Clock className="w-3.5 h-3.5 text-secondary" />
                            <span>Wait 4 days</span>
                        </div>
                        <div className="w-0.5 h-3 bg-outline-variant/60" />
                    </div>

                    {/* Timeline Step 3 */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 space-y-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between pb-3 border-b border-surface-container">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    title="Reorder step"
                                    className="cursor-grab text-outline hover:text-on-surface p-1 rounded hover:bg-surface-container transition-colors"
                                >
                                    <GripVertical className="w-4 h-4" />
                                </button>
                                <span className="px-2 py-0.5 rounded bg-surface-container text-[11px] font-semibold text-primary-container">
                                    Step 3
                                </span>
                                <span className="text-sm font-bold text-on-surface">Email 3, Break-up</span>
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-secondary">
                                Final note
                            </span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary">Subject line</label>
                            <input
                                type="text"
                                value={subject3}
                                onChange={(e) => setSubject3(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary-container"
                            />
                        </div>

                        <div className="rounded-lg bg-surface-container-low p-4 border border-outline-variant text-xs text-on-surface leading-relaxed space-y-2">
                            <p>
                                Hi{" "}
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-primary font-mono text-[11px]">
                                    {"{first_name}"}
                                </span>
                                , looks like timing might not be ideal right now.
                            </p>
                            <p>
                                I&apos;ll take a step back and assume this isn&apos;t a priority for{" "}
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-secondary-container text-primary font-mono text-[11px]">
                                    {"{company}"}
                                </span>
                                . If things change in Q1, feel free to reach out anytime.
                            </p>
                        </div>

                        {/* Condition Check */}
                        <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex items-start gap-2.5">
                            <input
                                type="checkbox"
                                id="step3-cond"
                                checked={step3NoReply}
                                onChange={(e) => setStep3NoReply(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded text-primary-container"
                            />
                            <div className="flex flex-col">
                                <label htmlFor="step3-cond" className="text-xs font-semibold text-on-surface cursor-pointer">
                                    Send only if no reply
                                </label>
                                <span className="text-[11px] text-secondary">
                                    Protects sender reputation and terminates active cadence cleanly.
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Add Step Action */}
                    <button
                        type="button"
                        onClick={() => toast("Added next step to sequence timeline", { icon: "➕" })}
                        className="w-full py-4 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary-container bg-surface-container-lowest/50 hover:bg-surface-container-lowest transition-all group flex flex-col items-center justify-center gap-1 text-center"
                    >
                        <div className="flex items-center gap-2 text-primary-container text-xs font-bold">
                            <Plus className="w-4 h-4 transition-transform group-hover:scale-110" />
                            <span>Add next step</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-secondary">
                            <span>Email</span>
                            <span>·</span>
                            <span>LinkedIn InMail</span>
                            <span>·</span>
                            <span>Wait condition</span>
                            <span>·</span>
                            <span>AI Branching</span>
                        </div>
                    </button>
                </div>

                {/* Right Column: Settings & Guardrails Stack (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* 1. Audience Card */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-primary-container" />
                                <h2 className="text-sm font-bold text-on-surface">Audience</h2>
                            </div>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-secondary">
                                Step 1 of 4
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary">Choose a lead list</label>
                            <div className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between">
                                <div className="flex items-center gap-2 truncate">
                                    <FileText className="w-4 h-4 text-secondary" />
                                    <span className="text-xs font-semibold text-on-surface truncate">november-prospects</span>
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container">
                                        {contacts.length} leads
                                    </span>
                                </div>
                                <ChevronDown className="w-4 h-4 text-outline" />
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-secondary pt-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-tertiary-container" />
                                <span>{contacts.length} verified prospects ready to ingest</span>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs">
                            <button
                                type="button"
                                onClick={() => toast("Opening lead filter modal", { icon: "🔍" })}
                                className="text-[11px] font-semibold text-primary-container hover:underline"
                            >
                                Apply lead filters
                            </button>
                            <span className="text-[11px] text-outline">0 deduplicated</span>
                        </div>
                    </div>

                    {/* 2. Sending Account Card */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary-container" />
                                <h2 className="text-sm font-bold text-on-surface">Sending account</h2>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-[10px] text-tertiary-container font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                                Healthy
                            </span>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold tracking-wider text-secondary">Mailbox connection</label>
                            <div className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant flex items-center justify-between">
                                <div className="flex items-center gap-2.5 truncate">
                                    <Mail className="w-4 h-4 text-error" />
                                    <div className="flex flex-col truncate">
                                        <span className="text-xs font-semibold text-on-surface truncate">alex.vance@apexgrowth.io</span>
                                        <span className="text-[10px] text-outline">Google Workspace</span>
                                    </div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-outline" />
                            </div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-surface-container-low border border-surface-container flex items-center justify-between text-xs">
                            <span className="text-secondary">Inbox Warmup score:</span>
                            <span className="font-semibold text-tertiary-container">98% (Ready)</span>
                        </div>
                    </div>

                    {/* 3. Daily Limit & Pacing Card */}
                    <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-primary-container" />
                                <h2 className="text-sm font-bold text-on-surface">Daily limit &amp; pacing</h2>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-secondary font-medium">Scheduled volume</span>
                                <span className="font-bold text-on-surface tabular-nums">45 / 50 emails today</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                                <div className="h-full bg-primary-container rounded-full w-[90%]" />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-outline pt-0.5">
                                <span>0</span>
                                <span>Pacing throttle: 6-8 mins / email</span>
                                <span>50 max</span>
                            </div>
                        </div>

                        <div className="p-3 rounded-lg bg-surface-container-low border border-surface-container flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
                                <ShieldCheck className="w-4 h-4 text-tertiary-container" />
                                <span>Safe warmup pace active</span>
                            </div>
                            <p className="text-[11px] text-secondary leading-normal">
                                Outbound throttling algorithm automatically delays dispatches to mimic natural human typing.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
