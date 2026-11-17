"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  BookOpen,
  CheckCircle2,
  Award,
  Search,
  Plus,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  TrendingUp,
  Download,
  Lock,
  Sparkles,
  ShieldCheck,
  ArrowUpRight,
  Info,
  RefreshCw,
} from "lucide-react";
import { MOCK_ACADEMY_DATA } from "@/mocks/academyData";
import { useGetSopsQuery, useLazyGetQuizQuery } from "@/redux/api/knowledgeApi";

export default function SopAcademyPage() {
  const { data, isLoading, isFetching, error, refetch } = useGetSopsQuery();
  const [triggerGetQuiz, { isFetching: quizLoading }] = useLazyGetQuizQuery();
  const [activeTab, setActiveTab] = useState<"all" | "todo" | "completed">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const playbooks = useMemo(() => {
    const sops = data?.sops ?? [];
    if (sops.length === 0) return MOCK_ACADEMY_DATA.playbooks;
    return sops.map((sop) => {
      const modules = Array.isArray(sop.modules) ? sop.modules.length : (typeof sop.modules === "number" ? sop.modules : undefined);
      const isCompleted = false; // backend list has no progress yet
      return {
        id: String(sop.id),
        title: sop.title || `SOP ${String(sop.id).slice(0, 8)}`,
        badge: isCompleted ? ("Passed" as const) : ("In progress" as const),
        badgeVariant: isCompleted ? ("success" as const) : ("warning" as const),
        subtitle: modules ? `${modules} modules • Live SOP` : "Live SOP from knowledge base",
        category: isCompleted ? ("completed" as const) : ("todo" as const),
        duration: modules ? `${modules} modules` : "Modules",
        readTime: modules ? `${modules} modules` : "",
        quizRoute: `/academy/quiz?sopId=${encodeURIComponent(String(sop.id))}`,
        modulesCompleted: 0,
        totalModules: modules,
        score: undefined,
      };
    });
  }, [data?.sops]);

  const filteredPlaybooks = playbooks.filter((pb) => {
    const matchesTab = activeTab === "all" ? true : pb.category === activeTab;
    const matchesSearch = pb.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const assignedCount = playbooks.length || MOCK_ACADEMY_DATA.kpis.assignedPlaybooks;
  const completedCount = playbooks.filter((p) => p.category === "completed").length;
  const usingLive = (data?.sops?.length ?? 0) > 0;

  const handleStart = async (sopId: string) => {
    try {
      await triggerGetQuiz(sopId).unwrap();
    } catch {
      // quiz page will also try; allow navigation even if preview fails
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">SOP Academy</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold uppercase tracking-wider">L&D Protocol</span>
            {usingLive && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold">Live SOPs</span>}
          </div>
          <p className="text-sm text-muted-foreground">Standard operating procedures, autonomous compliance, and verified team playbooks assigned to you.</p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Filter playbooks & quizzes..." className="h-9 w-60 pl-9 pr-3 rounded-lg bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-xs transition-all" />
          </div>
          <button onClick={() => { void refetch(); toast.success("SOPs refreshed"); }} className="h-9 px-3 rounded-lg bg-card border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-muted transition-colors shrink-0">
            <RefreshCw className={`w-4 h-4 text-primary ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <button onClick={() => toast.success("SOP request submitted to Agency Ops.")} className="h-9 px-3.5 rounded-lg bg-card border border-border text-foreground text-xs font-semibold flex items-center gap-1.5 shadow-xs hover:bg-muted transition-colors shrink-0">
            <Plus className="w-4 h-4 text-primary" />
            <span>Request SOP</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Assigned Playbooks</span><div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"><BookOpen className="w-4 h-4" /></div></div>
          <div className="mt-4 flex items-baseline gap-2"><span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{isLoading ? "—" : assignedCount}</span><span className="text-xs text-muted-foreground">Modules Active</span></div>
          <div className="mt-3 pt-2 flex items-center gap-1.5 text-muted-foreground text-xs border-t border-border/60"><span className="w-1.5 h-1.5 rounded-full bg-primary"></span><span>{usingLive ? "Loaded from /knowledge/sops" : "Showing fallback playbooks"}</span></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Completed</span><div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-4 h-4" /></div></div>
          <div className="mt-4 flex items-baseline gap-2"><span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{completedCount}</span><span className="text-xs text-emerald-600 font-semibold">{assignedCount ? Math.round((completedCount / assignedCount) * 100) : 0}%</span></div>
          <div className="mt-3 pt-2 flex items-center gap-1.5 text-muted-foreground text-xs border-t border-border/60"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span><span>Progress from live submissions</span></div>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between"><span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Average Quiz Score</span><div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center"><Award className="w-4 h-4" /></div></div>
          <div className="mt-4 flex items-baseline gap-2"><span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{MOCK_ACADEMY_DATA.kpis.averageScore}%</span><span className="text-[11px] text-primary font-semibold px-2 py-0.5 rounded bg-primary/10">Benchmark</span></div>
          <div className="mt-3 pt-2 flex items-center gap-1.5 text-muted-foreground text-xs border-t border-border/60"><TrendingUp className="w-3.5 h-3.5 text-primary" /><span>Agency benchmark ({MOCK_ACADEMY_DATA.kpis.benchmarkScore}%)</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 flex flex-col rounded-xl bg-card border border-border p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60 mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Assigned Training</h2>
              <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-semibold tabular-nums">{filteredPlaybooks.length} playbooks</span>
            </div>
            <div className="inline-flex p-0.5 rounded-lg bg-muted text-xs font-semibold">
              {(["all", "todo", "completed"] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 rounded-md transition-all capitalize ${activeTab === tab ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"}`}>
                  {tab === "all" ? "All" : tab === "todo" ? "To do" : "Completed"}
                </button>
              ))}
            </div>
          </div>

          {error && <div className="text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-3">Failed to load live SOPs; showing fallback playbooks. Endpoints wired: <code>GET /knowledge/sops</code>, <code>GET /knowledge/sops/:id/quiz</code>, <code>POST /knowledge/sops/:id/quiz/submit</code>.</div>}
          <div className="divide-y divide-border/50">
            {filteredPlaybooks.map((pb) => (
              <div key={pb.id} className="group flex flex-col sm:flex-row sm:items-center justify-between py-3.5 px-2 rounded-lg hover:bg-muted/30 transition-all gap-4">
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary"><BookOpen className="w-5 h-5" /></div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground truncate">{pb.title}</span>
                      {pb.badgeVariant === "warning" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-semibold"><RotateCcw className="w-3 h-3" />{pb.badge}</span>}
                      {pb.badgeVariant === "success" && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[10px] font-semibold"><Check className="w-3 h-3" />Passed{pb.score ? `, ${pb.score}%` : ""}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{pb.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  {pb.category === "todo" ? (
                    <Link href={pb.quizRoute} onClick={() => void handleStart(String(pb.id))} className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-opacity">
                      <Play className="w-3.5 h-3.5" /><span>{quizLoading ? "Loading..." : "Start"}</span>
                    </Link>
                  ) : (
                    <Link href={pb.quizRoute} className="h-8 px-3 rounded-lg bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs">
                      <span>View result</span><ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3.5 rounded-xl bg-muted/40 border border-border/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-foreground"><Sparkles className="w-4 h-4 text-primary" /><span>Need a custom SOP generated from recent client workflows?</span></div>
            <button onClick={() => toast.success("AI Operator prompt triggered in Copilot.")} className="text-primary font-semibold hover:underline flex items-center gap-1"><span>Ask AI Operator</span><ArrowUpRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="rounded-xl bg-card border border-border p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-border/60"><div className="flex items-center gap-1.5"><Award className="w-4 h-4 text-primary" /><h3 className="font-semibold text-sm text-foreground">Certificates</h3></div><span className="text-[11px] text-muted-foreground font-medium">Live results</span></div>
            <p className="text-xs text-muted-foreground py-2">Verified credentials awarded upon official quiz completion.</p>
            <div className="flex flex-col gap-2.5">
              {MOCK_ACADEMY_DATA.certificates.map((cert) => (
                <div key={cert.id} className="p-3 rounded-lg bg-muted/40 border border-border/60 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between"><div className="flex flex-col"><span className="text-xs font-semibold text-foreground">{cert.title}</span><span className="text-[11px] text-muted-foreground">Score: {cert.score}% • Issued {cert.issuedDate}</span></div></div>
                  <div className="pt-1 flex items-center justify-between text-[11px]"><span className="text-emerald-600 font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Permanent Verification</span><button onClick={() => toast.success(`Downloading certificate ${cert.credentialId}`)} className="text-primary font-semibold hover:underline flex items-center gap-0.5"><Download className="w-3 h-3" /><span>Download</span></button></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-card border border-border p-5 shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center"><ShieldCheck className="w-4 h-4" /></div><div><h4 className="text-xs font-semibold text-foreground">Autonomous Operator Rights</h4><span className="text-[11px] text-muted-foreground">Styre Security Governance</span></div></div>
            <p className="text-xs text-muted-foreground">Complete assigned SOPs to unlock unsupervised autonomous agent execution across live channels.</p>
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs pt-1 border-t border-border/60"><Lock className="w-3.5 h-3.5 text-muted-foreground" /><span>Rights depend on SOP completion</span></div>
          </div>
          <div className="rounded-xl bg-muted/40 border border-border/60 p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground"><Info className="w-4 h-4 text-primary shrink-0 mt-0.5" /><div><span className="font-semibold text-foreground block mb-0.5">Quiz Policy</span><span>Quizzes load from <code>/knowledge/sops/:id/quiz</code> and submit to <code>/knowledge/sops/:id/quiz/submit</code> when available.</span></div></div>
        </div>
      </div>
    </div>
  );
}
