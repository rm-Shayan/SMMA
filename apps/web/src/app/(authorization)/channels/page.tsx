"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Database,
  Plus,
  RefreshCw,
  Trash2,
  Wifi,
  XCircle,
  ShieldCheck,
  Send,
  Pause,
  Play,
} from "lucide-react";
import toast from "react-hot-toast";
import ConnectChannelModal from "@/components/channels/ConnectChannelModal";
import {
  useDeleteConnectorMutation,
  useGetConnectorsQuery,
  useTestConnectorMutation,
  type ConnectorDto,
} from "@/redux/api/connectorsApi";
import { useWebSocketTopic } from "@/hooks/useWebSocketTopic";

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return "Request failed. Please try again.";
}

interface PaceChannel {
  id: string;
  name: string;
  channelType: string;
  status: "active" | "paused" | "warmup";
  nextDispatch: string;
  dailySent: number;
  dailyMax: number;
  hourlySent: number;
  hourlyMax: number;
  phase: string;
}

const MOCK_PACE_CHANNELS: PaceChannel[] = [
  {
    id: "p-1",
    name: "Alex Vance (Founder LinkedIn)",
    channelType: "LinkedIn Personal",
    status: "active",
    nextDispatch: "in 1m 45s",
    dailySent: 38,
    dailyMax: 50,
    hourlySent: 14,
    hourlyMax: 20,
    phase: "Normal Pace",
  },
  {
    id: "p-2",
    name: "Styre Concierge Instagram",
    channelType: "Instagram Graph",
    status: "paused",
    nextDispatch: "Paused (28m remaining)",
    dailySent: 45,
    dailyMax: 50,
    hourlySent: 12,
    hourlyMax: 20,
    phase: "Burst Limit Cooldown",
  },
  {
    id: "p-3",
    name: "B2B Cold Outreach Gmail #1",
    channelType: "Google Workspace SMTP",
    status: "warmup",
    nextDispatch: "in 4m 10s",
    dailySent: 12,
    dailyMax: 25,
    hourlySent: 4,
    hourlyMax: 10,
    phase: "Warmup: 50% capacity",
  },
  {
    id: "p-4",
    name: "Styre AI Twitter / X Publisher",
    channelType: "X API v2",
    status: "active",
    nextDispatch: "in 8m 30s",
    dailySent: 18,
    dailyMax: 30,
    hourlySent: 6,
    hourlyMax: 15,
    phase: "Normal Pace",
  },
];

function ChannelsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"channels" | "outbox">(() => 
    searchParams?.get("tab") === "outbox" ? "outbox" : "channels"
  );

  const { data, isLoading, isFetching, error, refetch } = useGetConnectorsQuery();
  const [testConnector] = useTestConnectorMutation();
  const [deleteConnector] = useDeleteConnectorMutation();

  // Real-time outbox pacing and account connection stream
  useWebSocketTopic<{ event_type?: string }>("outbox", () => {
    void refetch();
  });
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [paceData, setPaceData] = useState<PaceChannel[]>(MOCK_PACE_CHANNELS);

  const connectors = data?.connectors ?? [];

  const handleTest = async (connector: ConnectorDto) => {
    setTestingId(connector.id);
    try {
      const result = await testConnector(connector.id).unwrap();
      if (result.success) {
        toast.success(
          result.status
            ? `Connection test passed (HTTP ${result.status}).`
            : result.simulated
              ? "Connection test passed (simulated)."
              : "Connection test passed.",
        );
      } else {
        toast.error(result.error || "The connection test failed.");
      }
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (connector: ConnectorDto) => {
    if (!window.confirm(`Disconnect "${connector.name}"?`)) return;
    setDeletingId(connector.id);
    try {
      const result = await deleteConnector(connector.id).unwrap();
      if (!result.success) {
        toast.error(result.error || "The connector could not be disconnected.");
        return;
      }
      toast.success(`${connector.name} disconnected.`);
    } catch (requestError) {
      toast.error(errorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  const togglePaceChannel = (id: string) => {
    setPaceData((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = c.status === "active" ? "paused" : "active";
          toast.success(`${c.name} ${next === "paused" ? "paused" : "resumed"}`);
          return { ...c, status: next };
        }
        return c;
      })
    );
  };

  return (
    <div className="space-y-6 pb-16">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Channels &amp; Outbox</h1>
            <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-on-secondary-fixed">
              Workspace
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage data connectors, configure API credentials, and monitor outbound sending pacing.
          </p>
        </div>
        <div className="flex gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-xs font-semibold text-foreground shadow-xs hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-xs transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add connector
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("channels")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "channels"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Connected Channels ({connectors.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("outbox")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === "outbox"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Sending Pace &amp; Outbox Monitor</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>
      </div>

      {/* Tab 1: Channels List */}
      {activeTab === "channels" && (
        <div className="space-y-4">
          {error && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground">
              <span>{errorMessage(error)}</span>
              <button type="button" onClick={() => void refetch()} className="shrink-0 font-semibold text-primary hover:underline">
                Retry
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              Loading connectors...
            </div>
          ) : !error && connectors.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
              <Database className="mx-auto h-8 w-8 text-muted-foreground" />
              <h2 className="mt-3 font-semibold text-foreground">No connectors yet</h2>
              <p className="mt-1 text-sm text-muted-foreground">Add a data connector to get started.</p>
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(true)}
                className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Add connector
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {connectors.map((connector) => {
                const status = connector.status || "Unknown";
                return (
                  <article
                    key={connector.id}
                    className="flex flex-col justify-between gap-5 rounded-xl border border-border bg-card p-5 shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Database className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-semibold text-foreground">{connector.name}</h2>
                            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{connector.type}</p>
                          </div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                          {status.toLowerCase() === "active" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          {status}
                        </span>
                      </div>
                      <p className="mt-4 text-xs text-muted-foreground">
                        Write access: {connector.write_enabled ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <div className="flex gap-2 border-t border-border pt-4">
                      <button
                        type="button"
                        onClick={() => void handleTest(connector)}
                        disabled={testingId === connector.id || deletingId === connector.id}
                        className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                      >
                        <Wifi className="h-3.5 w-3.5" />
                        {testingId === connector.id ? "Testing..." : "Test connection"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(connector)}
                        disabled={testingId === connector.id || deletingId === connector.id}
                        aria-label={`Disconnect ${connector.name}`}
                        className="inline-flex h-8 items-center justify-center rounded-lg px-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === connector.id && <span className="ml-1 text-xs">Removing...</span>}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sending Pace Monitor (Stitch channels sending pace view) */}
      {activeTab === "outbox" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-foreground">Sending Pace &amp; Account Health Monitor</h3>
                <p className="text-xs text-muted-foreground">
                  Dynamic rate limiter and daily outreach queues to avoid provider throttling or spam flags.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" /> Heuristics Active
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-4">Channel / Account</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Next Dispatch</th>
                  <th className="py-3 px-4">Daily Quota</th>
                  <th className="py-3 px-4">Hour Burst Limit</th>
                  <th className="py-3 px-4">Warmup Phase</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paceData.map((channel) => (
                  <tr key={channel.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4">
                      <div>
                        <span className="font-semibold text-foreground">{channel.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{channel.channelType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          channel.status === "active"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : channel.status === "paused"
                            ? "bg-amber-500/10 text-amber-600"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            channel.status === "active"
                              ? "bg-emerald-500"
                              : channel.status === "paused"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        />
                        <span className="capitalize">{channel.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{channel.nextDispatch}</td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-semibold text-foreground">
                            {channel.dailySent} / {channel.dailyMax}
                          </span>
                          <span className="text-muted-foreground">
                            {Math.round((channel.dailySent / channel.dailyMax) * 100)}%
                          </span>
                        </div>
                        <div className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${(channel.dailySent / channel.dailyMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-foreground">
                      {channel.hourlySent} / {channel.hourlyMax}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                        {channel.phase}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => togglePaceChannel(channel.id)}
                        className={`p-1.5 rounded hover:bg-muted transition-colors ${
                          channel.status === "active" ? "text-amber-600" : "text-emerald-600"
                        }`}
                        title={channel.status === "active" ? "Pause sending" : "Resume sending"}
                      >
                        {channel.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Safety Callout */}
          <div className="p-4 rounded-xl bg-card border border-border flex items-center gap-3 text-xs text-muted-foreground shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              <strong>AI Safety Heuristic Active:</strong> Automatic randomized delays between 45s and 220s are inserted
              between individual email and social dispatches to protect account reputation.
            </span>
          </div>
        </div>
      )}

      <ConnectChannelModal isOpen={isConnectModalOpen} onClose={() => setIsConnectModalOpen(false)} />
    </div>
  );
}

export default function ChannelsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse text-sm">Loading channels...</div>}>
      <ChannelsContent />
    </Suspense>
  );
}
