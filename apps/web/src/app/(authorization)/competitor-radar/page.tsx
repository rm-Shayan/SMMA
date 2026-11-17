"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Plus, Radar, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import {
  useCreateCompetitorMutation,
  useGetCompetitorInsightsQuery,
  useGetCompetitorsQuery,
  type CompetitorDto,
  type CompetitorInsightDto,
} from "@/redux/api/competitorsApi";
import { useWebSocketTopic } from "@/shared/hooks/useWebSocketTopic";

function errorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return "Request failed. Please try again.";
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (typeof value === "string") {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String).join(", ");
      if (parsed && typeof parsed === "object") return JSON.stringify(parsed);
    } catch {
      return value;
    }
    return value;
  }
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function getWebsiteUrl(website: string): string {
  return /^https?:\/\//i.test(website) ? website : `https://${website}`;
}

function formatDate(value?: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function insightSummary(insight: CompetitorInsightDto): string {
  if (typeof insight.data === "string") return insight.data;
  if (insight.data === undefined || insight.data === null) return "No insight details provided.";
  return JSON.stringify(insight.data);
}

export default function CompetitorRadarPage() {
  const {
    data: competitorsData,
    isLoading: competitorsLoading,
    isFetching: competitorsFetching,
    error: competitorsError,
    refetch: refetchCompetitors,
  } = useGetCompetitorsQuery();
  const {
    data: insightsData,
    isLoading: insightsLoading,
    error: insightsError,
    refetch: refetchInsights,
  } = useGetCompetitorInsightsQuery({ limit: 50 });
  const [createCompetitor, { isLoading: isCreating }] = useCreateCompetitorMutation();

  useWebSocketTopic("agents", () => {
    void refetchCompetitors();
    void refetchInsights();
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [keywords, setKeywords] = useState("");

  const competitors = useMemo(() => competitorsData?.competitors ?? [], [competitorsData?.competitors]);
  const insights = insightsData?.insights ?? [];
  const filteredCompetitors = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return competitors;
    return competitors.filter((competitor) =>
      [competitor.name, competitor.website, displayValue(competitor.keywords)]
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [competitors, searchQuery]);

  const refresh = () => {
    void refetchCompetitors();
    void refetchInsights();
  };

  const closeAddDialog = () => {
    if (isCreating) return;
    setName("");
    setWebsite("");
    setKeywords("");
    setIsAddOpen(false);
  };

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const result = await createCompetitor({
        name: name.trim(),
        ...(website.trim() ? { website: website.trim() } : {}),
        ...(keywords.trim() ? { keywords: keywords.trim() } : {}),
      }).unwrap();
      if (!result.success) {
        toast.error("The server did not add the competitor.");
        return;
      }
      toast.success(`${result.competitor.name} added to competitor radar.`);
      closeAddDialog();
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">Competitor Radar</h1>
            <span className="rounded-full bg-secondary-container px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-on-secondary-container">
              Workspace
            </span>
          </div>
          <p className="mt-1 text-sm text-secondary">
            Competitors and captured insights tracked for this workspace
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={refresh}
            disabled={competitorsFetching}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-3.5 text-xs font-semibold text-on-surface shadow-sm hover:bg-surface-container disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 text-secondary ${competitorsFetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-container px-3.5 text-xs font-semibold text-on-primary shadow-sm transition-colors hover:bg-primary"
          >
            <Plus className="h-4 w-4" />
            Add competitor
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search competitors by name, website, or keywords..."
            className="h-9 w-full rounded border border-outline-variant bg-surface-container-low pl-9 pr-3 text-xs text-on-surface outline-none transition-all placeholder:text-outline focus:border-primary focus:bg-surface-container-lowest"
          />
        </div>
        <span className="text-xs text-secondary">
          {competitorsLoading ? "Loading competitors..." : `${filteredCompetitors.length} tracked`}
        </span>
      </div>

      {competitorsError && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-error/30 bg-error-container/30 p-4 text-sm text-on-surface">
          <span>{errorMessage(competitorsError)}</span>
          <button type="button" onClick={() => void refetchCompetitors()} className="shrink-0 font-semibold text-primary-container hover:underline">
            Retry
          </button>
        </div>
      )}

      {competitorsLoading ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center text-sm text-secondary">
          Loading tracked competitors...
        </div>
      ) : !competitorsError && filteredCompetitors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
          <Radar className="mx-auto h-8 w-8 text-secondary" />
          <h2 className="mt-3 font-semibold text-on-surface">
            {competitors.length ? "No competitors match this search" : "No competitors tracked yet"}
          </h2>
          {!competitors.length && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="mt-4 rounded-lg bg-primary-container px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary"
            >
              Add competitor
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredCompetitors.map((competitor: CompetitorDto) => (
            <article
              key={competitor.id}
              className="space-y-5 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-sm font-bold text-primary-container">
                  {initials(competitor.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-bold text-on-surface">{competitor.name}</h2>
                  {competitor.website ? (
                    <a
                      href={getWebsiteUrl(competitor.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-secondary transition-colors hover:text-primary-container"
                    >
                      <span className="truncate">{competitor.website}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <span className="mt-1 block text-xs text-secondary">No website provided</span>
                  )}
                </div>
              </div>
              <div className="space-y-3 border-t border-surface-container pt-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Keywords</span>
                  <p className="mt-1 text-sm text-on-surface">{displayValue(competitor.keywords)}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Social handles</span>
                  <p className="mt-1 break-words text-sm text-on-surface">{displayValue(competitor.social_handles)}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <section className="space-y-3 rounded-xl border border-outline-variant/80 bg-surface-container-lowest p-5 shadow-sm">
        <div>
          <h2 className="font-bold text-on-surface">Recent captured insights</h2>
          <p className="mt-0.5 text-xs text-secondary">Insights recorded by the backend for tracked competitors.</p>
        </div>
        {insightsError ? (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-lg bg-error-container/30 p-3 text-sm text-on-surface">
            <span>{errorMessage(insightsError)}</span>
            <button type="button" onClick={() => void refetchInsights()} className="shrink-0 font-semibold text-primary-container hover:underline">
              Retry
            </button>
          </div>
        ) : insightsLoading ? (
          <p className="py-4 text-sm text-secondary">Loading insights...</p>
        ) : insights.length === 0 ? (
          <p className="py-4 text-sm text-secondary">No captured insights are available.</p>
        ) : (
          <div className="divide-y divide-surface-container">
            {insights.map((insight) => (
              <article key={insight.id} className="flex flex-col justify-between gap-2 py-3 sm:flex-row sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-on-surface">
                      {insight.competitor || "Competitor"}
                    </span>
                    {insight.type && (
                      <span className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] font-semibold text-secondary">
                        {insight.type}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-words text-sm text-on-surface-variant">{insightSummary(insight)}</p>
                </div>
                <time className="shrink-0 text-[11px] text-secondary">{formatDate(insight.captured_at)}</time>
              </article>
            ))}
          </div>
        )}
      </section>

      {isAddOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-competitor-title"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-inverse-surface/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeAddDialog();
          }}
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg space-y-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="add-competitor-title" className="text-xl font-bold text-on-surface">Add competitor</h2>
                <p className="mt-1 text-sm text-secondary">Track a competitor for this workspace.</p>
              </div>
              <button
                type="button"
                onClick={closeAddDialog}
                disabled={isCreating}
                aria-label="Close dialog"
                className="rounded-lg p-1.5 text-secondary hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-on-surface">Name</span>
              <input
                autoFocus
                required
                maxLength={160}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-on-surface">Website</span>
              <input
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.target.value)}
                placeholder="https://example.com"
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-on-surface">Keywords</span>
              <input
                value={keywords}
                onChange={(event) => setKeywords(event.target.value)}
                placeholder="e.g. digital marketing, SaaS"
                className="h-10 w-full rounded-lg border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface outline-none focus:border-primary"
              />
            </label>
            <div className="flex justify-end gap-2 border-t border-surface-container pt-4">
              <button
                type="button"
                onClick={closeAddDialog}
                disabled={isCreating}
                className="h-9 rounded-lg border border-outline-variant px-4 text-sm font-medium text-secondary hover:bg-surface-container disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="h-9 rounded-lg bg-primary-container px-4 text-sm font-semibold text-on-primary hover:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreating ? "Adding..." : "Add competitor"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
