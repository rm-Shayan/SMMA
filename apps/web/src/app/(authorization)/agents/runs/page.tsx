"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Download,
  RotateCw,
  CheckCircle2,
  XCircle,
  Terminal,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface AgentRun {
  id: string;
  agentName: string;
  agentRole: string;
  status: "succeeded" | "failed" | "running";
  trigger: "Schedule" | "Webhook" | "Manual" | "Workflow";
  startedAt: string;
  duration: string;
  tokens: string;
  cost: string;
  traceLog?: string;
}

const MOCK_RUNS: AgentRun[] = [
  {
    id: "run-9841",
    agentName: "Agent #8 Publisher",
    agentRole: "Omnichannel Dispatcher",
    status: "succeeded",
    trigger: "Schedule",
    startedAt: "2 mins ago",
    duration: "1.4s",
    tokens: "2,410",
    cost: "$0.007",
    traceLog: "Executed Instagram Graph API publish for Post #819. HTTP 200 OK received.",
  },
  {
    id: "run-9840",
    agentName: "Agent #1 Lead Hunter",
    agentRole: "Discovery & Scraping",
    status: "succeeded",
    trigger: "Schedule",
    startedAt: "12 mins ago",
    duration: "14.2s",
    tokens: "8,920",
    cost: "$0.026",
    traceLog: "Processed 40 Google Maps B2B search results. Extracted 12 validated prospects with work emails.",
  },
  {
    id: "run-9839",
    agentName: "Agent #6 Outreach",
    agentRole: "Email Sequence Engine",
    status: "running",
    trigger: "Workflow",
    startedAt: "Just now",
    duration: "—",
    tokens: "1,150",
    cost: "$0.003",
    traceLog: "Currently personalizing cold email drafts for batch #401...",
  },
  {
    id: "run-9838",
    agentName: "Agent #5 Content Writer",
    agentRole: "Copywriter & Tone Matcher",
    status: "failed",
    trigger: "Manual",
    startedAt: "45 mins ago",
    duration: "2.1s",
    tokens: "820",
    cost: "$0.002",
    traceLog: "Error: Target character limit exceeded for Twitter post. Guardrail blocked generation.",
  },
  {
    id: "run-9837",
    agentName: "Agent #2 Qualifier",
    agentRole: "Lead Enrichment & Scoring",
    status: "succeeded",
    trigger: "Webhook",
    startedAt: "1 hour ago",
    duration: "3.8s",
    tokens: "4,200",
    cost: "$0.012",
    traceLog: "Scored incoming webhook lead as 'Hot' (Score 91/100). Dispatched instant notification to sales manager.",
  },
  {
    id: "run-9836",
    agentName: "Agent #8 Publisher",
    agentRole: "Omnichannel Dispatcher",
    status: "succeeded",
    trigger: "Schedule",
    startedAt: "2 hours ago",
    duration: "1.8s",
    tokens: "2,840",
    cost: "$0.008",
    traceLog: "LinkedIn company update published successfully with UTM tracking parameters.",
  },
];

export default function AgentRunsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRun, setSelectedRun] = useState<AgentRun | null>(null);

  const filteredRuns = MOCK_RUNS.filter((run) => {
    const matchesSearch =
      run.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      run.agentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Top Breadcrumb & Action Bar */}
      <div>
        <Link
          href="/agents"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Agents</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Run History</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Audit and monitor execution logs across all 12 autonomous AI agents.
            </p>
          </div>
          <button
            onClick={() => toast.success("Exporting CSV execution log...")}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card text-foreground text-xs font-medium hover:bg-muted transition-colors self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-muted-foreground" />
            <span>Export History CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Runs (30d)</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">1,842</div>
          <span className="text-xs text-emerald-600 font-medium">+18% vs prev period</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Success Rate</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">98.4%</div>
          <span className="text-xs text-emerald-600 font-medium">1,812 / 1,842 runs</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Tokens Consumed</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">4.82M</div>
          <span className="text-xs text-muted-foreground font-medium">~$14.46 USD</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Failed Runs</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">16</div>
          <span className="text-xs text-amber-600 font-medium">12 auto-healed</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-xl bg-card border border-border shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by run ID or agent name..."
              className="w-full h-8 pl-9 pr-3 rounded-md bg-muted/50 border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2.5 rounded-md bg-muted/50 border border-border text-xs text-foreground focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="succeeded">Succeeded</option>
            <option value="running">Running</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Runs Table */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4">Run ID</th>
              <th className="py-3 px-4">Agent</th>
              <th className="py-3 px-4">Trigger</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Started</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Tokens</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredRuns.map((run) => (
              <tr key={run.id} className="hover:bg-muted/40 transition-colors">
                <td className="py-3 px-4 font-mono font-medium text-foreground">{run.id}</td>
                <td className="py-3 px-4">
                  <div>
                    <span className="font-semibold text-foreground">{run.agentName}</span>
                    <span className="block text-[11px] text-muted-foreground">{run.agentRole}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{run.trigger}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      run.status === "succeeded"
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : run.status === "running"
                        ? "bg-blue-500/10 text-blue-600 border border-blue-500/20 animate-pulse"
                        : "bg-red-500/10 text-red-600 border border-red-500/20"
                    }`}
                  >
                    {run.status === "succeeded" && <CheckCircle2 className="w-3 h-3" />}
                    {run.status === "failed" && <XCircle className="w-3 h-3" />}
                    {run.status === "running" && <RotateCw className="w-3 h-3 animate-spin" />}
                    <span className="capitalize">{run.status}</span>
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">{run.startedAt}</td>
                <td className="py-3 px-4 text-muted-foreground">{run.duration}</td>
                <td className="py-3 px-4 font-mono text-muted-foreground">
                  {run.tokens} <span className="text-[10px] text-muted-foreground/60">({run.cost})</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <button
                    onClick={() => setSelectedRun(run)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-muted hover:bg-primary hover:text-primary-foreground text-foreground transition-colors font-medium text-xs"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>View Log</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Detail Slide-Over Modal */}
      {selectedRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">Execution Log: {selectedRun.id}</h3>
              </div>
              <button
                onClick={() => setSelectedRun(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted/40 border border-border">
                <div>
                  <span className="text-muted-foreground">Agent:</span>{" "}
                  <span className="font-semibold text-foreground">{selectedRun.agentName}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="font-semibold capitalize text-foreground">{selectedRun.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Trigger:</span>{" "}
                  <span className="font-semibold text-foreground">{selectedRun.trigger}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>{" "}
                  <span className="font-semibold text-foreground">{selectedRun.duration}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Execution Trace:</label>
                <div className="p-3 rounded-lg bg-[#0a0f1d] text-slate-200 font-mono text-xs leading-relaxed border border-slate-800">
                  {selectedRun.traceLog}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRun(null)}
                className="px-4 py-1.5 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
