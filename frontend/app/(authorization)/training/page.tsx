"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { uploadTrainingDocApi, askTrainingMentorApi, listTrainingSessionsApi, TrainingSessionItem } from "@/services/trainingService";
import { useAppSelector } from "@/redux/hooks";

export default function TrainingKnowledgePage() {
  const { user } = useAppSelector((s) => s.auth);
  const isTrainee = user?.role === "TRAINEE";
  const [activeTab, setActiveTab] = useState<"SIMULATOR" | "DOCS" | "LOGS">("SIMULATOR");

  // Simulator State
  const [internQuestion, setInternQuestion] = useState("");
  const [mentorChat, setMentorChat] = useState<Array<{ role: "trainee" | "mentor"; text: string }>>([
    {
      role: "mentor",
      text: "Welcome to the Company Training & SOP Knowledge Base! I am your Senior AI Mentor. Ask me any question about our verified sales playbooks, customer dispute guidelines, or operations procedures.",
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);

  // Doc Upload State
  const [docTitle, setDocTitle] = useState("");
  const [docCategory, setDocCategory] = useState<"SOP" | "SALES_PLAYBOOK" | "CUSTOMER_FAQ" | "PRODUCT_MANUAL">("SOP");
  const [docScope, setDocScope] = useState<"INTERNAL_TRAINING" | "PUBLIC">("INTERNAL_TRAINING");
  const [docContent, setDocContent] = useState("");
  const [docUploadLoading, setDocUploadLoading] = useState(false);
  const [docStatus, setDocStatus] = useState<string | null>(null);

  // Logs State
  const [sessions, setSessions] = useState<TrainingSessionItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const handleAskMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!internQuestion.trim()) return;

    const q = internQuestion.trim();
    setInternQuestion("");
    setMentorChat((prev) => [...prev, { role: "trainee", text: q }]);
    setChatLoading(true);

    try {
      const res = await askTrainingMentorApi(q, user?.name || "Trainee");
      setMentorChat((prev) => [...prev, { role: "mentor", text: res.mentorResponse }]);
    } catch (err: any) {
      setMentorChat((prev) => [
        ...prev,
        { role: "mentor", text: `⚠️ Error contacting training engine: ${err.message}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    setDocUploadLoading(true);
    setDocStatus(null);
    try {
      await uploadTrainingDocApi({
        title: docTitle.trim(),
        content: docContent.trim(),
        category: docCategory,
        accessScope: docScope,
      });
      setDocStatus("✅ Document embedded and indexed in Vector RAG knowledge base!");
      setDocTitle("");
      setDocContent("");
    } catch (err: any) {
      setDocStatus(`❌ Upload failed: ${err.message}`);
    } finally {
      setDocUploadLoading(false);
    }
  };

  const loadLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await listTrainingSessionsApi();
      setSessions(res.sessions || []);
    } catch {
      /* ignore */
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "LOGS") loadLogs();
  }, [activeTab]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">school</span>
              <h1 className="text-xl font-bold text-on-surface">Company Training & SOP Knowledge Base</h1>
            </div>
            <p className="text-xs text-secondary mt-1">
              {isTrainee
                ? "Interactive learning environment for internal interns and junior staff grounded in company SOPs."
                : "Manage verified company SOPs and evaluate trainee comprehension scores through AI mentorship."}
            </p>
          </div>
          <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Agent #10 (Intern Mentor) Active
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-outline-variant/30 pb-3">
          <button
            onClick={() => setActiveTab("SIMULATOR")}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === "SIMULATOR" ? "bg-primary text-white shadow-xs" : "bg-surface-container-low text-secondary hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">forum</span>
            SOP Training Chat
          </button>

          {!isTrainee && (
            <>
              <button
                onClick={() => setActiveTab("DOCS")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "DOCS" ? "bg-primary text-white shadow-xs" : "bg-surface-container-low text-secondary hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">library_add</span>
                Upload Knowledge Docs
              </button>
              <button
                onClick={() => setActiveTab("LOGS")}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "LOGS" ? "bg-primary text-white shadow-xs" : "bg-surface-container-low text-secondary hover:text-on-surface"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">history_edu</span>
                Trainee Evaluations
              </button>
            </>
          )}
        </div>

        {/* Tab 1: Simulator */}
        {activeTab === "SIMULATOR" && (
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col h-[560px]">
            {/* Chat Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-4">
              {mentorChat.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "trainee" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "mentor" && (
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.role === "trainee"
                        ? "bg-primary text-white rounded-br-xs"
                        : "bg-surface-container-low text-on-surface rounded-bl-xs whitespace-pre-wrap"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex items-center gap-2 text-xs text-secondary pl-11">
                  <span className="material-symbols-outlined text-[18px] animate-spin text-primary">sync</span>
                  Senior Mentor analyzing SOP knowledge base...
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleAskMentor} className="p-3 border-t border-outline-variant/30 flex gap-2">
              <input
                type="text"
                value={internQuestion}
                onChange={(e) => setInternQuestion(e.target.value)}
                placeholder="Ask about escalation SOPs, refund limits, client qualification criteria..."
                className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface"
              />
              <button
                type="submit"
                disabled={chatLoading || !internQuestion.trim()}
                className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50 cursor-pointer flex items-center gap-1"
              >
                <span>Send</span>
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Upload Docs */}
        {activeTab === "DOCS" && !isTrainee && (
          <form onSubmit={handleUploadDoc} className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs space-y-4 max-w-2xl">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Embed Company SOP or Sales Playbook</h3>
              <p className="text-xs text-secondary mt-1">Ground both customer-facing agents and intern training mentors with authoritative documentation.</p>
            </div>
            {docStatus && (
              <div className="p-3 rounded-xl bg-surface-container-low text-xs font-semibold">
                {docStatus}
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. Standard Operating Procedure: Escalations & Disputes"
                className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Category</label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface"
                >
                  <option value="SOP">SOP (Standard Operating Procedure)</option>
                  <option value="SALES_PLAYBOOK">Sales Playbook</option>
                  <option value="CUSTOMER_FAQ">Customer FAQ</option>
                  <option value="PRODUCT_MANUAL">Product Manual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Access Scope</label>
                <select
                  value={docScope}
                  onChange={(e) => setDocScope(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none bg-surface"
                >
                  <option value="INTERNAL_TRAINING">Internal Training Only (Interns & Staff)</option>
                  <option value="PUBLIC">Public & Customer-Facing</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Document Content / Policy Text</label>
              <textarea
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                placeholder="Paste the verified company policies, workflow diagrams, step-by-step instructions..."
                className="w-full h-44 p-3 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={docUploadLoading}
              className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">{docUploadLoading ? "sync" : "cloud_upload"}</span>
              {docUploadLoading ? "Embedding..." : "Save & Embed Document"}
            </button>
          </form>
        )}

        {/* Tab 3: Evaluation Logs */}
        {activeTab === "LOGS" && !isTrainee && (
          <div className="space-y-4">
            {logsLoading ? (
              <div className="p-12 text-center text-xs text-secondary">Loading evaluation sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="bg-surface-container-lowest p-12 text-center rounded-2xl border border-outline-variant/40 text-secondary text-xs">
                No evaluation sessions logged yet. When trainees use the SOP training chat, their comprehension scores appear here.
              </div>
            ) : (
              <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-secondary border-b border-outline-variant/30">
                    <tr>
                      <th className="p-3.5 font-semibold">Trainee</th>
                      <th className="p-3.5 font-semibold">Inquiry / Question</th>
                      <th className="p-3.5 font-semibold">Score</th>
                      <th className="p-3.5 font-semibold">Mentor Feedback</th>
                      <th className="p-3.5 font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/20">
                    {sessions.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-container-low/50">
                        <td className="p-3.5 font-semibold text-on-surface">{s.intern_name}</td>
                        <td className="p-3.5 max-w-xs truncate text-secondary">{s.question}</td>
                        <td className="p-3.5 font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${s.comprehension_score >= 70 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                            {s.comprehension_score}/100
                          </span>
                        </td>
                        <td className="p-3.5 text-secondary max-w-sm truncate">{s.feedback_notes}</td>
                        <td className="p-3.5 text-secondary text-[11px] whitespace-nowrap">{new Date(s.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

