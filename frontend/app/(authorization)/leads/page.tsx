"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { ViewState } from "@/components/StateSwitcher";
import { apiGet } from "@/services/api";

interface Lead {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  channel: string;
  inquiry: string;
  score: number;
  stage: string;
  createdDate: string;
}

const sampleLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Sarah Jenkins",
    role: "VP of Marketing • Lumina Retail",
    email: "s.jenkins@luminaretail.com",
    phone: "+1 (415) 892-1049",
    channel: "LinkedIn InMail",
    inquiry: "Evaluating autonomous social media management solution for Lumina Retail. Requested proposal for enterprise cluster.",
    score: 94,
    stage: "PROPOSAL_REQUESTED",
    createdDate: "Today, 10:42 AM",
  },
  {
    id: "lead-2",
    name: "David Chen",
    role: "Growth Director • ScaleWave",
    email: "d.chen@scalewave.io",
    phone: "+1 (212) 554-9021",
    channel: "LinkedIn InMail",
    inquiry: "Inquired about CRM webhook routing, automated follow-up sequences, and API webhook delivery latency.",
    score: 89,
    stage: "QUALIFIED_HOT",
    createdDate: "Yesterday, 3:15 PM",
  },
  {
    id: "lead-3",
    name: "Elena Rostova",
    role: "Creative Director • Forma Studios",
    email: "elena@formastudios.design",
    phone: "+44 20 7946 0912",
    channel: "Instagram DM",
    inquiry: "Requested verification of scheduled reels and brand voice alignment for European creative agency branch.",
    score: 72,
    stage: "ENGAGED",
    createdDate: "Oct 24, 2:30 PM",
  },
  {
    id: "lead-4",
    name: "Marcus Vance",
    role: "Founder • NextGen Velocity",
    email: "marcus@velocitygrowth.co",
    phone: "+1 (312) 449-8801",
    channel: "X (Twitter) DM",
    inquiry: "General inquiry on autonomous agent dispatch across multi-client social agency roster.",
    score: 65,
    stage: "LEAD_INBOUND",
    createdDate: "Oct 22, 11:00 AM",
  },
  {
    id: "lead-5",
    name: "Clara Gomez",
    role: "Media Agency Lead • Pulse Media",
    email: "clara@pulsemedia.es",
    phone: "+34 91 123 4567",
    channel: "WhatsApp Business",
    inquiry: "Requested reschedule of technical demo walkthrough to 3:00 PM CET.",
    score: 82,
    stage: "DEMO_SCHEDULED",
    createdDate: "Oct 21, 09:12 AM",
  },
];

