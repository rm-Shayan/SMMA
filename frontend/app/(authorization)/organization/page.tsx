"use client";

import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";

export default function OrganizationPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [activeTab, setActiveTab] = useState<"profile" | "integrations">("profile");

  // Supported fields in backend tenant schema
  const [companyName, setCompanyName] = useState("Apex Growth Partners, LLC");
  const [notificationEmail, setNotificationEmail] = useState("alex.morgan@apexgrowth.io");
  const [brandVoice, setBrandVoice] = useState(
    "Authoritative, high-velocity growth engineering, precise analytical tone, data-backed execution."
  );
  const [googleSheetId, setGoogleSheetId] = useState("1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms");
  const [bookingCalendarUrl, setBookingCalendarUrl] = useState("https://calendly.com/apexgrowth/discovery");
  const [isActive, setIsActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setValidationError("Company name is required.");
      return;
    }
    if (!notificationEmail.trim() || !notificationEmail.includes("@")) {
      setValidationError("A valid primary notification email is required.");
      return;
    }

    setValidationError(null);
    setSaving(true);

    setTimeout(() => {
      setSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }, 800);
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Top Header & State Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Organization Settings
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                Apex Growth Partners Enclave
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Configure tenant profile metadata, brand voice synthesis rules, and integration endpoints.
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
              <span className="material-symbols-outlined text-[15px]">check_circle</span>
              Live Settings
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
              Form Skeleton
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
              No Context
            </button>
            <button
              onClick={() => setViewState("error")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "error"
                  ? "bg-error text-white shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">cloud_off</span>
              API Error
            </button>
          </div>
        </div>

        {/* ============================================== */}
        {/* VIEW 1: LIVE SETTINGS                          */}
        {/* ============================================== */}
        {viewState === "live" && (
          <div className="w-full space-y-6">
            {/* Feedback Banners */}
            {savedSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center justify-between shadow-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-emerald-600 text-[20px]">
                    check_circle
                  </span>
                  <span className="font-semibold">
                    Organization settings successfully updated and synchronized across all agent nodes!
                  </span>
                </div>
                <span className="text-[10px] text-emerald-700 font-mono">Status: 200 OK</span>
              </div>
            )}

            {validationError && (
              <div className="p-4 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">report</span>
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl">
              {/* Left Column: Organization Summary & Cluster Telemetry (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-space-lg">
                <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/40 flex flex-col">
                  <div className="flex items-start justify-between mb-space-md">
                    <div className="w-14 h-14 rounded-xl bg-primary-container flex items-center justify-center text-white font-headline-lg text-headline-lg shadow-xs font-bold">
                      AG
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200">
                      <span className="material-symbols-outlined text-[14px]">verified</span>
                      Verified Tenant
                    </span>
                  </div>

                  <div className="mb-space-md">
                    <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
                      {companyName}
                    </h2>
                    <span className="font-body-sm text-body-sm text-secondary">
                      Multi-agent autonomous agency workspace
                    </span>
                  </div>

                  {/* Telemetry & Identifier Specs */}
                  <div className="bg-surface-container-low rounded-lg p-space-md flex flex-col gap-space-sm mb-space-md border border-outline-variant/30 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">fingerprint</span>
                        Tenant ID
                      </span>
                      <code className="px-1.5 py-0.5 bg-surface-container-lowest rounded font-mono text-[11px] font-semibold text-primary">
                        TEN-8841-US
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">dns</span>
                        Cluster Enclave
                      </span>
                      <span className="font-mono text-on-surface">us-east-cluster-04</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-secondary flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">calendar_today</span>
                        Inception
                      </span>
                      <span className="text-on-surface font-medium">Oct 12, 2024</span>
                    </div>
                  </div>

                  {/* Active Enclave Toggle Indicator */}
                  <div className="p-3 bg-surface-container-low/60 rounded-lg flex items-center justify-between border border-outline-variant/30 text-xs">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isActive ? "bg-emerald-500 animate-pulse" : "bg-secondary"
                        }`}
                      ></span>
                      <span className="font-medium text-on-surface">Enclave Status</span>
                    </div>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded text-[10px] uppercase ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-surface-container text-secondary"
                      }`}
                    >
                      {isActive ? "Active Routing" : "Suspended"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Settings Tabs & Form (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col">
                <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/40 overflow-hidden">
                  {/* Internal Sub-navigation Tabs */}
                  <div className="flex border-b border-outline-variant/30 bg-surface-container-low/40 px-6 pt-3 gap-6 text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveTab("profile")}
                      className={`pb-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "profile"
                          ? "border-primary-container text-primary-container"
                          : "border-transparent text-secondary hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">corporate_fare</span>
                      General Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("integrations")}
                      className={`pb-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
                        activeTab === "integrations"
                          ? "border-primary-container text-primary-container"
                          : "border-transparent text-secondary hover:text-on-surface"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">integration_instructions</span>
                      Backend Integrations
                    </button>
                  </div>

                  {/* Form Container */}
                  <form onSubmit={handleSave} className="p-6 space-y-5 text-xs">
                    {activeTab === "profile" && (
                      <div className="space-y-4 animate-in fade-in duration-150">
                        <div>
                          <label className="block font-semibold text-on-surface mb-1">
                            Organization Legal Name <span className="text-error">*</span>
                          </label>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                            className="w-full p-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                          />
                        </div>

                        <div>
                          <label className="block font-semibold text-on-surface mb-1">
                            Primary Notification Email <span className="text-error">*</span>
                          </label>
                          <input
                            type="email"
                            value={notificationEmail}
                            onChange={(e) => setNotificationEmail(e.target.value)}
                            required
                            className="w-full p-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container"
                          />
                          <span className="text-[10px] text-secondary mt-0.5 block">
                            Used for urgent agent escalation and lead qualification alerts.
                          </span>
                        </div>

                        <div>
                          <label className="block font-semibold text-on-surface mb-1">
                            Brand Voice Directive
                          </label>
                          <textarea
                            rows={3}
                            value={brandVoice}
                            onChange={(e) => setBrandVoice(e.target.value)}
                            className="w-full p-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface text-xs outline-none focus:border-primary-container leading-relaxed"
                          />
                          <span className="text-[10px] text-secondary mt-0.5 block">
                            Injected into autonomous agent system prompts during message synthesis.
                          </span>
                        </div>

                        <div className="pt-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={(e) => setIsActive(e.target.checked)}
                              className="h-4 w-4 rounded accent-primary-container"
                            />
                            <span className="text-xs font-semibold text-on-surface">
                              Tenant Routing Enabled (Active State)
                            </span>
                          </label>
                        </div>
                      </div>
                    )}

                    {activeTab === "integrations" && (
                      <div className="space-y-4 animate-in fade-in duration-150">
                        <div>
                          <label className="block font-semibold text-on-surface mb-1">
                            Google Sheets Integration ID
                          </label>
                          <input
                            type="text"
                            value={googleSheetId}
                            onChange={(e) => setGoogleSheetId(e.target.value)}
                            placeholder="e.g. 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            className="w-full p-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface font-mono text-xs outline-none focus:border-primary-container"
                          />
                          <span className="text-[10px] text-secondary mt-0.5 block">
                            Captured leads with high scores (80+) are automatically synced to this spreadsheet.
                          </span>
                        </div>

                        <div>
                          <label className="block font-semibold text-on-surface mb-1">
                            Booking Calendar Link (e.g. Calendly / Google Calendar)
                          </label>
                          <input
                            type="url"
                            value={bookingCalendarUrl}
                            onChange={(e) => setBookingCalendarUrl(e.target.value)}
                            placeholder="https://calendly.com/your-org/demo"
                            className="w-full p-2.5 bg-surface-container-low focus:bg-surface-container-lowest rounded-lg border border-outline-variant/40 text-on-surface font-mono text-xs outline-none focus:border-primary-container"
                          />
                          <span className="text-[10px] text-secondary mt-0.5 block">
                            Supplied by closer agent when inbound inquiries express scheduling intent.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Form Action Controls */}
                    <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-[11px] text-secondary">
                        Changes will be patched via <code>PATCH /api/v1/tenants/:id</code>
                      </span>
                      <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">save</span>
                        <span>{saving ? "Saving Changes..." : "Save Configuration"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 2: FORM SKELETON                          */}
        {/* ============================================== */}
        {viewState === "loading" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl animate-pulse">
            <div className="lg:col-span-4 h-64 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
            <div className="lg:col-span-8 h-96 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-6 space-y-4">
              <div className="h-10 bg-surface-container-low rounded-lg"></div>
              <div className="h-10 bg-surface-container-low rounded-lg"></div>
              <div className="h-24 bg-surface-container-low rounded-lg"></div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 3: EMPTY / NO TENANT CONTEXT              */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
              <span className="material-symbols-outlined text-[32px]">domain_disabled</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              No Tenant Context Active
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
              No organization context is associated with your current session. Please select a tenant from the top header or register an organization.
            </p>
            <a
              href="/register"
              className="px-5 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
            >
              Register Organization
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
              Failed to load organization settings (500)
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-2 mb-space-md">
              Unable to reach the Express tenant controller. Network timeout while querying PostgreSQL tenant table.
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

