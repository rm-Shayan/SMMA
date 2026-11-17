"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  Sliders,
  FileText,
  CheckCircle2,
  ListOrdered,
  Layers,
  AlertCircle,
  Loader2,
  Copy,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  useGetDocumentsQuery,
  useAnalyzeSlidingMutation,
  type SlidingAnalyzeResponse,
} from "@/redux/api/knowledgeApi";

export default function SlidingAnalyzerPage() {
  const { data: docsData } = useGetDocumentsQuery();
  const [analyzeSliding, { isLoading }] = useAnalyzeSlidingMutation();

  const [selectedDocId, setSelectedDocId] = useState("");
  const [rawText, setRawText] = useState("");
  const [goal, setGoal] = useState("Extract key operational rules and executive summary");
  const [windowSize, setWindowSize] = useState(400);
  const [overlap, setOverlap] = useState(60);

  const [result, setResult] = useState<SlidingAnalyzeResponse | null>(null);

  const handleRunAnalysis = async () => {
    if (!selectedDocId && !rawText.trim()) {
      toast.error("Please select a document or enter text to analyze.");
      return;
    }

    try {
      const payload = {
        documentId: selectedDocId || undefined,
        text: selectedDocId ? undefined : rawText.trim(),
        goal: goal.trim() || undefined,
        windowSize: Number(windowSize) || 400,
        overlap: Number(overlap) || 60,
      };
      const res = await analyzeSliding(payload).unwrap();
      if (!res.success) {
        toast.error(res.error || "Analysis failed");
        return;
      }
      setResult(res);
      toast.success(`Analysis complete across ${res.windowsAnalyzed ?? 0} sliding windows!`);
    } catch (err) {
      const message = (err as { data?: { message?: string } })?.data?.message;
      toast.error(message || "Failed to analyze document.");
    }
  };

  const copySummary = () => {
    if (!result?.summary) return;
    navigator.clipboard.writeText(result.summary);
    toast.success("Executive summary copied to clipboard!");
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/knowledge-base"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-on-surface-variant bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant shadow-2xs transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-secondary group-hover:text-on-surface group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Knowledge</span>
          </Link>
          <span className="text-outline-variant">•</span>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold uppercase tracking-wider text-outline">Knowledge Base</span>
            <span className="text-outline-variant">/</span>
            <span className="font-bold uppercase tracking-wider text-primary">Sliding-Window Analyzer</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-bold text-on-surface">Configuration</h2>
            </div>

            {/* Document Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">
                Select Existing Document
              </label>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs font-medium text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="">-- Or enter raw text below --</option>
                {(docsData?.documents ?? []).map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title || "Untitled Document"} ({doc.source})
                  </option>
                ))}
              </select>
            </div>

            {/* Raw Text fallback */}
            {!selectedDocId && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-secondary">
                  Or Paste Document Text
                </label>
                <textarea
                  rows={5}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste multi-page SOP, contractual guidelines, or knowledge text here..."
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface placeholder:text-outline focus:outline-none focus:border-primary resize-none"
                />
              </div>
            )}

            {/* Analysis Goal */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-secondary">
                Analysis Goal / Extraction Focus
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Extract SLA rules, escalation tiers and pricing"
                className="w-full h-9 px-3 rounded-xl bg-surface-container-low border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-primary"
              />
            </div>

            {/* Sliders for Window & Overlap */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-secondary">
                  <span>Window Size</span>
                  <span className="text-primary">{windowSize} words</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1200}
                  step={50}
                  value={windowSize}
                  onChange={(e) => setWindowSize(Number(e.target.value))}
                  className="w-full accent-primary h-1.5"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-semibold text-secondary">
                  <span>Overlap</span>
                  <span className="text-primary">{overlap} words</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={200}
                  step={10}
                  value={overlap}
                  onChange={(e) => setOverlap(Number(e.target.value))}
                  className="w-full accent-primary h-1.5"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="w-full mt-2 h-10 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Windows...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Sliding-Window Engine</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Column */}
        <div className="lg:col-span-7 space-y-5">
          {!result && !isLoading && (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-dashed border-outline-variant text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-surface-container-low text-secondary flex items-center justify-center mx-auto">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-on-surface">No Analysis Run Yet</h3>
              <p className="text-xs text-secondary max-w-sm mx-auto">
                Select a document and click Execute to run the high-precision multi-window engine that prevents context truncation.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-outline-variant text-center space-y-3 animate-pulse">
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <h3 className="text-sm font-bold text-on-surface">Sliding Across Document Segments</h3>
              <p className="text-xs text-secondary">
                Analyzing windows with {overlap} words overlap to preserve continuity...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Summary Card */}
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-on-surface">Executive Synthesis</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {result.windowsAnalyzed ?? 1} Windows
                    </span>
                    <button
                      type="button"
                      onClick={copySummary}
                      className="p-1.5 rounded-lg text-secondary hover:text-on-surface hover:bg-surface-container-low transition-colors"
                      title="Copy summary"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-on-surface whitespace-pre-line bg-surface-container-low/50 p-3.5 rounded-xl border border-outline-variant/60">
                  {result.summary || "No synthesized summary returned."}
                </p>
              </div>

              {/* Rules Card */}
              {result.rules && result.rules.length > 0 && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <ListOrdered className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-on-surface">Extracted Operational Rules</h3>
                  </div>
                  <ul className="space-y-2">
                    {result.rules.map((rule, idx) => (
                      <li
                        key={idx}
                        className="text-xs text-on-surface flex items-start gap-2 bg-surface-container-low/40 p-2.5 rounded-lg border border-outline-variant/40"
                      >
                        <span className="font-bold text-primary mt-0.5">•</span>
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Insights Card */}
              {result.insights && result.insights.length > 0 && (
                <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-bold text-on-surface">Key Insights & Anomalies</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.insights.map((insight, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-surface-container-low text-on-surface border border-outline-variant"
                      >
                        {insight}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
