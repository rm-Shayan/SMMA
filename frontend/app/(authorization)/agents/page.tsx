"use client";

import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";

interface Message {
  id: string;
  sender: "user" | "agent";
  text: string;
  time: string;
  agentName?: string;
  leadScore?: number;
  stage?: string;
  requiresReview?: boolean;
  trace?: string;
}

export default function AgentWorkspacePage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [inputText, setInputText] = useState("");
  const [selectedChannel, setSelectedChannel] = useState("CRM_INBOX");
  const [selectedDirectAgent, setSelectedDirectAgent] = useState("");
  const [traceOpen, setTraceOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "user",
      text: "Can you summarize high-priority inbound leads captured from our LinkedIn campaign today?",
      time: "10:24 AM",
    },
    {
      id: "2",
      sender: "agent",
      agentName: "support_closer",
      text: "Here is the summary of high-priority leads captured across your LinkedIn Enterprise campaign today. Two qualified leads have been detected with score 80+ and logged into Leads table.",
      leadScore: 94,
      stage: "PROPOSAL_REQUESTED",
      requiresReview: false,
      trace: "Supervisor -> routing -> support_closer -> lead_scoring (score: 94) -> SheetSync v2 (Success)",
      time: "10:24 AM",
    },
  ]);

  const channelOptions = [
    { value: "CRM_LIVE_CHAT", label: "CRM Live Chat" },
    { value: "CRM_INBOX", label: "CRM Inbox" },
    { value: "INSTAGRAM", label: "Instagram DMs" },
    { value: "FACEBOOK", label: "Facebook Messenger" },
    { value: "WHATSAPP", label: "WhatsApp Business" },
    { value: "LINKEDIN", label: "LinkedIn InMail" },
    { value: "TWITTER", label: "X (Twitter) DMs" },
    { value: "EMAIL", label: "Operations Email" },
  ];

  const directAgentOptions = [
    { value: "", label: "Auto Router (Supervisor)" },
    { value: "dm_handler", label: "DM Handler" },
    { value: "support_closer", label: "Support & Closer" },
    { value: "researcher", label: "Market Researcher" },
    { value: "comment_reply", label: "Comment Reply Agent" },
    { value: "analytics", label: "Analytics Reporter" },
    { value: "trend_planner", label: "Trend Planner" },
    { value: "publisher", label: "Post Publisher" },
    { value: "self_comment", label: "Self-Comment Node" },
  ];

  useEffect(() => {
    if (scrollRef.current && viewState === "live") {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, viewState]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");

    // Simulate Agent execution
    setTimeout(() => {
      const agentMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "agent",
        agentName: selectedDirectAgent || "supervisor_core",
        text: `Processed task across ${selectedChannel} using agent node [${
          selectedDirectAgent || "auto_supervisor"
        }]. Execution verified with status code 200 OK.`,
        leadScore: 88,
        stage: "QUALIFIED_HOT",
        requiresReview: false,
        trace: `Node [${selectedDirectAgent || "auto"}] dispatched at ${new Date().toISOString()} via ${selectedChannel}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, agentMsg]);
    }, 800);
  };

  const handleApplyPrompt = (prompt: string) => {
    setInputText(prompt);
    setViewState("live");
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full h-[calc(100vh-100px)]">
        {/* Top Operational Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-md shrink-0">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Agent Workspace
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse"></span>
                Operational • Apex Growth Partners
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Real-time orchestration across leads, publishing calendar, and connected social channels.
            </p>
          </div>

          {/* State Switcher Pills */}
          <div className="flex items-center flex-wrap gap-1 bg-surface-container-low p-1 rounded-xl shadow-xs border border-outline-variant/30 text-xs">
            <button
              onClick={() => setViewState("live")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "live"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">chat</span>
              Active Chat
            </button>
            <button
              onClick={() => setViewState("loading")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "loading"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px] animate-spin">sync</span>
              Processing
            </button>
            <button
              onClick={() => setViewState("empty")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "empty"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">inbox</span>
              Empty State
            </button>
            <button
              onClick={() => setViewState("error")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "error"
                  ? "bg-error text-white shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">error_outline</span>
              API Error
            </button>
            <button
              onClick={() => {
                setMessages([]);
                setViewState("empty");
              }}
              className="px-3 py-1 rounded-lg text-secondary hover:text-error hover:bg-error-container/40 transition-colors font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5"
              title="Reset conversation stream"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              Restart
            </button>
          </div>
        </div>

        {/* Main Unified Workspace Card Canvas */}
        <div className="bg-surface-container-lowest rounded-xl shadow-xs flex flex-col flex-1 overflow-hidden border border-outline-variant/40">
          {/* Workspace Subheader: Status & Telemetry Bar */}
          <div className="px-space-lg py-space-sm bg-surface-container-lowest flex items-center justify-between border-b border-outline-variant/30 text-xs shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-space-lg flex-wrap">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-label-sm text-label-sm text-on-surface">
                  Agent: <strong className="font-medium text-primary-container">SMMA Omnichannel Core</strong>
                </span>
              </div>
              <div className="hidden md:flex items-center gap-space-md text-secondary font-caption text-caption">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">link</span>
                  4 Channels Connected
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  Latency: 28ms
                </span>
                <span>•</span>
                <span>Context: Apex Growth Partners (ID: #TEN-8841)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-secondary-container text-on-secondary-container font-label-sm text-[10px] uppercase tracking-wide font-semibold">
                Auto-Syncing
              </span>
            </div>
          </div>

          {/* Dynamic Scrollable Chat Canvas */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-space-xl space-y-space-lg bg-surface-container-low/20"
          >
            {/* VIEW STATE 1: ACTIVE / LIVE CONVERSATION */}
            {viewState === "live" && (
              <div className="space-y-space-lg flex flex-col">
                {/* Context Welcome Banner */}
                <div className="rounded-xl p-space-md bg-surface-container-lowest border border-outline-variant/30 shadow-xs flex items-start gap-space-md">
                  <div className="w-8 h-8 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                        SMMA Autonomous Hub
                      </span>
                      <span className="font-caption text-caption text-secondary">
                        Channel Sync Active
                      </span>
                    </div>
                    <p className="font-body-md text-body-md text-secondary mt-1">
                      Welcome to your SMMA AI Agent Workspace. Your autonomous supervisor is active across connected channels (LinkedIn, Instagram, X, Facebook) for <strong>Apex Growth Partners</strong>.
                    </p>
                  </div>
                </div>

                {/* Messages List */}
                {messages.map((m) => (
                  <div key={m.id} className="flex flex-col space-y-2">
                    {m.sender === "user" ? (
                      <div className="flex items-start justify-end gap-space-sm pl-8 md:pl-16">
                        <div className="flex flex-col items-end max-w-2xl">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                              Alex Morgan
                            </span>
                            <span className="font-caption text-caption text-secondary">{m.time}</span>
                          </div>
                          <div className="rounded-2xl rounded-tr-xs px-space-lg py-space-md bg-primary-container text-on-primary shadow-xs">
                            <p className="font-body-md text-body-md leading-relaxed">{m.text}</p>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-6 shadow-xs">
                          AM
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-space-sm pr-8 md:pr-16">
                        <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 mt-6 shadow-xs">
                          <span className="material-symbols-outlined text-[17px]">smart_toy</span>
                        </div>
                        <div className="flex flex-col items-start max-w-3xl w-full">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-label-sm text-label-sm text-primary font-semibold">
                              SMMA AI Agent
                            </span>
                            {m.agentName && (
                              <span className="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[10px] text-secondary">
                                node: {m.agentName}
                              </span>
                            )}
                            {m.leadScore && (
                              <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-200">
                                Lead Score: {m.leadScore}/100
                              </span>
                            )}
                            {m.stage && (
                              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                                {m.stage}
                              </span>
                            )}
                            <span className="font-caption text-caption text-secondary">{m.time}</span>
                          </div>

                          <div className="rounded-2xl rounded-tl-xs p-space-lg bg-surface-container-lowest border border-outline-variant/30 shadow-xs text-on-surface space-y-space-md w-full">
                            <p className="font-body-md text-body-md leading-relaxed text-on-surface">
                              {m.text}
                            </p>

                            {/* Human Review Indicator when flagged */}
                            {m.requiresReview && (
                              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg flex items-center gap-2 text-xs text-amber-800">
                                <span className="material-symbols-outlined text-[18px] text-amber-600">
                                  rate_review
                                </span>
                                <span>
                                  <strong>Human Review Required:</strong> High-risk or sensitive inquiry flagged by supervisor.
                                </span>
                              </div>
                            )}

                            {/* Collapsible Execution Trace */}
                            {m.trace && (
                              <div className="pt-2 border-t border-outline-variant/30">
                                <button
                                  type="button"
                                  onClick={() => setTraceOpen(!traceOpen)}
                                  className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {traceOpen ? "expand_less" : "expand_more"}
                                  </span>
                                  {traceOpen ? "Hide Execution Trace" : "View Execution Trace"}
                                </button>
                                {traceOpen && (
                                  <pre className="mt-2 p-2.5 bg-surface-container-low rounded-lg font-mono text-[11px] text-secondary overflow-x-auto border border-outline-variant/30">
                                    {m.trace}
                                  </pre>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* VIEW STATE 2: LOADING / PROCESSING */}
            {viewState === "loading" && (
              <div className="space-y-space-lg">
                <div className="flex items-start justify-end gap-space-sm pl-12 opacity-80">
                  <div className="flex flex-col items-end max-w-2xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                        Alex Morgan
                      </span>
                      <span className="font-caption text-caption text-secondary">Just now</span>
                    </div>
                    <div className="rounded-2xl rounded-tr-xs px-space-lg py-space-md bg-primary-container text-on-primary shadow-xs">
                      <p className="font-body-md text-body-md leading-relaxed">
                        Scan all connected social channels for urgent unread DMs and generate an escalation report.
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-bold text-xs shrink-0 mt-6">
                    AM
                  </div>
                </div>

                <div className="flex items-start gap-space-sm pr-12 animate-in fade-in duration-300">
                  <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shrink-0 mt-2 shadow-xs">
                    <span className="material-symbols-outlined text-[17px] animate-spin">
                      sync
                    </span>
                  </div>
                  <div className="rounded-2xl rounded-tl-xs p-space-lg bg-surface-container-lowest border border-outline-variant/30 shadow-xs text-on-surface max-w-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1.5">
                        <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2.5 h-2.5 bg-primary-container rounded-full animate-bounce"></div>
                      </div>
                      <span className="font-label-md text-label-md font-semibold text-primary">
                        SMMA AI Agent is analyzing channel data and preparing response...
                      </span>
                    </div>
                    <div className="pl-6 space-y-1.5 font-caption text-caption text-secondary">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-tertiary">
                          check
                        </span>
                        <span>Connecting to Instagram Graph & LinkedIn InMail gateways</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-primary animate-pulse">
                          radio_button_checked
                        </span>
                        <span className="text-on-surface font-medium">
                          Evaluating 14 captured inquiries against client priority score rules...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW STATE 3: EMPTY STATE */}
            {viewState === "empty" && (
              <div className="h-full flex flex-col items-center justify-center py-12 px-space-md text-center">
                <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
                  <span className="material-symbols-outlined text-[32px]">forum</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
                  No active conversation
                </h2>
                <p className="font-body-md text-body-md text-secondary max-w-md mt-2 mb-space-xl">
                  Start a conversation with your agency AI agent to review lead qualification status, draft channel responses, or monitor publishing queues.
                </p>

                {/* Prompt Suggestions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-space-sm max-w-2xl flex-wrap">
                  <button
                    onClick={() => handleApplyPrompt("Summarize today's hot leads across all channels")}
                    className="px-space-md py-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/40 shadow-xs hover:border-primary-container hover:text-primary transition-all text-left font-label-md text-label-md text-on-surface flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-primary-container text-[18px]">
                      bolt
                    </span>
                    Summarize today&apos;s hot leads
                  </button>
                  <button
                    onClick={() => handleApplyPrompt("Check tomorrow's scheduled posts queue")}
                    className="px-space-md py-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/40 shadow-xs hover:border-primary-container hover:text-primary transition-all text-left font-label-md text-label-md text-on-surface flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-tertiary-container text-[18px]">
                      calendar_month
                    </span>
                    Check tomorrow&apos;s scheduled posts queue
                  </button>
                  <button
                    onClick={() => handleApplyPrompt("View LinkedIn routing activity")}
                    className="px-space-md py-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/40 shadow-xs hover:border-primary-container hover:text-primary transition-all text-left font-label-md text-label-md text-on-surface flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-secondary text-[18px]">
                      alt_route
                    </span>
                    View LinkedIn routing activity
                  </button>
                </div>
              </div>
            )}

            {/* VIEW STATE 4: API ERROR */}
            {viewState === "error" && (
              <div className="h-full flex flex-col items-center justify-center py-12 px-space-md">
                <div className="w-full max-w-lg p-space-xl rounded-xl bg-error-container/30 border border-error/30 shadow-xs flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-space-md">
                    <span className="material-symbols-outlined text-[28px]">cloud_off</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold uppercase tracking-wider mb-2">
                    Gateway Timeout
                  </span>
                  <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
                    Agent Connection Failed
                  </h2>
                  <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
                    Unable to reach the SMMA AI agent cluster. Network timeout while connecting to tenant gateway for Apex Growth Partners.
                  </p>
                  <div className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-space-md text-left font-caption text-caption text-secondary space-y-1 mb-space-lg">
                    <div className="flex justify-between">
                      <span>Error Code:</span>
                      <span className="font-mono text-error font-medium">ERR_AI_ROUTER_SOCKET_CLOSED</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Gateway Target:</span>
                      <span className="font-mono text-on-surface">cluster-us-east.smma-core.io</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setViewState("live")}
                    className="px-space-xl py-space-sm rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary shadow-xs transition-all flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Retry Connection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Dock: Controls & Message Input */}
          <div className="p-space-md bg-surface-container-lowest border-t border-outline-variant/30 flex flex-col gap-2 shrink-0">
            {/* Control Bar: Channel and Direct Agent Selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-secondary">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  tune
                </span>
                <span className="font-medium text-on-surface">Channel:</span>
                <select
                  value={selectedChannel}
                  onChange={(e) => setSelectedChannel(e.target.value)}
                  className="px-2 py-1 rounded bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                >
                  {channelOptions.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-secondary ml-auto sm:ml-4">
                <span className="material-symbols-outlined text-[16px] text-secondary">
                  precision_manufacturing
                </span>
                <span className="font-medium text-on-surface">Direct Agent:</span>
                <select
                  value={selectedDirectAgent}
                  onChange={(e) => setSelectedDirectAgent(e.target.value)}
                  className="px-2 py-1 rounded bg-surface-container-low border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                >
                  {directAgentOptions.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="relative flex items-center w-full">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask your agent about leads, conversations, channels, or scheduled posts..."
                className="w-full h-11 pl-space-md pr-24 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all border border-outline-variant/40"
              />
              <div className="absolute right-1.5 flex items-center gap-1.5">
                <button
                  type="submit"
                  className="h-8 px-3.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary shadow-xs transition-colors flex items-center justify-center gap-1 font-label-md text-label-md"
                >
                  <span>Run</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </form>

            {/* Bottom Status Indicators */}
            <div className="flex items-center justify-between px-space-xs font-caption text-caption text-secondary flex-wrap gap-1">
              <div className="flex items-center gap-space-md">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-tertiary-container"></span>
                  Agent Status: <strong className="text-on-surface font-medium">Connected</strong>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Tenant: <strong>Apex Growth Partners</strong></span>
              </div>
              <div className="flex items-center gap-space-md">
                <span className="hidden md:inline">Channels: LinkedIn • IG • X • Facebook</span>
                <span className="text-secondary font-mono text-[10px]">SMMA AI Core v2.4</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

