"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  RefreshCw,
  Send,
  Sparkles,
  Paperclip,
  Smile,
  Copy,
  Star,
  Tag,
  Archive,
  MoreVertical,
  Check,
  FileText,
  Clock,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Bot,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetThreadsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useTriggerAiDraftMutation,
  type InboxThreadDto,
  type InboxMessageDto,
} from "@/redux/api/inboxApi";
import { useWebSocketTopic } from "@/hooks/useWebSocketTopic";

const CHANNELS = ["All", "LinkedIn", "Instagram", "Facebook", "WhatsApp", "Email"] as const;

function fmtTime(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] || "?") + (parts[1]?.[0] || "");
}

function normalizeChannel(ch?: string | null) {
  if (!ch) return "Email";
  const v = ch.toLowerCase();
  if (v.includes("linkedin")) return "LinkedIn";
  if (v.includes("instagram")) return "Instagram";
  if (v.includes("facebook")) return "Facebook";
  if (v.includes("whatsapp")) return "WhatsApp";
  return "Email";
}

function extractSuggestionText(s: unknown): string {
  if (!s) return "";
  if (typeof s === "string") return s;
  if (typeof s === "object") {
    const o = s as Record<string, unknown>;
    for (const k of ["reply", "text", "message", "suggestion", "draft", "content"]) {
      if (typeof o[k] === "string") return o[k] as string;
    }
  }
  try {
    return JSON.stringify(s);
  } catch {
    return String(s);
  }
}

