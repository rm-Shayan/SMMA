"use client";

import React, { useState } from "react";
import {
  Download,
  BarChart3,
  TrendingUp,
  TrendingDown,
  FileText,
  FileSpreadsheet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useGetDashboardMetricsQuery } from "@/redux/api/dashboardApi";
import { useWebSocketTopic } from "@/shared/hooks/useWebSocketTopic";

interface ChannelStat {
  name: string;
  reach: string;
  leads: number;
  conversionRate: string;
  roi: string;
  status: "up" | "down";
}

const CHANNEL_PERFORMANCE: ChannelStat[] = [
  { name: "LinkedIn B2B Outreach", reach: "94,200", leads: 248, conversionRate: "4.8%", roi: "312%", status: "up" },
  { name: "Instagram Reels Campaign", reach: "128,400", leads: 142, conversionRate: "2.1%", roi: "184%", status: "up" },
  { name: "Cold Email Sequence #4", reach: "42,000", leads: 82, conversionRate: "6.4%", roi: "420%", status: "up" },
  { name: "Twitter / X Content Engine", reach: "19,900", leads: 20, conversionRate: "1.2%", roi: "94%", status: "down" },
];

export default function ReportingAnalyticsPage() {
  const { data: metricsData, refetch } = useGetDashboardMetricsQuery();
  const [dateRange, setDateRange] = useState("Last 30 Days");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [reportTemplate, setReportTemplate] = useState("executive");
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv" | "xlsx">("pdf");
  const [isGenerating, setIsGenerating] = useState(false);

  useWebSocketTopic("all", () => {
    void refetch();
  });

  const handleTriggerExport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setIsExportModalOpen(false);
      toast.success(`Report (${exportFormat.toUpperCase()}) generated and downloaded!`);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <span>Apex Growth Partners</span>
            <span>/</span>
            <span className="text-primary font-semibold">Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Reporting &amp; Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track performance, engagement, and campaign outcomes across all connected social and outreach channels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Selector */}
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-lg bg-card border border-border text-xs text-foreground font-medium focus:outline-none cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Quarter (Q4 2026)</option>
              <option>Year to Date</option>
            </select>
          </div>

          {/* Export Report Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Audience Reach</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">284.5K</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+28.4% vs prev period</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Qualified Leads Captured</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">492</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+34 leads this week</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Outreach Spend</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums">$1,840</div>
          <span className="text-xs text-muted-foreground">Within allocated budget</span>
        </div>

        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Blended CAC / Lead</span>
          <div className="text-2xl font-bold text-foreground mt-1 tabular-nums text-emerald-600">$3.74</div>
          <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium mt-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>-14% cost reduction</span>
          </div>
        </div>
      </div>

      {/* Channel Performance Breakdown */}
      <div className="rounded-xl bg-card border border-border shadow-xs overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">Channel Performance Breakdown</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Campaign conversion metrics segmented by channel</p>
          </div>
          <span className="text-xs text-muted-foreground font-medium">{dateRange}</span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
            <tr>
              <th className="py-3 px-4">Channel Engine</th>
              <th className="py-3 px-4">Impressions / Reach</th>
              <th className="py-3 px-4">Leads Captured</th>
              <th className="py-3 px-4">Conversion Rate</th>
              <th className="py-3 px-4">Estimated ROI</th>
              <th className="py-3 px-4 text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {CHANNEL_PERFORMANCE.map((channel) => (
              <tr key={channel.name} className="hover:bg-muted/40 transition-colors">
                <td className="py-3 px-4 font-semibold text-foreground">{channel.name}</td>
                <td className="py-3 px-4 tabular-nums text-muted-foreground">{channel.reach}</td>
                <td className="py-3 px-4 tabular-nums font-semibold text-foreground">{channel.leads}</td>
                <td className="py-3 px-4 tabular-nums text-muted-foreground">{channel.conversionRate}</td>
                <td className="py-3 px-4 tabular-nums font-semibold text-emerald-600">{channel.roi}</td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      channel.status === "up" ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {channel.status === "up" ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : (
                      <TrendingDown className="w-3.5 h-3.5" />
                    )}
                    <span>{channel.status === "up" ? "+12%" : "-4%"}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Report Modal (Stitch reporting_analytics_export_modal) */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div>
                <h3 className="text-lg font-bold text-foreground">Export Analytics Report</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Generate presentation-ready reports or raw analytical data.
                </p>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTriggerExport} className="space-y-4 text-xs">
              {/* Template selector */}
              <div>
                <label className="block font-semibold text-foreground mb-1.5">Report Template</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReportTemplate("executive")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      reportTemplate === "executive"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="block font-semibold">Executive Summary</span>
                    <span className="text-[11px] text-muted-foreground">High-level KPIs, ROI, and executive charts</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportTemplate("campaign")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      reportTemplate === "campaign"
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="block font-semibold">Campaign Deep-Dive</span>
                    <span className="text-[11px] text-muted-foreground">Channel conversions, CTR, and lead attribution</span>
                  </button>
                </div>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block font-semibold text-foreground mb-1.5">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat("pdf")}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      exportFormat === "pdf"
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <FileText className="w-4 h-4 mx-auto mb-1" />
                    <span>PDF Document</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("csv")}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      exportFormat === "csv"
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 mx-auto mb-1" />
                    <span>Raw CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExportFormat("xlsx")}
                    className={`p-2.5 rounded-lg border text-center transition-all ${
                      exportFormat === "xlsx"
                        ? "border-primary bg-primary/5 text-primary font-bold"
                        : "border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 mx-auto mb-1" />
                    <span>Excel (.xlsx)</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>{isGenerating ? "Generating..." : "Download Report"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
