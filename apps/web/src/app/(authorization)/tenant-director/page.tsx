"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Building2,
  PlusCircle,
  Sliders,
  TrendingUp,
  Zap,
  Wallet,
  Search,
  MoreVertical,
  AlertCircle,
  X,
  Loader2,
} from "lucide-react";
import {
  useCreateCompanyMutation,
  useGetCompaniesQuery,
  useGetCreditsOverviewQuery,
} from "@/redux/api/adminApi";

const TIMEZONES = ["UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Asia/Karachi", "Asia/Dubai", "Asia/Kolkata"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function TenantDirectorPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const {
    data: companiesData,
    isLoading: isLoadingCompanies,
    isError: isCompaniesError,
    error: companiesError,
    refetch: refetchCompanies,
  } = useGetCompaniesQuery();

  const { data: overview } = useGetCreditsOverviewQuery();

  const [createCompany, { isLoading: isProvisioning }] = useCreateCompanyMutation();

  const companies = useMemo(() => companiesData?.companies ?? [], [companiesData]);

  const activeTenants = companies.filter((c) => (c.status ?? "active") === "active").length;
  const newThisMonth = useMemo(() => {
    const now = new Date();
    return companies.filter((c) => {
      if (!c.created_at) return false;
      const created = new Date(c.created_at);
      return (
        !Number.isNaN(created.getTime()) &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [companies]);

  const handleProvisionTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please fill in company name.");
      return;
    }

    try {
      await createCompany({ name: companyName.trim(), timezone }).unwrap();
      toast.success(`Provisioned ${companyName.trim()} successfully!`);
      setIsProvisionModalOpen(false);
      setCompanyName("");
      setTimezone("UTC");
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? "Failed to provision company.";
      toast.error(message);
    }
  };

  const filteredTenants = companies.filter((tenant) => {
    const term = searchQuery.toLowerCase();
    const matchesSearch =
      tenant.name.toLowerCase().includes(term) ||
      slugify(tenant.name).includes(term) ||
      (tenant.timezone ?? "").toLowerCase().includes(term);
    const matchesStatus = statusFilter === "all" || (tenant.status ?? "active") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col w-full pb-12">
      {/* Top Breadcrumb & Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold tracking-wider uppercase text-secondary">
              ADMINISTRATION
            </span>
            <span className="text-outline-variant">•</span>
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#063cbc]">
              MULTI-TENANT MANAGEMENT
            </span>
          </div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface ">
              Tenant Director
            </h1>
            <span className="text-sm text-secondary">All companies on the platform</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            type="button"
            onClick={() => toast("Global policy editor")}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-lg bg-surface-container-lowest text-on-surface-variant border border-outline-variant text-xs font-semibold shadow-sm hover:bg-surface-container-lowest transition-all"
          >
            <Sliders className="w-4 h-4 text-secondary" />
            <span>Global Policies</span>
          </button>
          <button
            type="button"
            onClick={() => setIsProvisionModalOpen(true)}
            className="flex items-center gap-2 px-4 h-9 rounded-lg bg-[#063cbc] hover:bg-[#00298a] text-white text-xs font-semibold shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Provision new company</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between mb-6 border-b border-outline-variant ">
        <div className="flex items-center gap-6">
          <Link
            href="/tenant-director"
            className="relative pb-3 text-xs font-bold text-[#063cbc] flex items-center gap-2"
          >
            <span>Tenants ({companies.length})</span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#063cbc] rounded-full"></span>
          </Link>
          <Link
            href="/tenant-director/pricing"
            className="relative pb-3 text-xs font-medium text-secondary hover:text-on-surface transition-colors flex items-center gap-2"
          >
            <span>Pricing rates</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-surface-container-low text-on-surface-variant font-semibold">
              Default Tier
            </span>
          </Link>
          <Link
            href="/tenant-director/transactions"
            className="relative pb-3 text-xs font-medium text-secondary hover:text-on-surface transition-colors"
          >
            <span>Transactions</span>
          </Link>
        </div>

        {/* Live Cluster Signal */}
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-[11px] font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live platform data</span>
        </div>
      </div>

      {/* 4-Column Metric KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* KPI 1 */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Active tenants
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-[#063cbc]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-on-surface tabular-nums mb-1">
              {isLoadingCompanies ? "—" : activeTenants}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{newThisMonth} this month</span>
              <span className="text-outline font-normal">vs prev cycle</span>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Credits Pool
            </span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-[#063cbc]">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold tracking-tight text-on-surface tabular-nums mb-1">
              {(overview?.totalMinted ?? 0).toLocaleString()}{" "}
              <span className="text-sm font-normal text-outline">minted</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-secondary">
              <span className="tabular-nums font-semibold text-on-surface ">
                {(overview?.totalReserved ?? 0).toLocaleString()}
              </span>{" "}
              reserved
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Credit Transactions
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold tracking-tight text-on-surface tabular-nums">
                {(overview?.totalTransactions ?? 0).toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-secondary">Platform-wide ledger entries</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-secondary">
              Tenant health
            </span>
            <button
              type="button"
              onClick={() => refetchCompanies()}
              className="text-[11px] px-2 py-0.5 rounded bg-surface-container-low text-[#063cbc] font-semibold hover:bg-surface-container transition-colors"
            >
              Refresh
            </button>
          </div>
          <div>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl font-bold tracking-tight text-on-surface tabular-nums">
                {companies.length}
              </span>
              <span className="text-xs text-outline">companies</span>
            </div>
            <div className="flex items-center justify-between text-xs text-secondary">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="tabular-nums">{activeTenants} active</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{Math.max(companies.length - activeTenants, 0)} suspended</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-surface-container-lowest border border-outline-variant/80 rounded-xl shadow-sm mb-4">
        <div className="flex items-center gap-2.5 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, timezones, or slugs..."
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-[#063cbc]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant text-xs font-medium text-on-surface-variant focus:outline-none cursor-pointer"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="text-xs text-outline">
          Showing <strong className="text-on-surface ">{filteredTenants.length}</strong> companies
        </div>
      </div>

      {/* Tenants Table Card */}
      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest text-secondary uppercase text-[10px] tracking-wider font-semibold h-9 border-b border-outline-variant ">
                <th className="py-2.5 px-5">Company</th>
                <th className="py-2.5 px-4">Timezone</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container text-xs">
              {isLoadingCompanies && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-secondary">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#063cbc]" />
                    Loading companies…
                  </td>
                </tr>
              )}
              {isCompaniesError && (
                <tr>
                  <td colSpan={5} className="py-10 text-center">
                    <AlertCircle className="w-5 h-5 mx-auto mb-2 text-rose-500" />
                    <p className="text-secondary">
                      {(companiesError as { data?: { message?: string } })?.data?.message ??
                        "Failed to load companies."}
                    </p>
                    <button
                      type="button"
                      onClick={() => refetchCompanies()}
                      className="mt-2 text-xs font-semibold text-[#063cbc] hover:underline"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              )}
              {!isLoadingCompanies && !isCompaniesError && filteredTenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-secondary">
                    No companies found.
                  </td>
                </tr>
              )}
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-low text-[#063cbc] flex items-center justify-center font-bold text-xs shrink-0">
                        {tenant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-on-surface truncate">
                          {tenant.name}
                        </span>
                        <span className="text-[11px] text-outline font-mono truncate">
                          {slugify(tenant.name)}.styrebot.app
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant font-mono text-[11px]">
                    {tenant.timezone || "UTC"}
                  </td>
                  <td className="py-3 px-4 text-secondary tabular-nums">
                    {formatDate(tenant.created_at)}
                  </td>
                  <td className="py-3 px-4">
                    {(tenant.status ?? "active") === "active" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[11px] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => toast(`Impersonating ${tenant.name}...`)}
                        className="px-2.5 py-1 rounded bg-surface-container-low hover:bg-[#063cbc] hover:text-white text-on-surface-variant text-xs font-semibold transition-colors"
                      >
                        Enter
                      </button>
                      <button
                        type="button"
                        className="p-1 rounded text-outline hover:text-on-surface-variant transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision New Company Modal Dialog */}
      {isProvisionModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="fixed inset-0 -z-10" onClick={() => setIsProvisionModalOpen(false)} />
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant overflow-hidden my-auto max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-surface-container flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold text-on-surface">Provision New Company</h3>
                <p className="text-xs text-secondary mt-0.5">
                  Onboard a new client or agency tenant workspace.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProvisionModalOpen(false)}
                className="p-1.5 rounded-lg text-outline hover:text-on-surface-variant hover:bg-surface-container-low transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProvisionTenant} className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Company / Agency Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Growth Studio"
                  className="w-full h-9 px-3 rounded-lg border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                  Workspace Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-outline-variant text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-surface-container-lowest cursor-pointer"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsProvisionModalOpen(false)}
                  className="h-9 px-3.5 rounded-lg border border-outline-variant text-on-surface-variant text-xs font-semibold hover:bg-surface-container-lowest transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="h-9 px-4 rounded-lg bg-[#063cbc] hover:bg-[#00298a] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
                >
                  {isProvisioning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  <span>{isProvisioning ? "Provisioning…" : "Provision Tenant"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
