"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Check,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { MOCK_ACADEMY_DATA } from "@/mocks/academyData";
import { useGetQuizQuery, useSubmitQuizMutation } from "@/redux/api/knowledgeApi";

type UiQuestion = {
  id: string;
  type: string;
  scenarioTitle: string;
  question: string;
  options: { id: string; text: string; explanation?: string; recommended?: boolean }[];
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeQuestions(payload: unknown): UiQuestion[] {
  const p = asRecord(payload);
  const quiz = asRecord(p?.quiz);
  const data = asRecord(p?.data);
  const raw: unknown[] =
    (Array.isArray(p?.questions) ? p.questions : null) ||
    (Array.isArray(quiz?.questions) ? quiz.questions : null) ||
    (Array.isArray(p?.quiz) ? p.quiz : null) ||
    (Array.isArray(data?.questions) ? data.questions : null) ||
    [];
  if (!raw.length) return [];
  return raw.map((q, i) => {
    const qr = asRecord(q);
    const optsRaw = Array.isArray(qr?.options) ? qr.options : [];
    const options = optsRaw.map((o, j) => {
      if (typeof o === "string") return { id: String(j), text: o };
      const or = asRecord(o);
      return {
        id: String(or?.id ?? j),
        text: String(or?.text ?? or?.label ?? or?.value ?? ""),
        explanation: typeof or?.explanation === "string" ? or.explanation : undefined,
        recommended: typeof or?.recommended === "boolean" ? or.recommended : undefined,
      };
    });
    return {
      id: String(qr?.id ?? qr?.moduleNo ?? i),
      type: typeof qr?.type === "string" ? qr.type : "Quiz question",
      scenarioTitle:
        typeof qr?.scenarioTitle === "string"
          ? qr.scenarioTitle
          : typeof qr?.title === "string"
            ? qr.title
            : typeof qr?.moduleTitle === "string"
              ? qr.moduleTitle
              : `Question ${i + 1}`,
      question: String(qr?.question ?? qr?.prompt ?? qr?.text ?? "Question"),
      options,
    };
  });
}

function QuizRunnerInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sopId = searchParams.get("sopId") || "";
  const { data, isLoading, error } = useGetQuizQuery(sopId, { skip: !sopId });
  const [submitQuiz, { isLoading: submitting }] = useSubmitQuizMutation();

  const fallbackQuestions = useMemo(
    () =>
      MOCK_ACADEMY_DATA.quizQuestions.map((q) => ({
        id: String(q.id),
        type: q.type,
        scenarioTitle: q.scenarioTitle,
        question: q.question,
        options: q.options.map((o) => ({
          id: o.id,
          text: o.text,
          explanation: "explanation" in o ? o.explanation : undefined,
          recommended: "recommended" in o ? o.recommended : undefined,
        })),
      })),
    []
  );

  const questions = useMemo(() => {
    const live = normalizeQuestions(data);
    return live.length ? live : fallbackQuestions;
  }, [data, fallbackQuestions]);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [prevKey, setPrevKey] = useState(`${sopId}|${questions.length}`);

  if (`${sopId}|${questions.length}` !== prevKey) {
    setPrevKey(`${sopId}|${questions.length}`);
    setCurrentIdx(0);
    setSelectedAnswers({});
  }

  const activeQuestion = questions[currentIdx] || questions[0];
  const selectedOptionId = selectedAnswers[activeQuestion?.id || ""];
  const progressPercent = Math.round(((currentIdx + 1) / Math.max(questions.length, 1)) * 100);

  const handleSelectOption = (optionId: string) => {
    if (!activeQuestion) return;
    setSelectedAnswers((prev) => ({ ...prev, [activeQuestion.id]: optionId }));
  };

  const handleNext = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      return;
    }
    if (!sopId) {
      toast.success("Submitting certification quiz...");
      router.push("/academy/quiz/result");
      return;
    }
    try {
      const answers = Object.entries(selectedAnswers).map(([questionId, optionId]) => ({ questionId, optionId }));
      const res = await submitQuiz({ sopId, answers }).unwrap();
      const result =
        res.result && typeof res.result === "object" && !Array.isArray(res.result)
          ? (res.result as Record<string, unknown>)
          : null;
      const score =
        typeof res.score === "number"
          ? res.score
          : typeof result?.score === "number"
            ? (result.score as number)
            : undefined;
      const passed =
        typeof res.passed === "boolean"
          ? res.passed
          : typeof result?.passed === "boolean"
            ? (result.passed as boolean)
            : undefined;
      toast.success("Quiz submitted");
      const params = new URLSearchParams({ sopId });
      if (typeof score === "number") params.set("score", String(score));
      if (typeof passed === "boolean") params.set("passed", passed ? "1" : "0");
      router.push(`/academy/quiz/result?${params.toString()}`);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "data" in e
          ? String((e as { data?: { message?: unknown } }).data?.message || "Failed to submit quiz")
          : "Failed to submit quiz";
      toast.error(msg);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) setCurrentIdx((prev) => prev - 1);
  };

  if (!activeQuestion) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased">
      <header className="bg-card border-b border-border sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/academy" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group py-1.5 px-2.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to SOP Academy</span>
          </Link>

          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wide">Certification Quiz</span>
              <h1 className="text-sm font-semibold text-foreground">{sopId ? `SOP ${sopId.slice(0, 8)}` : "Agency Cold Outreach Playbook v2"}</h1>
            </div>
            <p className="text-[11px] text-muted-foreground">{sopId ? "Live quiz via /knowledge/sops/:id/quiz" : "Module 3 Evaluation • Passing score 80%"}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground font-medium px-2 py-0.5 bg-muted rounded"><Check className="w-3.5 h-3.5 text-emerald-500" /><span>Auto-saved</span></div>
            <Link href="/academy" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground bg-card border border-border rounded-lg hover:bg-muted shadow-xs transition-colors">
              <LogOut className="w-3.5 h-3.5" /><span>Save & exit</span>
            </Link>
          </div>
        </div>

        <div className="bg-muted/40 border-t border-border/60">
          <div className="max-w-3xl mx-auto px-6 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Question {currentIdx + 1} of {questions.length}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{activeQuestion.scenarioTitle}</span>
            </div>
            <span className="font-semibold text-primary">{progressPercent}% Completed</span>
          </div>
          <div className="w-full bg-muted h-1 relative overflow-hidden"><div className="bg-primary h-1 transition-all duration-300" style={{ width: `${progressPercent}%` }}></div></div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 md:py-12">
        {error && sopId && <div className="w-full max-w-[720px] mb-3 text-xs text-amber-700 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">Failed to load live quiz from <code>GET /knowledge/sops/{sopId}/quiz</code>. Showing fallback questions.</div>}
        {isLoading && sopId && <div className="w-full max-w-[720px] mb-3 text-xs text-muted-foreground">Loading quiz...</div>}
        <div className="w-full max-w-[720px] bg-card rounded-2xl border border-border shadow-md overflow-hidden transition-all p-6 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary border border-primary/20"><HelpCircle className="w-3.5 h-3.5" /><span>{activeQuestion.type}</span></div>
            <span className="text-xs font-medium text-muted-foreground">Single Choice</span>
          </div>

          <h2 className="text-lg md:text-xl font-bold text-foreground leading-snug tracking-tight mb-6">{activeQuestion.question}</h2>

          <div className="space-y-3" role="radiogroup">
            {activeQuestion.options.map((opt) => {
              const isSelected = selectedOptionId === opt.id;
              return (
                <div key={opt.id} onClick={() => handleSelectOption(opt.id)} className={`group flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary shadow-xs" : "border-border bg-card hover:border-border/80 hover:bg-muted/40"}`}>
                  <div className="flex items-center justify-center mt-0.5"><div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/40 group-hover:border-foreground"}`}>{isSelected && <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>}</div></div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm leading-relaxed ${isSelected ? "font-semibold text-foreground" : "font-normal text-foreground"}`}>{opt.text}</span>
                    {opt.explanation && isSelected && <p className="text-xs text-muted-foreground mt-1.5 leading-normal">{opt.explanation}</p>}
                  </div>
                </div>
              );
            })}
            {activeQuestion.options.length === 0 && <div className="text-xs text-muted-foreground">No options returned by quiz endpoint.</div>}
          </div>

          <div className="mt-8 pt-5 border-t border-border/60 flex items-center justify-between gap-4">
            <button type="button" disabled={currentIdx === 0} onClick={handlePrevious} className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-muted transition-colors disabled:opacity-40">
              <ChevronLeft className="w-4 h-4" /><span>Previous</span>
            </button>
            <button type="button" onClick={() => void handleNext()} disabled={submitting} className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-xl shadow-xs transition-all disabled:opacity-50">
              <span>{submitting ? "Submitting..." : currentIdx === questions.length - 1 ? "Finish & Submit" : "Next"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <div className="flex items-center gap-2 p-2 bg-card/80 backdrop-blur-xs rounded-full border border-border px-4 py-2 shadow-xs">
            {questions.map((q, idx) => {
              const isAnswered = selectedAnswers[q.id] !== undefined && idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div key={q.id} className="flex items-center gap-2">
                  <div onClick={() => setCurrentIdx(idx)} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer transition-all ${isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-sm" : isAnswered ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground border border-border"}`}>
                    {isAnswered ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
                  </div>
                  {idx < questions.length - 1 && <div className={`w-3 h-0.5 rounded-full ${isAnswered ? "bg-emerald-400" : "bg-border"}`}></div>}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function QuizRunnerPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading quiz...</div>}>
      <QuizRunnerInner />
    </Suspense>
  );
}
