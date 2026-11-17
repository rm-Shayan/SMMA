"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Send,
  Sparkles,
  Zap,
  Terminal,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface StreamMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
}

export default function AgentStreamPage() {
  const [prompt, setPrompt] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [messages, setMessages] = useState<StreamMessage[]>([
    {
      id: "init",
      sender: "agent",
      text: "Connected to Styre-BOT real-time agent execution stream. Enter an operational objective or command to observe token-by-token reasoning.",
      timestamp: "Ready",
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = prompt.trim();
    if (!query || isStreaming) return;

    const userMsg: StreamMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt("");
    setIsStreaming(true);

    const agentMsgId = `agent-${Date.now()}`;
    const agentMsg: StreamMessage = {
      id: agentMsgId,
      sender: "agent",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, agentMsg]);

    try {
      const response = await fetch("/api/v1/orchestration/copilot/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`Stream HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      if (!reader) throw new Error("No readable stream available");

      let done = false;
      let accumulated = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") {
                done = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.token) {
                  accumulated += parsed.token;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === agentMsgId ? { ...msg, text: accumulated } : msg
                    )
                  );
                } else if (parsed.error) {
                  accumulated += `\n[Error: ${parsed.error}]`;
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === agentMsgId ? { ...msg, text: accumulated } : msg
                    )
                  );
                }
              } catch {
                // partial raw text
                accumulated += dataStr;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === agentMsgId ? { ...msg, text: accumulated } : msg
                  )
                );
              }
            }
          }
        }
      }
    } catch (err: unknown) {
      const e = err as Error;
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsgId
            ? { ...msg, text: `[Stream interrupted: ${e.message || "Failed to reach endpoint"}]` }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const copyTranscript = () => {
    const text = messages.map((m) => `[${m.sender.toUpperCase()}]: ${m.text}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast.success("Stream transcript copied to clipboard!");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/agents"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant shadow-2xs transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-secondary group-hover:text-on-surface group-hover:-translate-x-0.5 transition-transform" />
            <span>Agents Directory</span>
          </Link>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider text-outline">Autonomous Agents</span>
            <span className="text-outline-variant">/</span>
            <span className="font-bold uppercase tracking-wider text-primary">Live SSE Stream Console</span>
          </div>
        </div>

        <button
          type="button"
          onClick={copyTranscript}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
        >
          <Copy className="w-3.5 h-3.5 text-secondary" />
          <span>Copy Stream Log</span>
        </button>
      </div>

      {/* Terminal View */}
      <div className="rounded-2xl bg-[#0b0f19] border border-outline-variant/30 shadow-2xl overflow-hidden flex flex-col h-[650px]">
        {/* Terminal Title Bar */}
        <div className="px-5 py-3.5 bg-[#070b14] border-b border-outline-variant/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-primary" />
              <span>styre://agents/stream/live-console</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>SSE ACTIVE</span>
          </div>
        </div>

        {/* Stream Messages Container */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 font-mono text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl transition-all ${
                m.sender === "user"
                  ? "bg-primary/10 border border-primary/30 text-primary-200 ml-8"
                  : "bg-slate-900/80 border border-slate-800 text-slate-200 mr-8"
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                <span className="font-bold flex items-center gap-1.5">
                  {m.sender === "user" ? (
                    <>User Request</>
                  ) : (
                    <>
                      <Bot className="w-3 h-3 text-emerald-400" />
                      Styre Supervisor AI
                    </>
                  )}
                </span>
                <span>{m.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap leading-relaxed text-[12px]">{m.text}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-[#070b14] border-t border-outline-variant/20 flex items-center gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={isStreaming}
            placeholder="Send command to stream (e.g. 'Draft a viral tweet thread announcing our AI outbox pacing engine')..."
            className="flex-1 h-10 px-4 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={isStreaming || !prompt.trim()}
            className="h-10 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 flex items-center gap-2 transition-all disabled:opacity-40"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>Stream</span>
          </button>
        </form>
      </div>
    </div>
  );
}
