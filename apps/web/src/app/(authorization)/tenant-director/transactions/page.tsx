"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Bot,
  Lock,
  Ban,
  TrendingUp,
  Search,
  Download,
  Loader2,
  AlertCircle,
  Sliders,
  PlusCircle,
  ArrowLeft,
} from "lucide-react";
import {
  useGetAdminLedgerQuery,
  useGetCompaniesQuery,
  useGetCreditsOverviewQuery,
} from "@/redux/api/adminApi";

type LedgerType = "Purchased" | "Consumed" | "Reserved" | "Revoked" | "Released" | "Allocated";

interface LedgerRow {
  id: string;
  timestamp: string;
  type: LedgerType;
  tenantName: string;
  referenceId: string;
  actor: string;
  delta: number;
}

const TYPE_BY_API: Record<string, LedgerType> = {
  purchase: "Purchased",
  grant: "Purchased",
  consume: "Consumed",
  reserve: "Reserved",
  release: "Released",
  allocate: "Allocated",
  revoke: "Revoked",
  expire: "Revoked",
};

const TYPE_STYLES: Record<LedgerType, string> = {
  Purchased: "bg-emerald-50 text-emerald-700",
  Consumed: "bg-surface-container-low text-on-surface-variant",
  Reserved: "bg-amber-50 text-amber-700",
  Revoked: "bg-rose-50 text-rose-700",
  Released: "bg-sky-50 text-sky-700",
  Allocated: "bg-indigo-50 text-indigo-700",
};

function formatTimestamp(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
  })}, ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

function shortId(value?: string | null): string {
  if (!value) return "System";
  return value.length > 10 ? `${value.slice(0, 8)}…` : value;
}

