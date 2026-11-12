"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";
import { listConversationsApi, sendReplyApi, toggleEscalationApi } from "@/services/inboxService";

interface Conversation {
  id: string;
  senderName: string;
  senderRole: string;
  platform: "linkedin" | "instagram" | "twitter" | "facebook" | "whatsapp";
  platformLabel: string;
  lastMessage: string;
  time: string;
  intent: string;
  score: number;
  escalated: boolean;
  avatarText: string;
  messages: Array<{
    id: string;
    sender: "contact" | "agent" | "operator";
    senderName: string;
    text: string;
    time: string;
  }>;
}

const sampleConversations: Conversation[] = [
  {
    id: "conv-1",
    senderName: "Sarah Jenkins",
    senderRole: "VP of Marketing • Lumina Retail",
    platform: "linkedin",
    platformLabel: "LinkedIn InMail",
    lastMessage: "Hi Alex, we'd like to proceed with the enterprise social automation proposal...",
    time: "10:42 AM",
    intent: "High Intent (Score 94)",
    score: 94,
    escalated: false,
    avatarText: "SJ",
    messages: [
      {
        id: "m1",
        sender: "contact",
        senderName: "Sarah Jenkins",
        text: "Hello! We came across your agency's social growth case study. We are currently evaluating an autonomous social media management solution for Lumina Retail.",
        time: "10:15 AM",
      },
      {
        id: "m2",
        sender: "operator",
        senderName: "Alex Morgan",
        text: "Hi Sarah! Great to connect. Our SMMA AI platform orchestrates full inbound qualification, scheduled content publishing, and live response routing directly for retail brands.",
        time: "10:28 AM",
      },
      {
        id: "m3",
        sender: "contact",
        senderName: "Sarah Jenkins",
        text: "Hi Alex, we'd like to proceed with the enterprise social automation proposal. Can your team provide a security architecture walkthrough tomorrow?",
        time: "10:42 AM",
      },
    ],
  },
  {
    id: "conv-2",
    senderName: "David Chen",
    senderRole: "Growth Director • ScaleWave",
    platform: "linkedin",
    platformLabel: "LinkedIn InMail",
    lastMessage: "Does your agent automatically route inbound demo requests to our CRM?",
    time: "Yesterday",
    intent: "Technical Inquiry (Score 89)",
    score: 89,
    escalated: true,
    avatarText: "DC",
    messages: [
      {
        id: "m21",
        sender: "contact",
        senderName: "David Chen",
        text: "Does your agent automatically route inbound demo requests to our CRM?",
        time: "Yesterday 4:15 PM",
      },
      {
        id: "m22",
        sender: "agent",
        senderName: "AI Co-pilot",
        text: "Yes, our agent integrates with your CRM via webhooks and Google Sheets sync to record contact profiles and intent scores in real-time.",
        time: "Yesterday 4:16 PM",
      },
    ],
  },
  {
    id: "conv-3",
    senderName: "Elena Rostova",
    senderRole: "Creative Director • Forma Studios",
    platform: "instagram",
    platformLabel: "Instagram DM",
    lastMessage: "Can you confirm our scheduled reels for Thursday are synchronized?",
    time: "Oct 24",
    intent: "Scheduling Inquiry",
    score: 72,
    escalated: false,
    avatarText: "ER",
    messages: [
      {
        id: "m31",
        sender: "contact",
        senderName: "Elena Rostova",
        text: "Can you confirm our scheduled reels for Thursday are synchronized?",
        time: "Oct 24 2:30 PM",
      },
      {
        id: "m32",
        sender: "agent",
        senderName: "Publishing Agent",
        text: "Checked! Both reels are active in the publishing queue for 10:00 AM Thursday.",
        time: "Oct 24 2:31 PM",
      },
    ],
  },
  {
    id: "conv-4",
    senderName: "Marcus Vance",
    senderRole: "Founder • NextGen Velocity",
    platform: "twitter",
    platformLabel: "X (Twitter) DM",
    lastMessage: "Checking out your AI agents for omnichannel marketing.",
    time: "Oct 22",
    intent: "General Interest",
    score: 65,
    escalated: false,
    avatarText: "MV",
    messages: [
      {
        id: "m41",
        sender: "contact",
        senderName: "Marcus Vance",
        text: "Checking out your AI agents for omnichannel marketing.",
        time: "Oct 22 11:00 AM",
      },
    ],
  },
  {
    id: "conv-5",
    senderName: "Clara Gomez",
    senderRole: "Media Agency Lead • Pulse Media",
    platform: "whatsapp",
    platformLabel: "WhatsApp Business",
    lastMessage: "We saw the automated response, could we reschedule for 3 PM?",
    time: "Oct 21",
    intent: "Booking Reschedule",
    score: 82,
    escalated: false,
    avatarText: "CG",
    messages: [
      {
        id: "m51",
        sender: "contact",
        senderName: "Clara Gomez",
        text: "We saw the automated response, could we reschedule for 3 PM?",
        time: "Oct 21 09:12 AM",
      },
    ],
  },
];

