"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCw,
  Sliders,
  Terminal as TerminalIcon,
  Activity,
  Cpu,
} from "lucide-react";
import toast from "react-hot-toast";

interface LogEntry {
  id: string;
  time: string;
  level: "info" | "warn" | "error" | "debug";
  message: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: "1", time: "14:32:01", level: "info", message: "Agent worker initialized. Model: anthropic/claude-3-5-sonnet" },
  { id: "2", time: "14:32:02", level: "debug", message: "Loaded workspace tenant guardrails: RateLimit=60/min, MaxTokens=4096" },
  { id: "3", time: "14:32:04", level: "info", message: "Fetching scheduled social outreach batch #8129 from queue" },
  { id: "4", time: "14:32:06", level: "info", message: "Evaluating content compliance against brand style guide v2.1" },
  { id: "5", time: "14:32:07", level: "info", message: "Generated caption variant A with 94.2% tone alignment score" },
  { id: "6", time: "14:32:09", level: "info", message: "Dispatching webhook payload to Instagram Graph API connector" },
  { id: "7", time: "14:32:10", level: "info", message: "Received 200 OK from Instagram connector. Media ID: 179234891024" },
];

export default function AgentConsolePage() {
  const params = useParams();
  const agentId = (params?.agentId as string) || "agent-8";

  const [isRunning, setIsRunning] = useState(true);
  const [activeTab, setActiveTab] = useState<"terminal" | "metrics" | "config" | "tools">("terminal");
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
  const [autoScroll, setAutoScroll] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleToggleState = () => {
    setIsRunning(!isRunning);
    toast.success(isRunning ? "Agent paused" : "Agent resumed execution");
  };

  const handleTriggerManualRun = () => {
    toast.success("Manual run triggered for " + agentId);
    const newLog: LogEntry = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString(),
      level: "info",
      message: `Manual trigger initiated by operator. Executing task pipeline...`,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Breadcrumb Navigation */}
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Agents Fleet</span>
        </Link>

        {/* Main Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground capitalize">
              {agentId.replace(/-/g, " ")}: Publisher Engine
            </h1>
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isRunning
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`} />
              <span>{isRunning ? "Live & Running" : "Paused"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleState}
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-medium border transition-colors ${
                isRunning
                  ? "border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isRunning ? "Pause Agent" : "Resume Agent"}</span>
            </button>

            <button
              onClick={handleTriggerManualRun}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Trigger Run Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Operational Highlights Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Active LLM Model</span>
          <div className="text-lg font-bold text-foreground mt-1 flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-primary" />
            <span>Claude 3.5 Sonnet</span>
          </div>
          <span className="text-xs text-muted-foreground">Temperature: 0.7 • Top-P: 0.9</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Today&apos;s Run Count</span>
          <div className="text-lg font-bold text-foreground mt-1 tabular-nums">412 runs</div>
          <span className="text-xs text-emerald-600 font-medium">99.4% success rate</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Token Consumption</span>
          <div className="text-lg font-bold text-foreground mt-1 tabular-nums">1.24M tokens</div>
          <span className="text-xs text-muted-foreground">~$3.72 USD billed</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Avg Execution Latency</span>
          <div className="text-lg font-bold text-foreground mt-1 tabular-nums">842 ms</div>
          <span className="text-xs text-emerald-600 font-medium">Within SLA (&lt; 2000ms)</span>
        </div>
      </div>

      {/* Operational Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "terminal"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          <span>Live Console Stream</span>
        </button>
        <button
          onClick={() => setActiveTab("metrics")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "metrics"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Performance & SLA</span>
        </button>
        <button
          onClick={() => setActiveTab("config")}
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "config"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>System Prompt & Guardrails</span>
        </button>
      </div>

      {/* Tab 1: Terminal Log Stream */}
      {activeTab === "terminal" && (
        <div className="rounded-xl border border-border bg-[#0a0f1d] text-slate-200 overflow-hidden shadow-xl font-mono text-xs">
          <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block" />
              <span className="text-[11px] text-slate-400 ml-2">stdout / sse-stream :: {agentId}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded border-slate-700 text-primary"
                />
                <span>Auto-scroll</span>
              </label>
              <button
                onClick={() => setLogs([])}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            </div>
          </div>

          <div ref={logContainerRef} className="p-4 space-y-2 h-96 overflow-y-auto scrollbar-thin">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 leading-relaxed">
                <span className="text-slate-500 shrink-0 tabular-nums">[{log.time}]</span>
                <span
                  className={`uppercase font-bold text-[10px] px-1 rounded shrink-0 ${
                    log.level === "info"
                      ? "bg-blue-500/20 text-blue-400"
                      : log.level === "warn"
                      ? "bg-amber-500/20 text-amber-400"
                      : log.level === "error"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-slate-700/50 text-slate-300"
                  }`}
                >
                  {log.level}
                </span>
                <span className="text-slate-200 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Performance Metrics */}
      {activeTab === "metrics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Hourly Throughput</h3>
            <div className="h-48 flex items-center justify-center text-muted-foreground text-xs border border-dashed rounded-lg">
              Throughput chart: Peak 48 dispatches/hr at 11:00 AM
            </div>
          </div>
          <div className="p-5 rounded-xl bg-card border border-border space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Error Classification</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-foreground">Rate Limit (429)</span>
                <span className="text-muted-foreground">0 incidents</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-foreground">Payload Formatting (400)</span>
                <span className="text-muted-foreground">2 incidents (auto-healed)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-foreground">Network Timeout (504)</span>
                <span className="text-muted-foreground">1 incident (retried)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Configuration */}
      {activeTab === "config" && (
        <div className="p-5 rounded-xl bg-card border border-border space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Agent Persona & Core Directive</h3>
          <textarea
            readOnly
            rows={6}
            value={`You are Styre-BOT Agent #8 (Omnichannel Publisher).
Your directive is to prepare, format, and dispatch validated social media content across LinkedIn, Twitter/X, Instagram, and Facebook.
Ensure strict adherence to tenant brand guidelines, character limits, hashtag density, and UTM link tags.`}
            className="w-full p-3 rounded-lg bg-muted border border-border text-xs text-foreground font-mono focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              onClick={() => toast.success("Configuration saved")}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90"
            >
              Update Directive
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