export default function InboxPage() {
  const { data: threadsData, isLoading: threadsLoading, isFetching: threadsFetching, error: threadsError, refetch } =
    useGetThreadsQuery({ limit: 50 });
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [activeChannelFilter, setActiveChannelFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [composerText, setComposerText] = useState<string>("");
  const [isEscalated, setIsEscalated] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [aiDraft, setAiDraft] = useState<string>("");

  const threads = useMemo(() => threadsData?.threads ?? [], [threadsData?.threads]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedThreadId && threads.length) setSelectedThreadId(threads[0].id);
    if (selectedThreadId && threads.length && !threads.some((t) => t.id === selectedThreadId)) {
      setSelectedThreadId(threads[0].id);
    }
  }, [threads, selectedThreadId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const selectedThread: InboxThreadDto | undefined = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? threads[0],
    [threads, selectedThreadId]
  );

  const { data: messagesData, isLoading: messagesLoading, isFetching: messagesFetching, refetch: refetchMessages } = useGetMessagesQuery(
    selectedThread?.id ?? "",
    { skip: !selectedThread?.id }
  );

  // Live WebSocket for incoming messages and AI-generated drafts
  useWebSocketTopic<{ event_type?: string }>("notifications", () => {
    void refetch();
    void refetchMessages();
  });
  useWebSocketTopic<{ event_type?: string }>("copilot", () => {
    void refetchMessages();
  });

  const [sendMessage, { isLoading: sending }] = useSendMessageMutation();
  const [triggerAiDraft, { isLoading: drafting }] = useTriggerAiDraftMutation();

  const filteredThreads = useMemo(() => {
    return threads.filter((t) => {
      const ch = normalizeChannel(t.channel);
      const matchesChannel = activeChannelFilter === "All" || ch === activeChannelFilter;
      const q = searchQuery.toLowerCase();
      const name = (t.contact_name || t.external_sender_id || "").toLowerCase();
      const email = (t.contact_email || "").toLowerCase();
      const thread = (t.thread_key || "").toLowerCase();
      return matchesChannel && (!q || name.includes(q) || email.includes(q) || thread.includes(q));
    });
  }, [threads, activeChannelFilter, searchQuery]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setAiDraft("");
    setComposerText("");
    setIsEscalated(false);
  }, [selectedThread?.id]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleCopy = (text: string, field: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Copied ${field}`);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleSendMessage = async () => {
    const text = composerText.trim();
    if (!text || !selectedThread?.id) return;
    try {
      const res = await sendMessage({ threadId: selectedThread.id, message: text }).unwrap();
      if (!res?.success) throw new Error(res?.error || "Send failed");
      setComposerText("");
      setAiDraft("");
      toast.success("Message dispatched");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send message";
      toast.error(msg);
    }
  };

  const handleGenerateDraft = async () => {
    if (!selectedThread?.id) return;
    try {
      const res = await triggerAiDraft({ threadId: selectedThread.id }).unwrap();
      if (!res?.success) throw new Error(res?.error || "Draft failed");
      const text = extractSuggestionText(res.suggestion);
      setAiDraft(text);
      if (text) setComposerText(text);
      toast.success("AI draft generated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to generate AI draft";
      toast.error(msg);
    }
  };

  const messages = messagesData?.messages ?? [];
  const selectedName = selectedThread?.contact_name || selectedThread?.external_sender_id || "Unknown contact";
  const selectedEmail = selectedThread?.contact_email || "—";
  const selectedChannel = normalizeChannel(selectedThread?.channel);

  return (
    <div className="w-full h-[calc(100vh-6.5rem)] min-h-[640px] flex overflow-hidden rounded-xl border border-outline-variant/80 bg-surface-container-lowest shadow-sm">
      {/* LEFT PANE: Conversation Directory */}
      <section aria-label="Conversation list" className="w-80 shrink-0 flex flex-col h-full bg-surface-container-lowest border-r border-outline-variant/80">
        <div className="px-4 py-3.5 flex items-center justify-between border-b border-surface-container">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-on-surface">Inbox</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-secondary">
              {threads.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors" title="Filter list">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => { void refetch(); toast.success("Inbox refreshed"); }}
              className="p-1 rounded-md text-secondary hover:text-on-surface hover:bg-surface-container transition-colors"
              title="Sync live feeds"
            >
              <RefreshCw className={`w-4 h-4 ${threadsFetching ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="p-2.5 border-b border-surface-container">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations or contacts..."
              className="w-full h-8 pl-8 pr-3 rounded bg-surface-container-low border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container transition-colors"
            />
          </div>
        </div>

        <div className="px-2.5 py-2 border-b border-surface-container overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {CHANNELS.map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannelFilter(ch)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                activeChannelFilter === ch
                  ? "bg-primary-container text-on-primary shadow-sm"
                  : "bg-surface-container hover:bg-surface-container-high text-secondary hover:text-on-surface"
              }`}
            >
              {ch}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-surface-container">
          {threadsLoading && <div className="p-4 text-xs text-secondary">Loading threads...</div>}
          {threadsError && <div className="p-4 text-xs text-error">Failed to load inbox threads.</div>}
          {!threadsLoading && !threadsError && filteredThreads.length === 0 && (
            <div className="p-4 text-xs text-secondary">No conversations found.</div>
          )}
          {filteredThreads.map((thread) => {
            const isSelected = thread.id === selectedThread?.id;
            const ch = normalizeChannel(thread.channel);
            const name = thread.contact_name || thread.external_sender_id || "Unknown";
            return (
              <article
                key={thread.id}
                onClick={() => setSelectedThreadId(thread.id)}
                className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                  isSelected ? "bg-surface-container-low border-l-4 border-primary-container" : "bg-surface-container-lowest hover:bg-surface-container-low/60"
                }`}
              >
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant text-xs font-bold">
                    {initials(name)}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-xs">
                    <span className="text-[10px] font-bold text-primary-container">
                      {ch === "LinkedIn" && "in"}
                      {ch === "Instagram" && "ig"}
                      {ch === "Facebook" && "fb"}
                      {ch === "WhatsApp" && "wa"}
                      {ch === "Email" && "✉"}
                    </span>
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-semibold text-on-surface truncate">{name}</span>
                    <span className="text-[11px] text-outline font-mono shrink-0">{fmtTime(thread.last_message_at)}</span>
                  </div>
                  <p className="text-xs text-secondary truncate mb-1.5">{thread.thread_key || thread.status || "Conversation"}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-secondary">
                      {thread.status || ch}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* CENTER PANE */}
      <main aria-label="Conversation stream" className="flex-1 flex flex-col h-full bg-surface min-w-0 border-r border-outline-variant/80">
        <header className="px-5 py-3 bg-surface-container-lowest border-b border-surface-container flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface truncate">{selectedName}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-surface-container-low text-primary-container">
                  {selectedChannel}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container animate-pulse" />
                <span className="text-[11px] text-secondary truncate">{selectedThread?.status || "Live thread"}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 text-secondary">
            <button onClick={() => toast.success("Starred thread")} className="p-1.5 rounded-md hover:bg-surface-container hover:text-on-surface transition-colors" title="Bookmark"><Star className="w-4 h-4" /></button>
            <button onClick={() => toast("Label menu opened", { icon: "🏷️" })} className="p-1.5 rounded-md hover:bg-surface-container hover:text-on-surface transition-colors" title="Add label"><Tag className="w-4 h-4" /></button>
            <button onClick={() => toast.success("Thread archived")} className="p-1.5 rounded-md hover:bg-surface-container hover:text-on-surface transition-colors" title="Archive"><Archive className="w-4 h-4" /></button>
            <button onClick={() => toast("Options opened", { icon: "⚙️" })} className="p-1.5 rounded-md hover:bg-surface-container hover:text-on-surface transition-colors" title="More"><MoreVertical className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {!selectedThread && !threadsLoading && <div className="text-xs text-secondary">Select a conversation to view messages.</div>}
          {(messagesLoading || messagesFetching) && <div className="text-xs text-secondary">Loading messages...</div>}
          {!messagesLoading && selectedThread && messages.length === 0 && (
            <div className="text-xs text-secondary">No messages in this thread yet.</div>
          )}
          {messages.map((msg: InboxMessageDto) => {
            const inbound = (msg.direction || "").toLowerCase() === "inbound";
            const body = msg.body || "";
            const ts = fmtTime(msg.created_at);
            if (inbound) {
              return (
                <div key={msg.id} className="flex flex-col items-start max-w-lg">
                  <div className="bg-surface-container-lowest border border-outline-variant/80 rounded-2xl rounded-tl-sm p-3.5 text-on-surface shadow-xs">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap">{body}</p>
                  </div>
                  <span className="text-[10px] text-outline mt-1 pl-1">{ts}</span>
                </div>
              );
            }
            return (
              <div key={msg.id} className="flex flex-col items-end max-w-lg ml-auto">
                <div className="bg-primary-container text-on-primary rounded-2xl rounded-tr-sm p-3.5 shadow-xs">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap">{body}</p>
                </div>
                <div className="flex items-center gap-1 mt-1 pr-1 text-[10px] text-secondary">
                  <Bot className="w-3 h-3 text-primary-container" />
                  <span>{ts}{msg.sender ? ` • ${msg.sender}` : ""}</span>
                </div>
              </div>
            );
          })}
        </div>

        {selectedThread && (
          <section aria-label="AI Recommendation" className="mx-5 mb-3 p-3.5 rounded-xl bg-gradient-to-r from-surface-container-low via-surface-container-lowest to-surface-container-lowest border border-primary-fixed-dim/80 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-primary-container">
                <Sparkles className="w-4 h-4" />
                <h2 className="text-xs font-bold text-on-surface">AI draft</h2>
              </div>
              <button
                onClick={() => void handleGenerateDraft()}
                disabled={drafting}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant hover:opacity-90 disabled:opacity-50"
              >
                {drafting ? "Generating..." : "Generate draft"}
              </button>
            </div>
            <div className="text-xs text-on-surface mb-2.5 leading-relaxed bg-surface-container-lowest/60 p-2 rounded-lg border border-surface-container min-h-[48px] whitespace-pre-wrap">
              {aiDraft ? `"${aiDraft}"` : "Generate an AI reply draft for this thread."}
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-surface-container">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { if (aiDraft) setComposerText(aiDraft); }}
                  disabled={!aiDraft}
                  className="h-7 px-2.5 rounded bg-surface-container-lowest border border-outline-variant text-on-surface text-xs font-medium hover:bg-surface-container transition-colors disabled:opacity-40"
                >
                  Use draft
                </button>
              </div>
              <span className="text-[11px] text-secondary flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" />
                Live via /inbox threads
              </span>
            </div>
          </section>
        )}

        <footer className="p-3 bg-surface-container-lowest border-t border-surface-container flex items-center gap-2 shrink-0">
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              value={composerText}
              onChange={(e) => setComposerText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              disabled={!selectedThread || sending}
              placeholder={selectedThread ? "Type a reply..." : "Select a thread to reply"}
              className="w-full h-9 pl-3.5 pr-16 rounded bg-surface-container-low border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container transition-colors disabled:opacity-50"
            />
            <div className="absolute right-2 flex items-center gap-1 text-secondary">
              <button onClick={() => toast("Attachment upload not wired", { icon: "📎" })} className="p-1 hover:text-on-surface transition-colors" title="Attach file"><Paperclip className="w-4 h-4" /></button>
              <button onClick={() => toast("Emoji picker (mock)", { icon: "😊" })} className="p-1 hover:text-on-surface transition-colors" title="Insert emoji"><Smile className="w-4 h-4" /></button>
            </div>
          </div>
          <button
            onClick={() => void handleSendMessage()}
            disabled={!composerText.trim() || !selectedThread || sending}
            className="h-9 w-9 shrink-0 rounded bg-primary-container text-on-primary flex items-center justify-center shadow-sm hover:bg-primary transition-colors disabled:opacity-40"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </footer>
      </main>

      {/* RIGHT PANE */}
      <aside aria-label="Lead profile and controls" className="w-[300px] shrink-0 bg-surface-container-lowest h-full overflow-y-auto p-4 flex flex-col gap-5 border-l border-outline-variant/60">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed-variant text-lg font-bold shadow-xs">
              {initials(selectedName)}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-tertiary-container ring-2 ring-surface-container-lowest" />
          </div>
          <h2 className="text-sm font-bold text-on-surface mt-2">{selectedName}</h2>
          <p className="text-xs text-secondary">{selectedChannel} conversation</p>
          <div className="mt-1.5">
            <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-secondary border border-surface-container">
              {selectedThread?.status || "Thread"}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-low/60 rounded-lg p-2.5 space-y-2 border border-surface-container">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Mail className="w-3.5 h-3.5 text-outline shrink-0" />
              <span className="text-on-surface truncate">{selectedEmail}</span>
            </div>
            <button onClick={() => handleCopy(selectedEmail, "Email")} className="p-1 text-secondary hover:text-on-surface transition-colors" title="Copy email" disabled={selectedEmail === "—"}>
              {copiedField === "Email" ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Phone className="w-3.5 h-3.5 text-outline shrink-0" />
              <span className="text-on-surface truncate">—</span>
            </div>
            <button className="p-1 text-secondary" title="Copy phone" disabled><Copy className="w-3 h-3 opacity-30" /></button>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-outline shrink-0" />
            <span className="text-on-surface truncate">—</span>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-outline uppercase tracking-wider">Thread key</label>
          <div className="w-full min-h-8 px-2.5 py-1.5 rounded bg-surface-container-low border border-outline-variant flex items-center justify-between text-xs font-semibold text-on-surface gap-2">
            <span className="truncate">{selectedThread?.thread_key || "—"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-outline shrink-0 opacity-40" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-outline uppercase tracking-wider">Thread info</label>
            <span className="text-[10px] text-outline font-medium">Live</span>
          </div>
          <div className="p-2.5 rounded bg-surface-container-low border border-outline-variant text-xs text-secondary leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /><span>ID: {selectedThread?.id || "—"}</span></div>
            <div>Last activity: {fmtTime(selectedThread?.last_message_at) || "—"}</div>
            <div>Messages loaded: {messages.length}</div>
          </div>
        </div>

        <div className="mt-auto p-3 rounded-xl bg-surface-container-low border border-outline-variant/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface">Escalate to human</span>
            <button
              type="button"
              role="switch"
              aria-checked={isEscalated}
              onClick={() => {
                const next = !isEscalated;
                setIsEscalated(next);
                if (next) toast.error("Manual intervention marked (UI state)");
                else toast.success("AI autopilot state restored");
              }}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${isEscalated ? "bg-error" : "bg-outline-variant"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-surface-container-lowest shadow-sm transition-transform duration-200 mt-0.5 ${isEscalated ? "translate-x-4" : "translate-x-0.5"}`} />
            </button>
          </div>
          <p className={`text-[11px] font-semibold ${isEscalated ? "text-error" : "text-tertiary-container"}`}>
            {isEscalated ? "Manual Intervention (local)" : "AI Autopilot active"}
          </p>
        </div>
      </aside>
    </div>
  );
}
