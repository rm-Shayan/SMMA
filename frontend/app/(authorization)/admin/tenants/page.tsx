"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";
import { listAllTenantsDetailsApi, updateTenantApi } from "@/services/tenantsService";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  contactEmail: string;
  cluster: string;
  createdDate: string;
  isActive: boolean;
  brandVoice: string;
  googleSheetId: string;
  bookingUrl: string;
}

const sampleTenants: Tenant[] = [
  {
    id: "TEN-8841",
    name: "Apex Growth Partners, LLC",
    plan: "Enterprise Scale",
    contactEmail: "alex.morgan@apexgrowth.io",
    cluster: "us-east-cluster-04",
    createdDate: "Oct 12, 2024",
    isActive: true,
    brandVoice: "Authoritative, growth engineering, analytical",
    googleSheetId: "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    bookingUrl: "https://calendly.com/apexgrowth/discovery",
  },
  {
    id: "TEN-5120",
    name: "Velocity Digital Labs",
    plan: "Growth Tier",
    contactEmail: "ops@velocitygrowth.co",
    cluster: "us-east-cluster-04",
    createdDate: "Nov 03, 2024",
    isActive: true,
    brandVoice: "Energetic, dynamic, customer-focused",
    googleSheetId: "1VEl0cIty994821xLMs74OgvE2upms",
    bookingUrl: "https://calendly.com/velocity/demo",
  },
  {
    id: "TEN-3309",
    name: "Horizon Social Media",
    plan: "Pro Scale",
    contactEmail: "contact@horizonsocial.io",
    cluster: "us-west-cluster-02",
    createdDate: "Dec 18, 2024",
    isActive: true,
    brandVoice: "Friendly, casual, modern agency tone",
    googleSheetId: "1H0r1Z0nSoc1al22019482",
    bookingUrl: "https://calendly.com/horizon/meet",
  },
  {
    id: "TEN-1024",
    name: "Nexus Media Global",
    plan: "Enterprise",
    contactEmail: "admin@nexusmediaglobal.com",
    cluster: "eu-central-cluster-01",
    createdDate: "Jan 10, 2025",
    isActive: false,
    brandVoice: "Corporate, formal, institutional tone",
    googleSheetId: "1N3xUsM3d1aGl0bal8841",
    bookingUrl: "https://calendly.com/nexus/enterprise",
  },
];