export default function LeadsPage() {
  const [viewState, setViewState] = useState<ViewState>("live");
  const [leadsList, setLeadsList] = useState<Lead[]>(sampleLeads);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    apiGet<{ success: boolean; count: number; leads: any[] }>("/agents/leads")
      .then((res) => {
        if (res.leads && res.leads.length > 0) {
          const mapped: Lead[] = res.leads.map((l) => ({
            id: l.id,
            name: l.name || "Prospect",
            role: "Captured Lead",
            email: l.email || "N/A",
            phone: l.phone || "N/A",
            channel: l.channel || "INBOUND",
            inquiry: l.inquiry_interest || l.inquiry || "Direct Inbound Prospect",
            score: l.lead_score ?? 75,
            stage: l.crm_stage || "NEW_LEAD",
            createdDate: l.created_at ? new Date(l.created_at).toLocaleDateString() : "Recent",
          }));
          setLeadsList(mapped);
        }
      })
      .catch(() => {
        /* fallback to sample data gracefully */
      });
  }, []);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 1500);
  };

  return (
    <AppShell>
      <div className="flex flex-col w-full">
        {/* Top Header & State Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-md mb-space-lg pb-space-md border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Captured Leads
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container"></span>
                Lead Ingestion Active
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-secondary mt-0.5">
              Read-only feed of prospects captured and scored by autonomous inbound agent nodes.
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
              <span className="material-symbols-outlined text-[15px]">list</span>
              Live Leads
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
              Table Skeleton
            </button>
            <button
              onClick={() => setViewState("empty")}
              className={`px-3 py-1.5 rounded-lg font-label-sm text-label-sm transition-all duration-150 flex items-center gap-1.5 ${
                viewState === "empty"
                  ? "bg-primary-container text-on-primary shadow-xs font-semibold"
                  : "text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">inbox</span>
              Empty State
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
        {/* VIEW 1: LIVE DATA TABLE                        */}
        {/* ============================================== */}
        {viewState === "live" && (
          <div className="flex flex-col w-full space-y-space-lg">
            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              {/* Total Leads */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                    Total Leads Captured
                  </span>
                  <div className="font-headline-xl text-headline-xl text-on-surface leading-tight font-semibold">
                    1,248
                  </div>
                  <div className="flex items-center gap-1 font-body-sm text-body-sm text-tertiary font-medium">
                    <span className="material-symbols-outlined text-[15px]">trending_up</span>
                    <span>+42 captured this week</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">group_add</span>
                </div>
              </div>

              {/* Hot Leads */}
              <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-xs border border-outline-variant/40 flex items-center justify-between">
                <div className="space-y-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary">
                    Hot Leads (Score 80+)
                  </span>
                  <div className="font-headline-xl text-headline-xl text-on-surface leading-tight font-semibold">
                    86
                  </div>
                  <div className="flex items-center gap-1.5 font-body-sm text-body-sm text-secondary">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-tertiary-fixed text-on-tertiary-fixed">
                      TOP 7%
                    </span>
                    <span>High-intent qualified prospects</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <span className="material-symbols-outlined text-[24px]">
                    local_fire_department
                  </span>
                </div>
              </div>
            </div>

            {/* Leads Table Card */}
            <div className="bg-surface-container-lowest rounded-xl shadow-xs border border-outline-variant/40 overflow-hidden flex flex-col">
              <div className="p-4 bg-surface-container-lowest border-b border-outline-variant/30 flex items-center justify-between">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
                  <span>Captured Prospects</span>
                  <span className="text-xs font-normal text-secondary">(Latest 50 records)</span>
                </h2>
                <span className="text-xs text-secondary">Click row to open read-only details</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-container-low text-secondary font-label-sm text-label-sm uppercase tracking-wider border-b border-outline-variant/30">
                      <th className="py-3 px-space-lg font-semibold">Name & Role</th>
                      <th className="py-3 px-space-lg font-semibold">Contact Email</th>
                      <th className="py-3 px-space-lg font-semibold">Source Channel</th>
                      <th className="py-3 px-space-lg font-semibold">Score</th>
                      <th className="py-3 px-space-lg font-semibold">CRM Stage</th>
                      <th className="py-3 px-space-lg font-semibold text-right">Captured Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/30 text-on-surface font-body-md text-body-md">
                    {sampleLeads.map((lead) => {
                      const isHot = lead.score >= 80;
                      return (
                        <tr
                          key={lead.id}
                          onClick={() => setSelectedLead(lead)}
                          className="hover:bg-surface-container-low/60 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-space-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-xs shrink-0">
                                {lead.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </div>
                              <div className="min-w-0">
                                <div className="font-headline-sm text-headline-sm text-on-surface truncate font-semibold">
                                  {lead.name}
                                </div>
                                <div className="font-caption text-caption text-secondary truncate text-xs">
                                  {lead.role}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-space-lg text-secondary text-xs">
                            <span className="text-on-surface select-all">{lead.email}</span>
                          </td>
                          <td className="py-3.5 px-space-lg">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container text-on-surface whitespace-nowrap">
                              <span className="material-symbols-outlined text-[14px] text-primary">
                                hub
                              </span>
                              {lead.channel}
                            </span>
                          </td>
                          <td className="py-3.5 px-space-lg">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isHot
                                  ? "bg-amber-100 text-amber-800 border border-amber-300"
                                  : "bg-surface-container text-secondary"
                              }`}
                            >
                              {isHot && (
                                <span className="material-symbols-outlined text-[13px]">
                                  local_fire_department
                                </span>
                              )}
                              {lead.score}/100
                            </span>
                          </td>
                          <td className="py-3.5 px-space-lg">
                            <span className="px-2 py-0.5 rounded bg-surface-container-high text-on-secondary-container text-[11px] font-mono">
                              {lead.stage}
                            </span>
                          </td>
                          <td className="py-3.5 px-space-lg text-right font-caption text-caption text-secondary whitespace-nowrap text-xs">
                            {lead.createdDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Read-Only Lead Detail Drawer */}
        {selectedLead && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="fixed inset-0 bg-black/30 backdrop-blur-xs"
              onClick={() => setSelectedLead(null)}
            />
            <div className="relative z-50 w-full max-w-md bg-surface-container-lowest h-full shadow-2xl p-6 flex flex-col justify-between border-l border-outline-variant/40 animate-in slide-in-from-right duration-200">
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-primary">
                      contact_page
                    </span>
                    <h3 className="font-headline-sm text-headline-sm font-semibold text-on-surface">
                      Lead Details (Read-Only)
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 rounded-lg text-secondary hover:bg-surface-container"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                <div>
                  <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center text-sm mb-2">
                    {selectedLead.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <h4 className="text-lg font-bold text-on-surface">{selectedLead.name}</h4>
                  <p className="text-xs text-secondary">{selectedLead.role}</p>
                </div>

                <div className="space-y-3 bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Lead Score:</span>
                    <span className="px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-800">
                      {selectedLead.score}/100 {selectedLead.score >= 80 && "🔥 Hot Lead"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">CRM Stage:</span>
                    <span className="font-mono font-semibold text-on-surface">{selectedLead.stage}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Source Channel:</span>
                    <span className="font-medium text-on-surface">{selectedLead.channel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Captured Date:</span>
                    <span className="font-medium text-on-surface">{selectedLead.createdDate}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase mb-1">
                    Contact Email
                  </label>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
                    <span className="font-mono text-on-surface">{selectedLead.email}</span>
                    <button
                      onClick={() => handleCopy(selectedLead.email, "email")}
                      className="text-primary hover:underline font-semibold"
                    >
                      {copiedField === "email" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase mb-1">
                    Phone Number
                  </label>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs">
                    <span className="font-mono text-on-surface">{selectedLead.phone}</span>
                    <button
                      onClick={() => handleCopy(selectedLead.phone, "phone")}
                      className="text-primary hover:underline font-semibold"
                    >
                      {copiedField === "phone" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondary uppercase mb-1">
                    Inquiry Interest
                  </label>
                  <div className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30 text-xs text-secondary leading-relaxed">
                    {selectedLead.inquiry}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="w-full py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 2: LOADING SKELETON                       */}
        {/* ============================================== */}
        {viewState === "loading" && (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 gap-space-lg">
              <div className="h-28 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
              <div className="h-28 bg-surface-container-lowest rounded-xl border border-outline-variant/30"></div>
            </div>
            <div className="h-96 bg-surface-container-lowest rounded-xl border border-outline-variant/30 p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-surface-container-low rounded-lg"></div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================== */}
        {/* VIEW 3: EMPTY STATE                            */}
        {/* ============================================== */}
        {viewState === "empty" && (
          <div className="bg-surface-container-lowest rounded-xl shadow-xs p-12 lg:p-20 flex flex-col items-center justify-center text-center max-w-xl mx-auto my-12 border border-outline-variant/40">
            <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center mb-space-lg text-primary shadow-xs">
              <span className="material-symbols-outlined text-[32px]">contact_page</span>
            </div>
            <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight font-semibold">
              No leads captured yet
            </h2>
            <p className="font-body-md text-body-md text-secondary mt-2 mb-space-lg">
              Contact inquiries and prospect information will automatically appear here once incoming conversations are processed by the autonomous inbound agent.
            </p>
            <a
              href="/agents"
              className="px-5 py-2.5 rounded-lg bg-primary-container text-white text-xs font-semibold hover:bg-primary transition-colors shadow-xs"
            >
              Launch Agent Workspace
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
              Unable to load lead records (500 Internal Error)
            </h2>
            <p className="font-body-sm text-body-sm text-secondary mt-2 mb-space-md">
              The leads database query failed or the tenant context could not be verified.
            </p>
            <button
              onClick={() => setViewState("live")}
              className="px-4 py-2 rounded-lg bg-error text-white text-xs font-semibold hover:bg-on-error-container transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Retry Leads Retrieval
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

