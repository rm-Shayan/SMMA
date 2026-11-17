"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Sliders,
  PlusCircle,
  Info,
  Save,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useGetRatesQuery, useUpdateRatesMutation } from "@/redux/api/adminApi";

interface RateMeta {
  agentNumber?: string;
  agentName: string;
  action: string;
}

/** Readable labels for the backend action-rate keys. */
const RATE_META: Record<string, RateMeta> = {
  cold_email: { agentNumber: "#6", agentName: "Outreach", action: "Send outreach email" },
  video_generation: { agentName: "Media", action: "Generate video asset" },
  voiceover: { agentName: "Media", action: "Generate voiceover" },
  competitor_report: {
    agentNumber: "#2",
    agentName: "Competitor Researcher",
    action: "Scrape competitor pricing and offers",
  },
  social_post: {
    agentNumber: "#8",
    agentName: "Publisher",
    action: "Publish multi-channel social post",
  },
  comment_reply: {
    agentNumber: "#3",
    agentName: "Comment Responder",
    action: "Generate on-brand comment reply",
  },
  sop_quiz: {
    agentNumber: "#10",
    agentName: "Trainee SOP",
    action: "Grade training quiz and verify compliance",
  },
};

function metaFor(key: string): RateMeta {
  return (
    RATE_META[key] ?? {
      agentName: "Platform",
      action: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    }
  );
}

export default function TenantDirectorPricingPage() {
  const { data, isLoading, isError, error, refetch } = useGetRatesQuery();
  const [updateRates, { isLoading: isSaving }] = useUpdateRatesMutation();

  // Rates saved during this session (the API returns the accepted set but the
  // GET endpoint serves the catalog), merged over the fetched values.
  const [savedRates, setSavedRates] = useState<Record<string, number>>({});
  // Unsaved per-action overrides, keyed by action-rate key.
  const [draftRates, setDraftRates] = useState<Record<string, number>>({});

  const currentRates = useMemo(
    () => ({ ...(data?.actionRates ?? {}), ...savedRates }),
    [data, savedRates],
  );
  const rateKeys = useMemo(() => Object.keys(currentRates), [currentRates]);

  const valueFor = (key: string) => draftRates[key] ?? currentRates[key];
  const changedKeys = rateKeys.filter((key) => valueFor(key) !== currentRates[key]);
  const hasChanges = changedKeys.length > 0;

  const handleStep = (key: string, delta: number) => {
    setDraftRates((prev) => ({
      ...prev,
      [key]: Math.max(1, valueFor(key) + delta),
    }));
  };

  const handleReset = (key: string) => {
    setDraftRates((prev) => ({ ...prev, [key]: currentRates[key] }));
    toast("Reset rate to baseline cost");
  };

  const handleSaveAll = async () => {
    const merged = rateKeys.reduce<Record<string, number>>(
      (acc, key) => ({ ...acc, [key]: valueFor(key) }),
      {},
    );
    try {
      await updateRates({ rates: merged }).unwrap();
      setSavedRates(merged);
      setDraftRates({});
      toast.success("Pricing changes saved. New rates apply from the next action onward.");
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? "Failed to save pricing changes.";
      toast.error(message);
    }
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
                Pricing & Unit Economics
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live action rates</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
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
            className="relative pb-2.5 text-xs font-bold text-[#063cbc] flex items-center gap-2"
          >
            <span>Pricing rates</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#063cbc]"></span>
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#063cbc] rounded-full"></span>
          </Link>
          <Link
            href="/tenant-director/transactions"
            className="pb-2.5 text-xs font-medium text-secondary hover:text-on-surface transition-colors flex items-center gap-1.5"
          >
            <span>Transactions</span>
          </Link>
        </div>
      </div>

      {/* Callout Info Banner */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/80 ">
        <div className="flex items-center gap-2 text-on-surface text-xs">
          <Info className="w-4 h-4 text-[#063cbc] shrink-0" />
          <span className="font-medium">
            Changes apply to all companies from the next action onward.
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant font-mono text-[10px] uppercase tracking-wider text-on-surface-variant ">
            Base Global Catalog
          </span>
          <span className="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant font-mono text-[10px] text-on-surface-variant ">
            Currency: Credits
          </span>
        </div>
      </div>

      {/* Primary Two-Column Layout (70% / 30%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Data Grid Card (8 cols) */}
        <div className="lg:col-span-8 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 overflow-hidden">
          <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-container ">
            <div>
              <h2 className="text-base font-bold text-on-surface ">Credit cost per action</h2>
              <p className="text-xs text-secondary mt-0.5">
                Configure the credit deduction rate billed to tenants per autonomous agent action.
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant ">
              {rateKeys.length} Action Vectors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-lowest text-secondary uppercase text-[10px] tracking-wider font-semibold border-b border-outline-variant ">
                  <th className="py-2.5 px-4">Agent</th>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4 text-right">Current cost</th>
                  <th className="py-2.5 px-4 text-center w-36">New cost</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container text-xs">
                {isLoading && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-secondary">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[#063cbc]" />
                      Loading action rates…
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2 text-rose-500" />
                      <p className="text-secondary">
                        {(error as { data?: { message?: string } })?.data?.message ??
                          "Failed to load action rates."}
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
                {!isLoading && !isError && rateKeys.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-secondary">
                      No action rates configured.
                    </td>
                  </tr>
                )}
                {rateKeys.map((key) => {
                  const meta = metaFor(key);
                  const isChanged = valueFor(key) !== currentRates[key];
                  return (
                    <tr
                      key={key}
                      className={`hover:bg-surface-container-lowest transition-colors ${
                        isChanged ? "bg-surface-container-low/30 " : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#063cbc] text-white text-[11px] font-semibold">
                            {meta.agentNumber ? `${meta.agentNumber} ` : ""}
                            {meta.agentName}
                          </span>
                          {isChanged && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-fixed text-[#063cbc] font-bold uppercase">
                              Changed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-on-surface ">
                        {meta.action}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-secondary">
                        {currentRates[key]}{" "}
                        {currentRates[key] === 1 ? "credit" : "credits"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center rounded-lg bg-surface-container-low border border-outline-variant p-0.5 shadow-xs">
                          <button
                            type="button"
                            onClick={() => handleStep(key, -1)}
                            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest rounded font-bold transition-colors"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-[#063cbc]">
                            {valueFor(key)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStep(key, 1)}
                            className="w-6 h-6 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-lowest rounded font-bold transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {isChanged && (
                          <button
                            type="button"
                            onClick={() => handleReset(key)}
                            className="text-xs font-semibold text-[#063cbc] hover:underline"
                          >
                            Reset
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Global Unit Cost Rules (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/80 p-5 sm:p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-on-surface ">Global unit cost rules</h3>
            <p className="text-xs text-secondary leading-relaxed">
              Base rates determine the profit margin on every autonomous agent task run across all
              tenants.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Minimum action floor</span>
                <span className="font-mono font-semibold text-on-surface ">1 credit</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Configured actions</span>
                <span className="font-semibold text-on-surface tabular-nums">
                  {rateKeys.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-secondary">Pending changes</span>
                <span
                  className={`font-semibold tabular-nums ${
                    hasChanges ? "text-amber-600" : "text-emerald-600"
                  }`}
                >
                  {changedKeys.length}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-surface-container ">
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={!hasChanges || isSaving || isLoading}
                className="w-full h-10 rounded-lg bg-[#063cbc] hover:bg-[#00298a] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? "Saving…" : "Save pricing changes"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