export default function TenantDirectorTransactionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const {
    data: ledgerData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAdminLedgerQuery({ limit: 100 });
  const { data: companiesData } = useGetCompaniesQuery();
  const { data: overview } = useGetCreditsOverviewQuery();

  const companyNames = useMemo(() => {
    const map = new Map<string, string>();
    (companiesData?.companies ?? []).forEach((c) => map.set(c.id, c.name));
    return map;
  }, [companiesData]);

  const rows = useMemo<LedgerRow[]>(() => {
    return (ledgerData?.transactions ?? []).map((tx) => {
      const type = TYPE_BY_API[tx.type] ?? "Consumed";
      const signed =
        type === "Purchased" || type === "Released" || type === "Allocated"
          ? Math.abs(tx.amount)
          : -Math.abs(tx.amount);
      return {
        id: tx.id,
        timestamp: formatTimestamp(tx.created_at),
        type,
        tenantName: (tx.company_id && companyNames.get(tx.company_id)) || "Unknown tenant",
        referenceId: tx.note || shortId(tx.id),
        actor: shortId(tx.created_by),
        delta: signed,
      };
    });
  }, [ledgerData, companyNames]);

  const kpis = useMemo(() => {
    const sumBy = (types: LedgerType[]) =>
      rows.filter((r) => types.includes(r.type)).reduce((acc, r) => acc + Math.abs(r.delta), 0);

    return {
      purchased: sumBy(["Purchased"]),
      consumed: sumBy(["Consumed"]),
      reserved: overview?.totalReserved ?? sumBy(["Reserved"]),
      revoked: sumBy(["Revoked"]),
    };
  }, [rows, overview]);

  const filtered = rows.filter((t) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      t.tenantName.toLowerCase().includes(term) ||
      t.referenceId.toLowerCase().includes(term) ||
      t.actor.toLowerCase().includes(term);
    const matchesType = typeFilter === "all" || t.type.toLowerCase() === typeFilter.toLowerCase();
    return matchesSearch && matchesType;
  });

  const handleExportCsv = () => {
    if (filtered.length === 0) {
      toast.error("No transactions to export.");
      return;
    }
    const header = ["Timestamp", "Event Type", "Tenant", "Reference", "Actor", "Delta"];
    const lines = filtered.map((t) =>
      [t.timestamp, t.type, t.tenantName, t.referenceId, t.actor, t.delta]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tenant-transactions.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Exported transactions CSV");
  };

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Header & Hierarchy Context */}
      <div className="flex flex-col gap-2 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <Link
              href="/tenant-director"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant shadow-2xs transition-all group"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-secondary group-hover:text-on-surface group-hover:-translate-x-0.5 transition-transform" />
              <span>Back</span>
            </Link>
            <span className="text-outline-variant">•</span>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold uppercase tracking-wider text-outline">
                Administration
              </span>
              <span className="text-outline-variant">/</span>
              <span className="font-semibold uppercase tracking-wider text-outline">
                Multi-Tenant
              </span>
              <span className="text-outline-variant">/</span>
              <span className="font-bold uppercase tracking-wider text-[#063cbc]">
                Credit Audit & Ledger
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold text-on-surface ">Live platform ledger</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface ">
              Tenant Director
            </h1>
            <p className="text-sm text-secondary mt-0.5">All companies on the platform</p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/tenant-director"
              className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface-variant border border-outline-variant text-xs font-semibold shadow-sm hover:bg-surface-container-lowest transition-colors flex items-center gap-1.5"
            >
              <Sliders className="w-4 h-4 text-secondary" />
              <span>Tenants List</span>
            </Link>
            <Link
              href="/tenant-director"
              className="h-9 px-3.5 rounded-lg bg-[#063cbc] hover:bg-[#00298a] text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Provision new company</span>
            </Link>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-6 pt-3 border-b border-outline-variant ">
          <Link
            href="/tenant-director"
            className="pb-2.5 text-xs font-medium text-secondary hover:text-on-surface transition-colors flex items-center gap-1.5"
          >
            <span>Tenants</span>
          </Link>
          <Link
            href="/tenant-director/pricing"
            className="pb-2.5 text-xs font-medium text-secondary hover:text-on-surface transition-colors"
          >
            <span>Pricing rates</span>
          </Link>
          <Link
            href="/tenant-director/transactions"
            className="relative pb-2.5 text-xs font-bold text-[#063cbc] flex items-center gap-2"
          >
            <span>Transactions</span>
            <span className="px-1.5 py-0.2 rounded-full bg-primary-fixed text-[#063cbc] font-semibold text-[10px] tabular-nums">
              {(overview?.totalTransactions ?? rows.length).toLocaleString()}
            </span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#063cbc] rounded-full"></span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Purchased */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Purchased
            </span>
            <div className="w-7 h-7 rounded-lg bg-surface-container-low text-[#063cbc] flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-on-surface tabular-nums mb-1">
              {kpis.purchased.toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Purchases & grants</span>
            </div>
          </div>
        </div>

        {/* Consumed */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Consumed
            </span>
            <div className="w-7 h-7 rounded-lg bg-surface-container-low text-on-surface-variant flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-on-surface tabular-nums mb-1">
              {kpis.consumed.toLocaleString()}
            </div>
            <div className="text-xs text-secondary">Across autonomous agent runs</div>
          </div>
        </div>

        {/* Reserved */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Reserved
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-on-surface tabular-nums mb-1">
              {kpis.reserved.toLocaleString()}
            </div>
            <div className="text-xs text-amber-600 font-medium">In-flight holds</div>
          </div>
        </div>

        {/* Revoked */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Revoked
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-on-surface tabular-nums mb-1">
              {kpis.revoked.toLocaleString()}
            </div>
            <div className="text-xs text-secondary">Policy caps & expirations</div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-sm mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by tenant or reference ID..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-[#063cbc]"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-medium text-on-surface-variant focus:outline-none cursor-pointer"
          >
            <option value="all">All event types</option>
            <option value="purchased">Purchased</option>
            <option value="consumed">Consumed</option>
            <option value="reserved">Reserved</option>
            <option value="revoked">Revoked</option>
            <option value="released">Released</option>
            <option value="allocated">Allocated</option>
          </select>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="h-9 px-3.5 rounded-lg border border-outline-variant text-xs font-semibold text-on-surface-variant hover:bg-surface-container-lowest transition-colors flex items-center justify-center gap-1.5"
        >
          <Download className="w-4 h-4 text-secondary" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Ledger Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-secondary uppercase text-[10px] tracking-wider font-semibold h-9 border-b border-outline-variant ">
                <th className="py-2.5 px-5">Timestamp</th>
                <th className="py-2.5 px-4">Event Type</th>
                <th className="py-2.5 px-4">Tenant</th>
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">Actor</th>
                <th className="py-2.5 px-5 text-right">Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-secondary">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#063cbc]" />
                    Loading ledger…
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="py-10 text-center">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2 text-rose-500" />
                    <p className="text-secondary">
                      {(error as { data?: { message?: string } })?.data?.message ??
                        "Failed to load ledger."}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetch()}
                      className="mt-2 text-xs font-semibold text-[#063cbc] hover:underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-secondary">
                    No transactions found.
                  </td>
                </tr>
              )}
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="py-3 px-5 text-secondary tabular-nums whitespace-nowrap">
                    {tx.timestamp}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-semibold text-[11px] ${TYPE_STYLES[tx.type]}`}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-on-surface ">{tx.tenantName}</td>
                  <td className="py-3 px-4 font-mono text-secondary text-[11px]">
                    {tx.referenceId}
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant ">{tx.actor}</td>
                  <td
                    className={`py-3 px-5 text-right font-mono font-bold tabular-nums ${
                      tx.delta > 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {tx.delta > 0 ? `+${tx.delta.toLocaleString()}` : tx.delta.toLocaleString()} cr
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
