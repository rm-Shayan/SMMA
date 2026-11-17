"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Download,
  Upload,
  Plus,
  Search,
  List,
  Kanban,
  Users,
  Flame,
  Send,
  MailCheck,
  TrendingUp,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  MOCK_LEADS_DATA,
  MOCK_PIPELINE_COLUMNS,
  LeadItem,
} from "@/mocks/leadsData";
import ImportLeadsDialog from "@/components/leads/ImportLeadsDialog";
import AddLeadDialog from "@/components/leads/AddLeadDialog";
import { useGetContactsQuery, ContactDto } from "@/redux/api/leadsApi";
import { useWebSocketTopic } from "@/hooks/useWebSocketTopic";

function mapContactToLead(c: ContactDto, idx: number): LeadItem {
  const initials = c.name
    ? c.name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
    : "LD";
  const stages: LeadItem["stage"][] = ["New", "Contacted", "Replied", "Qualified", "Won"];
  const stage = stages[idx % stages.length] || "New";
  const scores: LeadItem["score"][] = ["Hot", "Warm", "Cold"];
  const score = scores[idx % scores.length] || "Warm";

  return {
    id: c.id,
    name: c.name || "Anonymous Prospect",
    initials,
    company: c.company_name || "Independent",
    email: c.email,
    phone: "+1 (555) 382-9014",
    source: c.topic && c.topic.toLowerCase().includes("linkedin") ? "LinkedIn" : "Email",
    sourceIcon: "in",
    score,
    scoreTone: score === "Hot" ? "error" : score === "Warm" ? "amber" : "slate",
    stage,
    stageTone: stage === "Won" ? "emerald" : stage === "Qualified" ? "tertiary" : "primary",
    lastActivity: c.created_at ? new Date(c.created_at).toLocaleDateString() : "Just now",
    agentOwner: "Agent #6 Outreach",
    dealSize: "$4,200/mo",
    notes: c.topic ? `Topic: ${c.topic}` : "Prospect captured in live CRM database.",
  };
}