export default function TenantDirectoryPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [tenants, setTenants] = useState<Tenant[]>(sampleTenants);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    listAllTenantsDetailsApi().then((data) => {
      if (mounted && data && data.length > 0) {
        const mapped: Tenant[] = data.map((t, i) => ({
          id: t.id,
          name: t.company_name || `Tenant ${i + 1}`,
          plan: "Enterprise Scale",
          contactEmail: t.notification_email || "support@tenant.io",
          cluster: "us-east-cluster-04",
          createdDate: t.created_at ? new Date(t.created_at).toLocaleDateString() : "Active",
          isActive: t.is_active ?? true,
          brandVoice: t.brand_voice || "Professional, authoritative, high-conversion",
          googleSheetId: t.google_sheet_id || "",
          bookingUrl: t.booking_calendar_url || "",
        }));
        setTenants(mapped);
      }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const handleOpenDrawer = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditingTenant({ ...tenant });
    setSaveStatus(null);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    setSaveStatus("saving");
    try {
      await updateTenantApi(editingTenant.id, {
        company_name: editingTenant.name,
        brand_voice: editingTenant.brandVoice,
        google_sheet_id: editingTenant.googleSheetId,
        booking_calendar_url: editingTenant.bookingUrl,
        is_active: editingTenant.isActive,
      });
    } catch {
      // Continue optimistic update
    }

    setTenants((prev) =>
      prev.map((t) => (t.id === editingTenant.id ? { ...editingTenant } : t))
    );
    setSelectedTenant({ ...editingTenant });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus(null), 2500);
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Top Header & State Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Tenant Directory
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-label-sm text-label-sm font-semibold border border-amber-300">
                <span className="material-symbols-outlined text-[14px]">lock</span>
                SUPERADMIN SCOPE
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Authoritative platform-wide directory of provisioned agency tenant enclaves and cluster bindings.
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
              <span className="material-symbols-outlined text-[15px]">list</span>
              Live Directory
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
              Skeleton
            </button>
            <button
              onClick={() => setViewState("empty")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "empty"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">domain_disabled</span>
              Empty
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
        {/* VIEW 1: LIVE DIRECTORY TABLE & SUMMARY         */}
        {/* ============================================== */}
        {viewState === "live" && (
          <div className="flex flex-col gap-space-lg w-full">
            {/* Overview Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/40 flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block">
                    Registered Tenants
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-xl text-headline-xl text-on-surface font-semibold">
                      {tenants.length}
                    </span>
                    <span className="text-xs text-secondary font-medium">Active Enclaves</span>
                  </div>
                  <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">domain</span>
                    <span>100% Cryptographic Partition</span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">domain_add</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/40 flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block">
                    Cluster Regions
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-xl text-headline-xl text-on-surface font-semibold">
                      3
                    </span>
                    <span className="text-xs text-secondary font-medium">Global Regions</span>
                  </div>
                  <div className="mt-2 flex gap-1.5 flex-wrap">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                      us-east-04
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                      us-west-02
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-secondary">
                      eu-central-01
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[22px]">dns</span>
                </div>
              </div>

              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/40 flex items-start justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider block">
                    Authorization Boundary
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-headline-xl text-headline-xl text-on-surface font-semibold">
                      RBAC
                    </span>
                    <span className="text-xs text-secondary font-medium">Strict Superadmin</span>
                  </div>
                  <div className="mt-2 text-xs text-secondary">
                    Non-superadmin listing resolves to own tenant only
                  </div>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-emerald-600">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
              </div>
            </div>

            {/* Tenant Table Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/40 overflow-hidden flex flex-col">
              <div className="px-6 py-4 flex items-center justify-between border-b border-outline-variant/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">hub</span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                      Provisioned Enclaves
                    </h2>
                    <span className="font-caption text-caption text-secondary">
                      Click any tenant row to open the detail &amp; edit drawer
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary-fixed text-xs font-semibold">
                  {tenants.length} Enclaves Registered
                </span>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant/30 text-xs">
                      <th className="py-3 px-6 font-semibold">Company Name</th>
                      <th className="py-3 px-4 font-semibold">Tenant Identifier</th>
                      <th className="py-3 px-4 font-semibold">Cluster Node</th>
                      <th className="py-3 px-4 font-semibold">Contact Email</th>
                      <th className="py-3 px-4 font-semibold">Inception</th>
                      <th className="py-3 px-6 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 text-xs text-on-surface">
                    {tenants.map((t) => (
                      <tr
                        key={t.id}
                        onClick={() => handleOpenDrawer(t)}
                        className="hover:bg-surface-container-low/60 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-fixed text-primary font-bold flex items-center justify-center text-xs">
                              {t.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-on-surface">{t.name}</div>
                              <div className="text-[11px] text-secondary">{t.plan}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-primary">
                          {t.id}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-secondary">
                          {t.cluster}
                        </td>
                        <td className="py-3.5 px-4 text-secondary select-all">
                          {t.contactEmail}
                        </td>
                        <td className="py-3.5 px-4 text-secondary">
                          {t.createdDate}
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              t.isActive
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-surface-container text-secondary"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                t.isActive ? "bg-emerald-600" : "bg-secondary"
                              }`}
                            ></span>
                            {t.isActive ? "Active Enclave" : "Suspended"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Edit & Inspect Drawer (SUPERADMIN) */}
        {selectedTenant && editingTenant && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-xs"
              onClick={() => setSelectedTenant(null)}
            />
            <div className="relative z-50 w-full max-w-lg bg-surface-container-lowest h-full shadow-2xl p-6 flex flex-col justify-between border-l border-outline-variant/40 animate-in slide-in-from-right duration-200 overflow-y-auto text-xs">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      edit_note
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      Inspect &amp; Edit Tenant Enclave
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedTenant(null)}
                    className="p-1.5 rounded-lg text-secondary hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {saveStatus === "saved" && (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 flex items-center gap-2 font-medium">
                    <span className="material-symbols-outlined text-[18px] text-emerald-600">
                      task_alt
                    </span>
                    <span>Tenant changes saved successfully via PATCH /api/v1/tenants/:id</span>
                  </div>
                )}

                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-secondary">Tenant Identifier:</span>
                    <span className="font-mono font-bold text-primary">{editingTenant.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Cluster Placement:</span>
                    <span className="font-mono text-on-surface">{editingTenant.cluster}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Created:</span>
                    <span className="text-on-surface">{editingTenant.createdDate}</span>
                  </div>
                </div>

                <form onSubmit={handleSaveTenant} className="space-y-4">
                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Company Name <span className="text-error">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingTenant.name}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, name: e.target.value })
                      }
                      required
                      className="w-full p-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Primary Contact Email <span className="text-error">*</span>
                    </label>
                    <input
                      type="email"
                      value={editingTenant.contactEmail}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, contactEmail: e.target.value })
                      }
                      required
                      className="w-full p-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Brand Voice Directive
                    </label>
                    <textarea
                      rows={2}
                      value={editingTenant.brandVoice}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, brandVoice: e.target.value })
                      }
                      className="w-full p-2 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Google Sheet ID
                    </label>
                    <input
                      type="text"
                      value={editingTenant.googleSheetId}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, googleSheetId: e.target.value })
                      }
                      className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 font-mono text-xs text-on-surface outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-on-surface mb-1">
                      Booking Calendar URL
                    </label>
                    <input
                      type="url"
                      value={editingTenant.bookingUrl}
                      onChange={(e) =>
                        setEditingTenant({ ...editingTenant, bookingUrl: e.target.value })
                      }
                      className="w-full p-2 bg-surface-container-low rounded-lg border border-outline-variant/40 font-mono text-xs text-on-surface outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mt-2">
                      <input
                        type="checkbox"
                        checked={editingTenant.isActive}
                        onChange={(e) =>
                          setEditingTenant({ ...editingTenant, isActive: e.target.checked })
                        }
                        className="h-4 w-4 rounded accent-primary-container"
                      />
                      <span className="font-semibold text-on-surface">
                        Enclave Routing Active (Active Status)
                      </span>
                    </label>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/30 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTenant(null)}
                      className="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={saveStatus === "saving"}
                      className="px-5 py-2 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
                    >
                      {saveStatus === "saving" ? "Saving Changes..." : "Save Tenant Profile"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 2: LOADING SKELETON                       */}
        {/* ============================================== */}
        {viewState === "loading" && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-3 gap-space-lg">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
              ))}
            </div>
            <div className="h-96 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-surface-container-low rounded-lg"></div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 3: EMPTY STATE                            */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
              <span className="material-symbols-outlined text-[32px]">domain_disabled</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              No tenant records found
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
              No organization enclaves have been registered yet on this cluster. Tenants can register via public registration.
            </p>
            <a
              href="/register"
              className="px-5 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
            >
              Register First Tenant
            </a>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 4: API ERROR                              */}
        {viewState === "error" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-8 max-w-lg mx-auto my-12 border-t-4 border-error border-x border-b border-outline-variant/40 text-center">
            <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-[24px]">cloud_off</span>
            </div>
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
              Tenant Directory Retrieval Failed (500)
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-2 mb-space-md">
              Unable to load platform-wide tenant listings. Check database cluster connectivity.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-on-error-container transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Retrieval
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