export default function InboxPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [conversations, setConversations] = useState<Conversation[]>(sampleConversations);
  const [selectedId, setSelectedId] = useState<string>("conv-1");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    let mounted = true;
    listConversationsApi().then((data) => {
      if (mounted && data && data.length > 0) {
        setConversations(data as any);
        setSelectedId(data[0].id);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const selectedConv = conversations.find((c) => c.id === selectedId) || conversations[0];

  const filteredConversations = conversations.filter((c) => {
    const matchesPlatform = platformFilter === "all" || c.platform === platformFilter;
    const matchesSearch =
      !searchQuery ||
      c.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConv) return;

    setSendingReply(true);
    const newMsg = {
      id: Date.now().toString(),
      sender: "operator" as const,
      senderName: "Operator",
      text: replyText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    try {
      await sendReplyApi(selectedConv.id, replyText.trim());
    } catch {
      // Optimistic update fallback
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConv.id
          ? {
              ...c,
              lastMessage: replyText.trim(),
              time: "Just now",
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );
    setReplyText("");
    setSendingReply(false);
  };

  const handleToggleEscalation = async (id: string) => {
    const current = conversations.find((c) => c.id === id);
    const targetState = !current?.escalated;
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, escalated: targetState } : c))
    );
    try {
      await toggleEscalationApi(id, targetState);
    } catch {
      // Ignored for UI responsiveness
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full h-[calc(100vh-100px)]">
        {/* Top Header & State Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-md shrink-0">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Conversations & Inbound
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                Webhook Sync Live
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Omnichannel incoming inquiries, agent response logs, and human operator dispatch.
            </p>
          </div>

          {/* State Switcher Tabs */}
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
              Live Inbox
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
              Loading Skeleton
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
          </div>
        </div>

        {/* ============================================== */}
        {/* VIEW 1: LIVE INBOX (Master-Detail Split Pane)   */}
        {/* ============================================== */}
        {viewState === "live" && (
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs flex flex-col lg:flex-row flex-1 overflow-hidden border border-outline-variant/40">
            {/* Left Panel: Conversation List */}
            <div className="w-full lg:w-[380px] shrink-0 bg-surface-container-lowest flex flex-col h-full lg:border-r border-outline-variant/30">
              {/* Search & Channel Filter */}
              <div className="p-space-md pb-space-sm bg-surface-container-lowest flex flex-col gap-space-sm border-b border-outline-variant/30">
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-secondary text-[18px]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search messages or leads..."
                    className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low text-on-surface placeholder:text-secondary text-body-md font-body-md focus:outline-none focus:ring-2 focus:ring-primary-container/20 border border-outline-variant/30"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto py-1 text-xs">
                  {["all", "linkedin", "instagram", "twitter", "whatsapp"].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPlatformFilter(p)}
                      className={`px-2.5 py-1 rounded-md capitalize font-medium whitespace-nowrap transition-colors ${
                        platformFilter === p
                          ? "bg-primary-container text-white font-semibold"
                          : "bg-surface-container-low text-secondary hover:text-on-surface"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Conversation Feed */}
              <div className="flex-1 overflow-y-auto px-space-sm py-2 space-y-1 divide-y divide-outline-variant/20">
                {filteredConversations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-secondary">
                    No conversations match your filter.
                  </div>
                ) : (
                  filteredConversations.map((c) => {
                    const isSelected = c.id === selectedId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={`w-full p-space-md rounded-xl cursor-pointer transition-all duration-150 relative group ${
                          isSelected
                            ? "bg-surface-container-high/40 border border-primary-container/30"
                            : "hover:bg-surface-container-low"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-3 bottom-3 w-1 bg-primary-container rounded-r-full"></div>
                        )}
                        <div className="flex items-start gap-space-md pl-1">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-xs shadow-xs">
                              {c.avatarText}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-container-highest text-primary flex items-center justify-center text-[10px] font-bold ring-2 ring-surface-container-lowest">
                              {c.platform === "linkedin"
                                ? "in"
                                : c.platform === "instagram"
                                ? "ig"
                                : c.platform === "whatsapp"
                                ? "wa"
                                : "𝕏"}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                                {c.senderName}
                              </span>
                              <span className="font-caption text-caption text-secondary font-medium">
                                {c.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-caption font-caption text-secondary truncate text-[11px]">
                                {c.senderRole}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-container text-on-secondary-container whitespace-nowrap">
                                {c.platformLabel}
                              </span>
                              {c.escalated && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 flex items-center gap-0.5 whitespace-nowrap">
                                  <span className="material-symbols-outlined text-[12px]">
                                    warning
                                  </span>
                                  Escalated
                                </span>
                              )}
                              <span className="font-caption text-caption text-tertiary font-semibold flex items-center gap-0.5 text-[11px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>{" "}
                                {c.intent}
                              </span>
                            </div>
                            <p className="font-body-sm text-body-sm text-secondary truncate text-xs">
                              {c.lastMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Selected Conversation Thread */}
            {selectedConv ? (
              <div className="flex-1 flex flex-col h-full bg-surface-container-lowest">
                {/* Conversation Header Bar */}
                <div className="h-16 px-space-xl flex items-center justify-between bg-surface-container-lowest border-b border-outline-variant/30 shrink-0">
                  <div className="flex items-center gap-space-md min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-xs shrink-0">
                      {selectedConv.avatarText}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                          {selectedConv.senderName}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span> Score:{" "}
                          {selectedConv.score}/100
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-caption font-caption text-secondary text-xs">
                        <span className="truncate">{selectedConv.senderRole}</span>
                        <span>•</span>
                        <span className="truncate text-primary font-medium">
                          {selectedConv.platformLabel} (Synced)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Escalate toggle */}
                  <div className="flex items-center gap-space-sm shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleEscalation(selectedConv.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                        selectedConv.escalated
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-surface-container-low text-secondary hover:text-on-surface border-outline-variant/30"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {selectedConv.escalated ? "priority_high" : "escalator_warning"}
                      </span>
                      <span>{selectedConv.escalated ? "Escalated" : "Escalate to Human"}</span>
                    </button>
                  </div>
                </div>

                {/* Message History Feed */}
                <div className="flex-1 overflow-y-auto p-space-xl space-y-space-md bg-surface/40">
                  <div className="flex items-center justify-center my-space-sm">
                    <span className="px-3 py-1 rounded-full bg-surface-container text-secondary text-caption font-caption tracking-wide text-xs">
                      Today&apos;s Inbound Activity
                    </span>
                  </div>

                  {selectedConv.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-space-md max-w-2xl ${
                        msg.sender === "operator" ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 mt-1 shadow-xs ${
                          msg.sender === "operator"
                            ? "bg-primary-container text-on-primary"
                            : msg.sender === "agent"
                            ? "bg-primary text-white"
                            : "bg-surface-container-high text-on-surface"
                        }`}
                      >
                        {msg.sender === "operator" ? "AM" : msg.sender === "agent" ? "AI" : "SJ"}
                      </div>
                      <div
                        className={`flex flex-col gap-1 ${
                          msg.sender === "operator" ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-center gap-2 px-1 text-xs">
                          <span className="font-label-sm text-on-surface font-semibold">
                            {msg.senderName}
                          </span>
                          <span className="font-caption text-secondary">{msg.time}</span>
                        </div>
                        <div
                          className={`p-4 rounded-2xl text-body-md text-body-md leading-relaxed ${
                            msg.sender === "operator"
                              ? "bg-primary-container text-on-primary rounded-tr-xs"
                              : msg.sender === "agent"
                              ? "bg-surface-container text-on-surface rounded-tl-xs border border-outline-variant/30"
                              : "bg-surface-container-lowest text-on-surface rounded-tl-xs shadow-xs border border-outline-variant/30"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Manual Reply Composer Area */}
                <div className="p-space-md bg-surface-container-lowest border-t border-outline-variant/30 shrink-0">
                  <form onSubmit={handleSendReply} className="flex flex-col gap-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Draft human reply to ${selectedConv.senderName} via ${selectedConv.platformLabel}...`}
                      rows={2}
                      className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-sm placeholder:text-secondary focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container transition-all border border-outline-variant/40 resize-none"
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-secondary">
                        Press Send to dispatch manual operator response
                      </span>
                      <button
                        type="submit"
                        disabled={sendingReply || !replyText.trim()}
                        className="px-4 py-2 rounded-lg bg-primary-container text-on-primary hover:bg-primary transition-colors flex items-center gap-1.5 text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        <span>{sendingReply ? "Dispatching..." : "Send Manual Reply"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-secondary">
                Select a conversation to view message history.
              </div>
            )}
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 2: LOADING SKELETON                       */}
        {/* ============================================== */}
        {viewState === "loading" && (
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-xs flex flex-1 overflow-hidden border border-outline-variant/40 animate-pulse">
            <div className="w-[380px] p-4 border-r border-outline-variant/30 space-y-4">
              <div className="h-9 bg-surface-container-low rounded-lg"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 bg-surface-container-low rounded-xl"></div>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6 space-y-6">
              <div className="h-12 bg-surface-container-low rounded-lg w-1/3"></div>
              <div className="h-32 bg-surface-container-low rounded-xl"></div>
              <div className="h-24 bg-surface-container-low rounded-xl ml-auto w-2/3"></div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 3: EMPTY STATE                            */}
        {/* ============================================== */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
              <span className="material-symbols-outlined text-[32px]">inbox</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              No conversations yet
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
              Incoming direct messages, comments, and WhatsApp chats will appear here as social channels are connected and webhooks receive inbound traffic.
            </p>
            <a
              href="/channels"
              className="px-5 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">link</span>
              Configure Social Channels
            </a>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 4: API ERROR                              */}
        {/* ============================================== */}
        {viewState === "error" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-8 max-w-lg mx-auto my-12 border-t-4 border-error border-x border-b border-outline-variant/40 text-center">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Inbox Sync Failed (503 Service Unavailable)
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-2 mb-space-md">
              Could not retrieve conversation records from Express inbox router. Check network connectivity or retry.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-on-error-container transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Inbox Retrieval
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