function LeadsContent() {
  const searchParams = useSearchParams();
  const [viewMode, setViewMode] = useState<"table" | "pipeline">("table");
  const [selectedLeadId, setSelectedLeadId] = useState<string>("lead-1");
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [isImportModalOpen, setIsImportModalOpen] = useState(() => searchParams?.get("import") === "1");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: contactsData, refetch: refetchContacts } = useGetContactsQuery();

  // Live inbound lead feed — refresh the table when agents capture new contacts.
  useWebSocketTopic<{ event_type?: string }>("leads", () => {
    void refetchContacts();
  });

  const leads: LeadItem[] = React.useMemo(() => {
    if (contactsData?.contacts && contactsData.contacts.length > 0) {
      return contactsData.contacts.map((c, idx) => mapContactToLead(c, idx));
    }
    return MOCK_LEADS_DATA;
  }, [contactsData]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === "all" || l.stage.toLowerCase() === stageFilter.toLowerCase();
    const matchesSource = sourceFilter === "all" || l.source.toLowerCase().includes(sourceFilter.toLowerCase());
    return matchesSearch && matchesStage && matchesSource;
  });

  const handleExportCSV = () => {
    const headers = "Name,Company,Email,Phone,Source,Score,Stage,LastActivity,DealSize\n";
    const rows = leads
      .map(
        (l) =>
          `"${l.name}","${l.company}","${l.email}","${l.phone}","${l.source}","${l.score}","${l.stage}","${l.lastActivity}","${l.dealSize || ""}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    toast.success("Leads CSV exported successfully");
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">Leads</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-fixed text-primary font-semibold tracking-wider uppercase">
              WORKSPACE
            </span>
          </div>
          <p className="text-sm text-secondary mt-1">
            Prospects captured by your autonomous agents across multi-channel campaigns.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-1.5 border border-outline-variant"
          >
            <Download className="w-4 h-4 text-secondary" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-1.5 border border-outline-variant"
          >
            <Upload className="w-4 h-4 text-secondary" />
            <span>Import leads</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-3.5 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-semibold shadow-sm hover:bg-surface-container-low transition-colors flex items-center gap-1.5 border border-outline-variant"
          >
            <Plus className="w-4 h-4 text-secondary" />
            <span>Add lead</span>
          </button>
          <Link
            href="/sequences/new"
            className="h-9 px-3.5 rounded-lg bg-primary-container text-on-primary text-xs font-semibold shadow-sm hover:bg-primary transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New sequence</span>
          </Link>
        </div>
      </div>

      {/* Top Row: 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Total Leads</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-primary-container">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface tabular-nums">248</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-primary text-[11px] font-semibold tabular-nums">
              <TrendingUp className="w-3 h-3" />
              <span>+14% mo</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-primary-container rounded-full w-[72%]" />
          </div>
        </div>

        {/* Hot Leads */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Hot Leads</span>
            <div className="w-8 h-8 rounded-lg bg-error-container/60 flex items-center justify-center text-error">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface tabular-nums">36</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error-container text-on-error-container text-[11px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-error" />
              <span>High Intent</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-error rounded-full w-[45%]" />
          </div>
        </div>

        {/* Contacted */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Contacted</span>
            <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary-container">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface tabular-nums">112</span>
            <span className="text-xs text-secondary tabular-nums font-medium">45.1% dispatch</span>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-surface-tint rounded-full w-[56%]" />
          </div>
        </div>

        {/* Replied */}
        <div className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/80 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Replied</span>
            <div className="w-8 h-8 rounded-lg bg-tertiary-fixed flex items-center justify-center text-tertiary">
              <MailCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-on-surface tabular-nums">41</span>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-[11px] font-semibold tabular-nums">
              <span>36.6% rate</span>
            </div>
          </div>
          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <div className="h-full bg-tertiary-container rounded-full w-[36.6%]" />
          </div>
        </div>
      </div>

      {/* Filter & Action Toolbar */}
      <div className="bg-surface-container-lowest rounded-xl p-3.5 shadow-sm border border-outline-variant/80 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-1 max-w-2xl">
          {/* Search Input */}
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by name, email, company..."
              className="w-full h-9 pl-9 pr-3 rounded bg-surface-container-low text-xs text-on-surface placeholder:text-outline border border-outline-variant focus:outline-none focus:bg-surface-container-lowest transition-all"
            />
          </div>

          {/* Stage Filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-9 px-3 rounded bg-surface-container-low text-on-surface text-xs font-semibold border border-outline-variant focus:outline-none cursor-pointer"
          >
            <option value="all">All stages</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="replied">Replied</option>
            <option value="qualified">Qualified</option>
            <option value="won">Won</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="h-9 px-3 rounded bg-surface-container-low text-on-surface text-xs font-semibold border border-outline-variant focus:outline-none cursor-pointer"
          >
            <option value="all">All sources</option>
            <option value="linkedin">LinkedIn</option>
            <option value="instagram">Instagram</option>
            <option value="email">Email</option>
            <option value="meta">Meta Ads</option>
          </select>
        </div>

        {/* View Switcher: Table vs Pipeline */}
        <div className="flex items-center p-1 bg-surface-container-low rounded-lg shrink-0 self-end md:self-auto border border-outline-variant">
          <button
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${viewMode === "table"
                ? "bg-surface-container-lowest text-primary-container shadow-xs"
                : "text-secondary hover:text-on-surface"
              }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Table</span>
          </button>
          <button
            onClick={() => setViewMode("pipeline")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${viewMode === "pipeline"
                ? "bg-surface-container-lowest text-primary-container shadow-xs"
                : "text-secondary hover:text-on-surface"
              }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </button>
        </div>
      </div>

      {/* Main Content: Table View vs Pipeline Kanban */}
      {viewMode === "table" ? (
        <div className="flex flex-col lg:flex-row items-start gap-4">
          {/* Data Table */}
          <div className="flex-1 w-full bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 overflow-hidden">
            <div className="overflow-x-auto min-w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="h-10 bg-surface-container-low text-secondary text-[11px] uppercase tracking-wider font-semibold select-none border-b border-surface-container">
                    <th className="px-4">Lead</th>
                    <th className="px-4">Email</th>
                    <th className="px-4">Phone</th>
                    <th className="px-4">Source</th>
                    <th className="px-4 text-center">Score</th>
                    <th className="px-4">Stage</th>
                    <th className="px-4">Last Activity</th>
                    <th className="px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container text-xs text-on-surface">
                  {filteredLeads.map((lead) => {
                    const isSelected = lead.id === selectedLead.id;
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className={`h-14 hover:bg-surface-container-low/70 transition-colors cursor-pointer relative ${isSelected ? "bg-surface-container-low/70" : ""
                          }`}
                      >
                        <td className="px-4">
                          <div className="flex items-center gap-2.5">
                            {isSelected && (
                              <div className="w-1 absolute left-0 top-0 bottom-0 bg-primary-container rounded-r" />
                            )}
                            <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary font-bold text-xs flex items-center justify-center shrink-0">
                              {lead.initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-on-surface truncate block">{lead.name}</span>
                              <span className="text-[11px] text-secondary truncate block">{lead.company}</span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 font-mono text-[11px] text-primary-container truncate max-w-[160px]">
                          {lead.email}
                        </td>

                        <td className="px-4 text-secondary tabular-nums whitespace-nowrap">
                          {lead.phone}
                        </td>

                        <td className="px-4">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <span className="text-[10px] font-bold text-primary-container">{lead.sourceIcon}</span>
                            <span>{lead.source}</span>
                          </span>
                        </td>

                        <td className="px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${lead.scoreTone === "error"
                                ? "bg-error-container text-on-error-container"
                                : lead.scoreTone === "amber"
                                  ? "bg-amber-100 text-amber-900 border border-amber-200"
                                  : "bg-surface-container text-secondary"
                              }`}
                          >
                            {lead.score === "Hot" && <Flame className="w-3 h-3 text-error" />}
                            {lead.score}
                          </span>
                        </td>

                        <td className="px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${lead.stageTone === "tertiary"
                                ? "bg-tertiary-fixed text-on-tertiary-fixed"
                                : lead.stageTone === "emerald"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : lead.stageTone === "primary"
                                    ? "bg-primary-fixed text-primary"
                                    : "bg-surface-container text-secondary"
                              }`}
                          >
                            {lead.stage}
                          </span>
                        </td>

                        <td className="px-4 text-secondary whitespace-nowrap text-[11px]">
                          {lead.lastActivity}
                        </td>

                        <td className="px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toast(`Managing ${lead.name}`, { icon: "👤" });
                            }}
                            className="p-1.5 text-secondary hover:text-on-surface rounded-lg hover:bg-surface-container transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky Lead Details Drawer Card */}
          <div className="w-full lg:w-80 shrink-0 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container">
              <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">Lead Profile</span>
              <span className="text-[11px] font-mono font-semibold text-primary-container bg-surface-container px-2 py-0.5 rounded">
                {selectedLead.dealSize || "No deal size"}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary font-bold text-base flex items-center justify-center shrink-0">
                {selectedLead.initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-on-surface truncate">{selectedLead.name}</h3>
                <p className="text-xs text-secondary truncate">{selectedLead.company}</p>
                <span className="text-[10px] text-tertiary-container font-medium">{selectedLead.agentOwner}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs text-secondary">
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span>Email:</span>
                <span className="font-semibold text-on-surface font-mono">{selectedLead.email}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span>Phone:</span>
                <span className="font-semibold text-on-surface">{selectedLead.phone}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span>Channel:</span>
                <span className="font-semibold text-on-surface">{selectedLead.source}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span>Current Stage:</span>
                <span className="font-semibold text-primary-container">{selectedLead.stage}</span>
              </div>
            </div>

            {selectedLead.notes && (
              <div className="bg-surface-container-low p-2.5 rounded-lg border border-surface-container text-xs text-secondary leading-relaxed">
                <p className="font-semibold text-[11px] text-on-surface mb-0.5">SOP Context:</p>
                {selectedLead.notes}
              </div>
            )}

            <div className="pt-2 flex items-center gap-2">
              <Link
                href="/inbox"
                className="flex-1 h-8 rounded bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open in Inbox</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Pipeline View (Kanban) */
        <div className="w-full overflow-x-auto pb-4">
          <div className="grid grid-cols-5 gap-3.5 min-w-[1100px] items-start">
            {MOCK_PIPELINE_COLUMNS.map((col) => {
              const colLeads = leads.filter((l) => l.stage.toLowerCase() === col.id.toLowerCase());
              return (
                <div key={col.id} className="flex flex-col bg-surface-container-low/70 rounded-xl p-3 border border-outline-variant/60 shadow-xs">
                  <div className="flex items-center justify-between px-1.5 py-1 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                      <span className="text-xs font-bold text-on-surface">{col.title}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary">
                        {col.count}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {colLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/80 shadow-xs hover:shadow-sm transition-all cursor-pointer flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-surface-container text-xs font-bold text-secondary flex items-center justify-center shrink-0">
                              {lead.initials}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-on-surface truncate block">{lead.name}</span>
                              <span className="text-[10px] text-secondary truncate block">{lead.company}</span>
                            </div>
                          </div>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${lead.score === "Hot"
                                ? "bg-error-container text-on-error-container"
                                : "bg-surface-container text-secondary"
                              }`}
                          >
                            {lead.score}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-[10px] text-secondary border-t border-surface-container">
                          <span>{lead.source}</span>
                          <span className="font-mono">{lead.lastActivity}</span>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => toast(`Add lead to ${col.title}`, { icon: "➕" })}
                      className="w-full py-1.5 rounded text-center text-[11px] font-semibold text-secondary hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add lead</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import Leads Dialog */}
      <ImportLeadsDialog
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={(count) => {
          toast.success(`${count} leads ingested into local workspace view.`);
        }}
      />

      {/* Add Lead Dialog */}
      <AddLeadDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse text-sm">Loading leads...</div>}>
      <LeadsContent />
    </Suspense>
  );
}
