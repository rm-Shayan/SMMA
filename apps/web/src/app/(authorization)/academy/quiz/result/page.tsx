"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Download,
  Share2,
  Award,
  Unlock,
  Info,
} from "lucide-react";

function QuizResultInner() {
  const params = useSearchParams();
  const sopId = params.get("sopId");
  const scoreParam = params.get("score");
  const passedParam = params.get("passed");
  const score = scoreParam ? Number(scoreParam) : 92;
  const passed = passedParam ? passedParam === "1" || passedParam === "true" : score >= 70;

  const handleDownload = () => toast.success("Downloading official PDF certificate");
  const handleShare = () => toast.success("Credential share prepared");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased pb-16">
      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/academy" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group py-1.5 px-2.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to SOP Academy</span>
          </Link>

          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border uppercase tracking-wide ${passed ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" : "bg-red-500/10 text-red-700 border-red-500/20"}`}>
                Evaluation Result
              </span>
              <h1 className="text-sm font-semibold text-foreground">{sopId ? `SOP ${sopId.slice(0, 8)} Quiz` : "SOP Quiz Result"}</h1>
            </div>
            <p className="text-[11px] text-muted-foreground">Submitted via <code>/knowledge/sops/:id/quiz/submit</code></p>
          </div>

          <div className="flex items-center gap-2.5">
            <button onClick={handleDownload} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:opacity-90 shadow-xs transition-opacity">
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 sm:p-8 relative overflow-hidden">
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
                <div className="relative flex items-center justify-center shrink-0">
                  <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center ${passed ? "border-emerald-500/30" : "border-red-500/30"}`}>
                    <div className="text-center">
                      <span className="text-3xl font-bold tracking-tight text-foreground block">{Number.isFinite(score) ? Math.round(score) : "—"}%</span>
                      <span className="text-[10px] text-muted-foreground tracking-widest uppercase">Score</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${passed ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                    {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span>{passed ? "Evaluation Passed" : "Evaluation Failed"}</span>
                  </div>
                  <h2 className="text-xl font-bold text-foreground">{passed ? "Proficiency Standard Met" : "Review Required"}</h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Quiz result loaded from submission response{passedParam || scoreParam ? " query params" : ""}. SOP: <strong className="text-foreground">{sopId || "N/A"}</strong>.
                  </p>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                    <button onClick={handleDownload} className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs">
                      <Download className="w-3.5 h-3.5" /><span>Download certificate</span>
                    </button>
                    <Link href="/academy" className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-card border border-border text-foreground text-xs font-semibold hover:bg-muted transition-colors shadow-xs">
                      <ArrowLeft className="w-3.5 h-3.5" /><span>Back to SOP Academy</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60"><Info className="w-4 h-4 text-primary" /><h3 className="text-base font-semibold text-foreground">Submission Details</h3></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60"><div className="text-muted-foreground">SOP ID</div><div className="font-semibold text-foreground break-all">{sopId || "—"}</div></div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60"><div className="text-muted-foreground">Score</div><div className="font-semibold text-foreground">{Number.isFinite(score) ? Math.round(score) : "—"}%</div></div>
                <div className="p-3 rounded-lg bg-muted/40 border border-border/60"><div className="text-muted-foreground">Status</div><div className={`font-semibold ${passed ? "text-emerald-700" : "text-red-700"}`}>{passed ? "Passed" : "Failed"}</div></div>
              </div>
              <p className="text-xs text-muted-foreground">Detailed per-question review is shown when the submit endpoint returns question-level feedback.</p>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-border/60">
                <div className="flex items-center gap-2"><Award className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm text-foreground">Earned Credential</h3></div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${passed ? "bg-emerald-500/10 text-emerald-700" : "bg-muted text-muted-foreground"}`}>{passed ? "Verified" : "Pending"}</span>
              </div>
              <div className="relative bg-muted/20 border-2 border-dashed border-primary/30 p-6 rounded-xl flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-3 shadow-md"><Award className="w-6 h-6" /></div>
                <span className="text-[10px] text-muted-foreground tracking-widest uppercase mb-1">Styre Autonomous Academy</span>
                <h4 className="text-base font-bold text-foreground mb-2">Certificate of Competency</h4>
                <p className="text-xs text-muted-foreground mb-3 px-2">SOP completion result recorded for <strong className="text-foreground">{sopId || "selected SOP"}</strong>.</p>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                <button onClick={handleDownload} className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity shadow-xs"><Download className="w-4 h-4" /><span>Download PDF Certificate</span></button>
                <button onClick={handleShare} className="w-full inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-muted text-foreground text-xs font-semibold hover:bg-muted/80 transition-colors"><Share2 className="w-4 h-4" /><span>Add to Professional Profile</span></button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm p-5 flex flex-col gap-3">
              <h4 className="text-xs font-semibold text-foreground">Module Permissions Status</h4>
              <div className="flex items-start gap-2.5 p-3 bg-muted/40 rounded-lg border border-border/60">
                <Unlock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-foreground">Playbook Access</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{passed ? "Quiz passed. Access/clearance updates follow backend policy." : "Pass the quiz to update access/clearance."}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuizResultPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading result...</div>}>
      <QuizResultInner />
    </Suspense>
  );
}
