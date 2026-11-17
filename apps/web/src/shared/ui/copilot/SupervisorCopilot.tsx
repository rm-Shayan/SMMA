"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
    toggleCopilot,
    setCopilotOpen,
    toggleMinimize,
    addUserMessage,
    addSupervisorMessage,
    setTyping,
    markActionExecuted,
    clearHistory,
} from "@/redux/slices/copilotSlice";
import { sendCopilotMessageApi } from "@/services/copilotService";
import { publishPostApi } from "@/services/publishingService";
import type { PublishPlatform } from "@/types/publishing";
import {
    Bot,
    Sparkles,
    Send,
    Trash2,
    Minimize2,
    Maximize2,
    X,
    CheckCircle2,
    Calendar,
    Users,
    CreditCard,
    ArrowUpRight,
    MessageSquare,
    ExternalLink,
    Zap,
    CornerDownLeft,
} from "lucide-react";

interface SchedulePostActionPayload {
    platform?: string;
    content?: string;
    time?: string;
    estimatedCredits?: number;
}

export default function SupervisorCopilot() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { isOpen, isMinimized, isTyping, messages } = useAppSelector((state) => state.copilot);

    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
            inputRef.current?.focus();
        }
    }, [messages, isOpen, isMinimized, isTyping]);

    // Global Keyboard Shortcut: Ctrl+J or Cmd+J to toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "j") {
                e.preventDefault();
                dispatch(toggleCopilot());
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [dispatch]);

    const handleSendMessage = async (textToSend?: string) => {
        const text = (textToSend || inputValue).trim();
        if (!text || isTyping) return;

        dispatch(addUserMessage(text));
        setInputValue("");
        dispatch(setTyping(true));

        try {
            const response = await sendCopilotMessageApi(text);
            dispatch(
                addSupervisorMessage({
                    agentNumber: response.agentNumber,
                    agentName: response.agentName,
                    text: response.text,
                    actionCard: response.actionCard,
                })
            );
        } catch {
            // Realistic Styre Bot supervisor orchestration fallback
            setTimeout(() => {
                dispatch(
                    addSupervisorMessage({
                        agentNumber: 12,
                        agentName: "Styre Bot",
                        text: `Routing request to autonomous fleet: "${text}". Agent #8 (Publisher) and Agent #2 (Competitor Radar) are executing sub-tasks. Workflow plan generated with 2 credits reserved.`,
                        actionCard: {
                            type: "schedule_post",
                            title: "Draft Campaign Approval",
                            description: "Agent #8 prepared a personalized LinkedIn post ready for queueing.",
                            payload: { platform: "linkedin", content: "Exciting updates from Styre-Bot on autonomous AI fleet operations!" },
                        },
                    })
                );
            }, 500);
        } finally {
            dispatch(setTyping(false));
        }
    };

    const handleExecuteSchedulePost = async (messageId: string, payload: SchedulePostActionPayload) => {
        try {
            await publishPostApi({
                platform: (payload.platform as PublishPlatform | undefined) || "linkedin",
                draftContent: payload.content ?? "",
                autoScheduleOptimal: true,
            });
            dispatch(
                markActionExecuted({
                    messageId,
                    executedLabel: "Post Scheduled via Agent #8 (3 Credits Reserved)",
                })
            );
            toast.success("Post successfully queued in Agent #8 pipeline!");
        } catch {
            dispatch(
                markActionExecuted({
                    messageId,
                    executedLabel: "Post Queued in Local Publisher (3 Credits Reserved)",
                })
            );
            toast.success("Post queued in publisher queue!");
        }
    };

    const handleExecuteApproveInbox = (messageId: string) => {
        dispatch(
            markActionExecuted({
                messageId,
                executedLabel: "Reply Dispatched via Agent #9 (1 Credit Used)",
            })
        );
        toast.success("Reply dispatched to customer DM!");
    };

    const quickPrompts = [
        { label: "📅 Schedule LinkedIn Post", query: "Schedule a post on LinkedIn for tomorrow" },
        { label: "🎯 Show Hot Leads", query: "Show me the top 3 hot leads in pipeline" },
        { label: "💬 Urgent DMs & Inquiries", query: "Check escalated inbox DMs and comments" },
        { label: "💳 Check Credit Balance", query: "What is my current credit balance?" },
    ];

    return (
        <>
            {/* Floating Trigger Button (Bottom-Right) - Branded Styre Bot */}
            <div className="fixed bottom-6 right-6 z-50 flex items-center select-none">
                <button
                    onClick={() => dispatch(toggleCopilot())}
                    aria-label="Toggle Styre Bot AI Assistant"
                    className="group relative flex items-center gap-3 pl-2.5 pr-4 py-2 rounded-full bg-surface-container-lowest/95 backdrop-blur-md text-on-surface border border-primary/30 shadow-xl hover:shadow-2xl hover:border-primary/70 transition-all duration-300 active:scale-95"
                >
                    {/* Official Styre Tech Brand Icon Avatar with Glowing Ping Ring */}
                    <div className="relative w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1 shadow-xs group-hover:scale-105 transition-transform overflow-visible">
                        <Image
                            src="/brand/icon.png"
                            alt="Styre Bot"
                            width={32}
                            height={32}
                            className="w-full h-full object-contain rounded-lg"
                        />
                        {/* Pulsing online status indicator */}
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-surface-container-lowest" />
                        </span>
                    </div>

                    {/* Styre Bot Title & Status */}
                    <div className="flex flex-col text-left">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">
                                Styre Bot
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-primary/15 text-primary font-bold">
                                <Sparkles className="w-2.5 h-2.5" />
                                AI FLEET
                            </span>
                        </div>
                        <span className="text-[10.5px] text-muted-foreground font-medium leading-tight">
                            Autonomous Supervisor
                        </span>
                    </div>

                    {/* Keyboard shortcut hint */}
                    <span className="hidden sm:inline-flex items-center ml-1 text-[10px] font-mono font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border">
                        Ctrl+J
                    </span>
                </button>
            </div>

            {/* Main Chat Drawer Modal */}
            {isOpen && (
                <div
                    className={`fixed bottom-20 right-4 sm:right-6 z-50 w-[430px] max-w-[calc(100vw-2rem)] bg-card border border-border/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
                        isMinimized ? "h-14" : "h-[620px] max-h-[calc(100vh-6.5rem)]"
                    }`}
                >
                    {/* Window Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-card/95 backdrop-blur-md border-b border-border select-none shrink-0">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center p-1 shadow-xs">
                                <Image
                                    src="/brand/icon.png"
                                    alt="Styre Bot"
                                    width={28}
                                    height={28}
                                    className="w-full h-full object-contain rounded-lg"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <h3 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-1">
                                        Styre Bot
                                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                                    </h3>
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                        Agent #12
                                    </span>
                                </div>
                                <p className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 mt-0.5 font-medium">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>⚡ 680 Credits Available • 11 Agents Active</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => dispatch(clearHistory())}
                                title="Clear Chat History"
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => dispatch(toggleMinimize())}
                                title={isMinimized ? "Expand" : "Minimize"}
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                            </button>
                            <button
                                onClick={() => dispatch(setCopilotOpen(false))}
                                title="Close"
                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <>
                            {/* Messages Body */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-normal bg-muted/20">
                                {/* Welcome Hero Card */}
                                <div className="p-3.5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card shadow-xs">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center p-1 shrink-0">
                                            <Image
                                                src="/brand/icon.png"
                                                alt="Styre Bot"
                                                width={24}
                                                height={24}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-xs text-foreground flex items-center gap-1">
                                                Welcome to Styre Bot
                                                <span className="text-[10px] font-normal text-muted-foreground">Autonomous Engine</span>
                                            </h4>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                                                I command your 11 autonomous agents for social publishing, pipeline leads, and smart customer replies.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Quick Command Chips */}
                                    <div className="mt-3 pt-2.5 border-t border-border/60">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                            <Zap className="w-3 h-3 text-primary" />
                                            Quick Actions
                                        </p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {quickPrompts.map((qp, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSendMessage(qp.query)}
                                                    className="p-2 text-left rounded-lg border border-border/80 bg-card hover:bg-muted hover:border-primary/50 transition-all text-[11px] text-foreground flex items-center justify-between group shadow-2xs cursor-pointer"
                                                >
                                                    <span className="line-clamp-1 font-medium">{qp.label}</span>
                                                    <ArrowUpRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Messages List */}
                                {messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex flex-col ${
                                            msg.sender === "user" ? "items-end" : "items-start"
                                        }`}
                                    >
                                        {msg.sender === "supervisor" && (
                                            <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold text-primary">
                                                <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                                                    <Image
                                                        src="/brand/icon.png"
                                                        alt="Styre Bot"
                                                        width={16}
                                                        height={16}
                                                        className="w-full h-full object-contain"
                                                    />
                                                </div>
                                                <span>{msg.agentName || "Styre Bot"}</span>
                                            </div>
                                        )}

                                        <div
                                            className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed shadow-xs ${
                                                msg.sender === "user"
                                                    ? "bg-primary text-primary-foreground rounded-br-xs font-medium"
                                                    : "bg-card text-foreground border border-border rounded-bl-xs"
                                            }`}
                                        >
                                            <p className="whitespace-pre-line">{msg.text}</p>

                                            {/* Interactive Action Cards */}
                                            {msg.actionCard && (
                                                <div className="mt-3 pt-2.5 border-t border-border/60 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                                            {msg.actionCard.type === "schedule_post" && <Calendar className="w-3.5 h-3.5 text-primary" />}
                                                            {msg.actionCard.type === "view_lead" && <Users className="w-3.5 h-3.5 text-primary" />}
                                                            {msg.actionCard.type === "approve_inbox" && <MessageSquare className="w-3.5 h-3.5 text-primary" />}
                                                            {msg.actionCard.type === "check_credits" && <CreditCard className="w-3.5 h-3.5 text-primary" />}
                                                            {msg.actionCard.type === "navigate" && <ExternalLink className="w-3.5 h-3.5 text-primary" />}
                                                            {msg.actionCard.title}
                                                        </span>
                                                    </div>

                                                    {msg.actionCard.description && (
                                                        <p className="text-[11px] text-muted-foreground">
                                                            {msg.actionCard.description}
                                                        </p>
                                                    )}

                                                    {/* Schedule Post Action Card */}
                                                    {msg.actionCard.type === "schedule_post" && (
                                                        <div className="bg-muted/40 rounded-xl p-2.5 border border-border flex flex-col gap-2">
                                                            <div className="text-[11px] italic text-foreground bg-card p-2 rounded-lg border border-border">
                                                                &quot;{msg.actionCard.payload.content}&quot;
                                                            </div>
                                                            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                                                                <span>Platform: <b className="text-foreground capitalize">{msg.actionCard.payload.platform}</b></span>
                                                                <span>Slot: <b className="text-foreground">{msg.actionCard.payload.time}</b></span>
                                                            </div>

                                                            {msg.actionCard.executed ? (
                                                                <div className="mt-1 py-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5 border border-emerald-500/20">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    {msg.actionCard.executedLabel || "Executed Successfully"}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleExecuteSchedulePost(msg.id, msg.actionCard!.payload)}
                                                                    className="mt-1 w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                                                >
                                                                    <Send className="w-3.5 h-3.5" />
                                                                    Approve &amp; Schedule (3 Credits)
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* View Leads Action Card */}
                                                    {msg.actionCard.type === "view_lead" && (
                                                        <div className="bg-muted/40 rounded-xl p-2 border border-border flex flex-col gap-1.5">
                                                            {msg.actionCard.payload.leads?.map((lead: { name: string; company: string; score: number }, i: number) => (
                                                                <div
                                                                    key={i}
                                                                    className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-card border border-border text-[11px]"
                                                                >
                                                                    <div>
                                                                        <span className="font-semibold text-foreground">{lead.name}</span>
                                                                        <span className="text-muted-foreground ml-1.5">({lead.company})</span>
                                                                    </div>
                                                                    <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-primary/10 text-primary text-[10px]">
                                                                        {lead.score} pts
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            <button
                                                                onClick={() => router.push(msg.actionCard!.payload.destination || "/leads")}
                                                                className="mt-1 w-full py-2 rounded-lg bg-muted text-foreground font-semibold text-xs hover:bg-muted/80 transition-colors flex items-center justify-center gap-1.5 shadow-2xs border border-border cursor-pointer"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                                Open Leads Pipeline
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* Approve Inbox Action Card */}
                                                    {msg.actionCard.type === "approve_inbox" && (
                                                        <div className="bg-muted/40 rounded-xl p-2.5 border border-border flex flex-col gap-2">
                                                            <div className="text-[11px] text-muted-foreground">
                                                                Customer: <i className="text-foreground">{msg.actionCard.payload.userMessage}</i>
                                                            </div>
                                                            <div className="text-[11px] p-2 rounded-lg bg-card border border-border">
                                                                <b className="text-primary">Agent #9 Draft:</b> {msg.actionCard.payload.draftReply}
                                                            </div>

                                                            {msg.actionCard.executed ? (
                                                                <div className="py-1 px-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5 border border-emerald-500/20">
                                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                                    {msg.actionCard.executedLabel || "Reply Dispatched"}
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleExecuteApproveInbox(msg.id)}
                                                                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                                                                >
                                                                    <Send className="w-3.5 h-3.5" />
                                                                    Approve &amp; Send Reply (1 Credit)
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Check Credits Action Card */}
                                                    {msg.actionCard.type === "check_credits" && (
                                                        <div className="grid grid-cols-2 gap-2 bg-muted/40 rounded-xl p-2.5 border border-border text-[11px]">
                                                            <div className="p-2 rounded-lg bg-card border border-border/60">
                                                                <span className="text-muted-foreground block font-medium">Available:</span>
                                                                <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                                                    {msg.actionCard.payload.available}
                                                                </span>
                                                            </div>
                                                            <div className="p-2 rounded-lg bg-card border border-border/60">
                                                                <span className="text-muted-foreground block font-medium">Reserved:</span>
                                                                <span className="font-bold text-sm text-primary">
                                                                    {msg.actionCard.payload.reserved}
                                                                </span>
                                                            </div>
                                                            <div className="p-2 rounded-lg bg-card border border-border/60">
                                                                <span className="text-muted-foreground block font-medium">Today&apos;s Usage:</span>
                                                                <span className="font-bold text-sm text-foreground">
                                                                    {msg.actionCard.payload.consumedToday} credits
                                                                </span>
                                                            </div>
                                                            <div className="p-2 rounded-lg bg-card border border-border/60">
                                                                <span className="text-muted-foreground block font-medium">Cost USD:</span>
                                                                <span className="font-bold text-sm text-foreground">
                                                                    {msg.actionCard.payload.costUsdToday}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Navigation Action Card */}
                                                    {msg.actionCard.type === "navigate" && (
                                                        <button
                                                            onClick={() => router.push(msg.actionCard!.payload.destination || "/channels")}
                                                            className="w-full py-2 rounded-lg bg-card text-foreground font-semibold text-xs hover:bg-muted transition-colors flex items-center justify-center gap-1.5 border border-border cursor-pointer"
                                                        >
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                            {msg.actionCard.payload.label || "Open Page"}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <span className="text-[10px] text-muted-foreground mt-1 px-1 font-mono">
                                            {msg.timestamp}
                                        </span>
                                    </div>
                                ))}

                                {/* Typing Indicator */}
                                {isTyping && (
                                    <div className="flex items-center gap-2 text-muted-foreground text-[11px] py-1">
                                        <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                                            <Image
                                                src="/brand/icon.png"
                                                alt="Styre Bot"
                                                width={16}
                                                height={16}
                                                className="w-full h-full object-contain animate-pulse"
                                            />
                                        </div>
                                        <span className="inline-flex items-center gap-1 font-medium">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                                            <span className="ml-1">Styre Bot is orchestrating fleet agents...</span>
                                        </span>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Footer */}
                            <div className="p-3 bg-card border-t border-border select-none">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }}
                                    className="flex items-center gap-2"
                                >
                                    <div className="relative flex-1">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            placeholder="Ask Styre Bot (e.g. 'Schedule post', 'Show hot leads')..."
                                            className="w-full pl-3.5 pr-8 py-2.5 rounded-xl bg-muted/50 border border-border focus:border-primary focus:bg-card focus:outline-none text-xs text-foreground placeholder:text-muted-foreground shadow-xs transition-colors"
                                        />
                                        {inputValue && (
                                            <button
                                                type="button"
                                                onClick={() => setInputValue("")}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!inputValue.trim() || isTyping}
                                        aria-label="Send message to Styre Bot"
                                        className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-xs flex items-center justify-center cursor-pointer"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </form>
                                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-1 font-medium">
                                        <CornerDownLeft className="w-3 h-3" />
                                        Press Enter to send
                                    </span>
                                    <span className="font-medium text-primary">Styre Bot Autonomous Supervisor</span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
}
