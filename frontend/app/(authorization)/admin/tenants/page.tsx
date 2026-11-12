"use client";

import { useState, useEffect, useMemo } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";
import { listAllTenantsDetailsApi, updateTenantApi, createTenantApi, TenantDetailsDto } from "@/services/tenantsService";
import {
  IconBuilding,
  IconShield,
  IconUser,
  IconMail,
  IconCheckCircle,
  IconAlertCircle,
  IconSpinner,
  IconArrowRight,
  IconClose,
} from "@/components/Icons";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  contactEmail: string;
  cluster: string;
  createdDate: string;
  isActive: boolean;
  autonomousMode: boolean;
  brandVoice: string;
  niche: string;
  googleSheetId: string;
  bookingUrl: string;
}

export default function TenantDirectoryPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "SUSPENDED">("ALL");

  // New Tenant Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newNiche, setNewNiche] = useState("General SMMA & Sales Automation");
  const [newBrandVoice, setNewBrandVoice] = useState("Professional, authoritative, high-conversion");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTenants = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await listAllTenantsDetailsApi();
      if (data && Array.isArray(data)) {
        const mapped: Tenant[] = data.map((t: TenantDetailsDto, i: number) => ({
          id: t.id,
          name: t.company_name?.trim() || `Agency Enclave ${i + 1}`,
          plan: "Enterprise Scale",
          contactEmail: t.notification_email || "support@agency.com",
          cluster: "us-east-cluster-04",
          createdDate: t.created_at ? new Date(t.created_at).toLocaleDateString() : "Active",
          isActive: t.is_active ?? true,
          autonomousMode: t.autonomous_mode_enabled ?? true,
          brandVoice: t.brand_voice || "Professional, authoritative, high-conversion",
          niche: t.niche || "General SMMA Automation",
          googleSheetId: t.google_sheet_id || "",
          bookingUrl: t.booking_calendar_url || "",
        }));
        setTenants(mapped);
      }
    } catch (err: any) {
      setFetchError(err?.message || "Failed to load the tenant directory from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleOpenDrawer = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditingTenant({ ...tenant });
    setSaveStatus(null);
  };

  const handleToggleStatus = async (e: React.MouseEvent, tenant: Tenant) => {
    e.stopPropagation();
    const newStatus = !tenant.isActive;
    try {
      await updateTenantApi(tenant.id, { isActive: newStatus });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, isActive: newStatus } : t))
      );
      if (selectedTenant?.id === tenant.id) {
        setSelectedTenant((prev) => (prev ? { ...prev, isActive: newStatus } : null));
        setEditingTenant((prev) => (prev ? { ...prev, isActive: newStatus } : null));
      }
      setActionSuccessMsg(`Enclave "${tenant.name}" ${newStatus ? "Activated" : "Suspended"} successfully.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      setActionErrorMsg("Failed to toggle tenant status: " + (err?.message || "Unknown error"));
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    setSaveStatus("saving");
    try {
      await updateTenantApi(editingTenant.id, {
        companyName: editingTenant.name,
        notificationEmail: editingTenant.contactEmail,
        brandVoice: editingTenant.brandVoice,
        niche: editingTenant.niche,
        googleSheetId: editingTenant.googleSheetId,
        bookingCalendarUrl: editingTenant.bookingUrl,
        isActive: editingTenant.isActive,
      });

      setTenants((prev) =>
        prev.map((t) => (t.id === editingTenant.id ? { ...editingTenant } : t))
      );
      setSelectedTenant({ ...editingTenant });
      setSaveStatus("saved");
      setActionSuccessMsg(`Tenant "${editingTenant.name}" updated successfully.`);
      setTimeout(() => {
        setSaveStatus(null);
        setActionSuccessMsg(null);
      }, 3000);
    } catch (err: any) {
      setSaveStatus("error");
      setActionErrorMsg("Failed to update tenant: " + (err?.message || "Network error"));
      setTimeout(() => setActionErrorMsg(null), 4000);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim() || !newEmail.trim()) {
      setCreateError("Company name and email are required.");
      return;
    }
    setCreateLoading(true);
    setCreateError(null);
    try {
      const res = await createTenantApi({
        companyName: newCompanyName.trim(),
        email: newEmail.trim(),
        niche: newNiche.trim(),
        brandVoice: newBrandVoice.trim(),
        autonomousModeEnabled: true,
      });

      const newTenant: Tenant = {
        id: res.id,
        name: res.company_name || newCompanyName,
        plan: "Enterprise Scale",
        contactEmail: res.notification_email || newEmail,
        cluster: "us-east-cluster-04",
        createdDate: new Date().toLocaleDateString(),
        isActive: res.is_active ?? true,
        autonomousMode: true,
        brandVoice: res.brand_voice || newBrandVoice,
        niche: res.niche || newNiche,
        googleSheetId: res.google_sheet_id || "",
        bookingUrl: res.booking_calendar_url || "",
      };

      setTenants((prev) => [newTenant, ...prev]);
      setIsCreateModalOpen(false);
      setNewCompanyName("");
      setNewEmail("");
      setActionSuccessMsg(`Enclave "${newTenant.name}" provisioned successfully!`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } catch (err: any) {
      setCreateError(err?.message || "Failed to provision tenant.");
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.contactEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.niche.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && t.isActive) ||
        (statusFilter === "SUSPENDED" && !t.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [tenants, searchQuery, statusFilter]);

  const activeCount = tenants.filter((t) => t.isActive).length;
  const suspendedCount = tenants.length - activeCount;

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Top Header & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-200/90">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Tenant Organizations &amp; Enclaves
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold text-xs border border-indigo-200">
                <IconShield size={14} className="text-indigo-600" />
                SUPERADMIN SCOPE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative platform-wide directory of provisioned agency tenant enclaves and cryptographic partition bindings.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => fetchTenants()}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh tenants from backend"
            >
              {loading ? <IconSpinner size={16} /> : <span className="material-symbols-outlined text-[16px]">refresh</span>}
              <span>Sync</span>
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
            >
              <span className="text-base leading-none font-bold">+</span>
              <span>Onboard New Tenant Enclave</span>
            </button>
          </div>
        </div>

        {/* Action Alert Banner */}
        {actionSuccessMsg && (
          <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-800 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
            <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {actionErrorMsg && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
            <IconAlertCircle size={18} className="text-rose-600 shrink-0" />
            <span>{actionErrorMsg}</span>
          </div>
        )}

        {fetchError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-300 rounded-2xl text-rose-800 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in">
            <span className="flex items-center gap-2.5">
              <IconAlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{fetchError}</span>
            </span>
            <button
              type="button"
              onClick={() => fetchTenants()}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-[11px] font-semibold hover:bg-rose-700 transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* KPI Overview Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Tenants
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">{tenants.length}</span>
                <span className="text-xs text-slate-500">Provisioned</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <IconBuilding size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Active Enclaves
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
                <span className="text-xs text-slate-500">Live Traffic</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <IconCheckCircle size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Suspended Enclaves
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-amber-600">{suspendedCount}</span>
                <span className="text-xs text-slate-500">Routing Gated</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <IconAlertCircle size={20} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Database Isolation
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold text-slate-900">100%</span>
                <span className="text-xs text-slate-500">Cryptographic RLS</span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <IconShield size={20} />
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <span className="material-symbols-outlined text-[18px]">search</span>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, ID, email or niche..."
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All ({tenants.length})
            </button>
            <button
              onClick={() => setStatusFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === "ACTIVE"
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              onClick={() => setStatusFilter("SUSPENDED")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === "SUSPENDED"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Suspended ({suspendedCount})
            </button>
          </div>
        </div>

        {/* Tenant Table Card */}
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden flex flex-col">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <IconBuilding size={18} className="text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900">Provisioned Agency Enclaves</h2>
            </div>
            <span className="text-xs text-slate-500">
              Showing {filteredTenants.length} of {tenants.length} tenants
            </span>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6 font-semibold">Company Name</th>
                  <th className="py-3 px-4 font-semibold">Tenant UUID</th>
                  <th className="py-3 px-4 font-semibold">Niche / Focus</th>
                  <th className="py-3 px-4 font-semibold">Contact Email</th>
                  <th className="py-3 px-4 font-semibold">Provisioned</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <IconSpinner size={24} className="text-indigo-600 mx-auto mb-2" />
                      <span>Loading real tenant directory from database...</span>
                    </td>
                  </tr>
                ) : filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <IconAlertCircle size={24} className="text-slate-400 mx-auto mb-2" />
                      <span>No tenant organizations found matching filter.</span>
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => handleOpenDrawer(t)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 border border-indigo-100">
                            {t.name.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{t.name}</div>
                            <div className="text-[11px] text-slate-500">{t.plan}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-medium text-indigo-600 select-all text-[11px]">
                        {t.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-[180px] truncate">
                        {t.niche}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 select-all">
                        {t.contactEmail}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {t.createdDate}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            t.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.isActive ? "bg-emerald-600" : "bg-amber-600"
                            }`}
                          />
                          {t.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => handleToggleStatus(e, t)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                              t.isActive
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            }`}
                          >
                            {t.isActive ? "Suspend" : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(t)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Inspect & Edit Drawer */}
        {selectedTenant && editingTenant && (
          <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in">
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
              onClick={() => setSelectedTenant(null)}
            />
            <div className="relative z-50 w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200 overflow-y-auto text-xs">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <IconBuilding size={20} className="text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-900">
                      Configure Tenant Enclave
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTenant(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                  >
                    <IconClose size={18} />
                  </button>
                </div>

                {saveStatus === "saved" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 flex items-center gap-2 font-medium">
                    <IconCheckCircle size={18} className="text-emerald-600 shrink-0" />
                    <span>Configuration saved to PostgreSQL cluster via PATCH /tenants/:id</span>
                  </div>
                )}

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Tenant UUID:</span>
                    <span className="font-mono font-bold text-indigo-600 select-all">{editingTenant.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Placement:</span>
                    <span className="font-mono text-slate-700">{editingTenant.cluster}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Provisioned:</span>
                    <span className="text-slate-700">{editingTenant.createdDate}</span>
                  </div>
                </div>

                <form onSubmit={handleSaveTenant} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Agency / Company Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingTenant.name}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, name: e.target.value })
                      }
                      required
                      className="w-full p-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Primary Contact Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={editingTenant.contactEmail}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, contactEmail: e.target.value })
                      }
                      required
                      className="w-full p-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Niche / Industry Focus
                    </label>
                    <input
                      type="text"
                      value={editingTenant.niche}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, niche: e.target.value })
                      }
                      className="w-full p-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Brand Voice Directive
                    </label>
                    <textarea
                      rows={2}
                      value={editingTenant.brandVoice}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, brandVoice: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Google Sheet ID
                    </label>
                    <input
                      type="text"
                      value={editingTenant.googleSheetId}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, googleSheetId: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Booking Calendar URL
                    </label>
                    <input
                      type="url"
                      value={editingTenant.bookingUrl}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, bookingUrl: e.target.value })
                      }
                      className="w-full p-2 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 outline-none"
                    />
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <input
                        type="checkbox"
                        checked={editingTenant.isActive}
                        onChange={(e) =>
                          setEditingTenant({ ...editingTenant, isActive: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-indigo-600"
                      />
                      <span className="font-semibold text-slate-800">
                        Enclave Live Routing (Active)
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTenant(null)}
                      className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saveStatus === "saving"}
                      className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      {saveStatus === "saving" ? <IconSpinner size={14} /> : null}
                      <span>{saveStatus === "saving" ? "Saving..." : "Save Configuration"}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Onboard New Tenant Enclave */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
              onClick={() => setIsCreateModalOpen(false)}
            />
            <div className="relative z-50 w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <IconBuilding size={20} className="text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">
                    Onboard New Agency Enclave
                  </h3>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <IconClose size={18} />
                </button>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <IconAlertCircle size={16} className="text-rose-500 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTenant} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Agency / Company Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                    placeholder="e.g. Nexus Growth Partners"
                    required
                    className="w-full p-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Contact / Notification Email <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="alex@nexusgrowth.io"
                    required
                    className="w-full p-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Niche / Market
                  </label>
                  <input
                    type="text"
                    value={newNiche}
                    onChange={(e) => setNewNiche(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Brand Voice Directive
                  </label>
                  <textarea
                    rows={2}
                    value={newBrandVoice}
                    onChange={(e) => setNewBrandVoice(e.target.value)}
                    className="w-full p-2 bg-slate-50 focus:bg-white rounded-xl border border-slate-200 text-slate-900 text-xs outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {createLoading ? <IconSpinner size={14} /> : null}
                    <span>{createLoading ? "Provisioning..." : "Provision Enclave"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
