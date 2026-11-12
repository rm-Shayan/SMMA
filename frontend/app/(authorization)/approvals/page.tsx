"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { listApprovalsApi, approveActionApi, rejectActionApi, ApprovalItem } from "@/services/approvalsService";
import { useAppSelector } from "@/redux/hooks";

export default function ApprovalsPage() {
  const { user } = useAppSelector((s) => s.auth);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectModalId, setRejectModalId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listApprovalsApi();
      setApprovals(res.approvals || []);
    } catch (err: any) {
      setError(err.message || "Failed to load approval queue.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await approveActionApi(id, "Approved by manager via web console");
      await loadData();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalId) return;
    setActionLoading(rejectModalId);
    try {
      await rejectActionApi(rejectModalId, rejectReason || "Rejected by manager");
      setRejectModalId(null);
      setRejectReason("");
      await loadData();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = approvals.filter((a) => {
    if (filter === "ALL") return true;
    return a.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>Pending Review</span>;
      case "APPROVED":
      case "EXECUTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Executed</span>;
      case "REJECTED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">❌ Rejected</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/40 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]">verified_user</span>
              <h1 className="text-xl font-bold text-on-surface">Human Action Approvals</h1>
            </div>
            <p className="text-xs text-secondary mt-1">
              Review and authorize high-stakes AI tool proposals (Social Posts, Google Sheets, External ERP actions).
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>refresh</span>
            Refresh Queue
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-outline-variant/30 pb-3">
          {(["PENDING", "APPROVED", "REJECTED", "ALL"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filter === tab
                  ? "bg-primary text-white shadow-xs"
                  : "bg-surface-container-low text-secondary hover:text-on-surface hover:bg-surface-container"
              }`}
            >
              {tab === "ALL" ? "All History" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              {tab === "PENDING" && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                  {approvals.filter((a) => a.status === "PENDING").length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-4 rounded-xl bg-error-container/30 border border-error/20 text-error text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        {/* Content List */}
        {loading && approvals.length === 0 ? (
          <div className="p-12 text-center text-secondary text-xs flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
            Loading pending queue...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 text-center rounded-2xl border border-outline-variant/40 space-y-2">
            <span className="material-symbols-outlined text-emerald-500 text-[48px]">task_alt</span>
            <h3 className="text-sm font-bold text-on-surface">Queue is All Clear!</h3>
            <p className="text-xs text-secondary max-w-sm mx-auto">
              No actions currently matching filter "{filter}". High-priority agent operations will appear here for human authorization.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 hover:border-outline-variant transition-all shadow-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-primary uppercase px-2 py-0.5 rounded bg-primary-fixed/20 border border-primary-fixed/40">
                      {item.tool_name}
                    </span>
                    <span className="text-xs text-secondary">• Proposing Role: <strong className="text-on-surface">{item.actor_role}</strong></span>
                  </div>
                  <div>{getStatusBadge(item.status)}</div>
                </div>

                <div className="bg-surface-container-low/50 p-3 rounded-xl text-xs font-mono overflow-x-auto max-h-40">
                  <div className="text-[10px] text-secondary font-sans font-semibold uppercase mb-1">Proposed Parameters:</div>
                  <pre className="text-on-surface whitespace-pre-wrap">{JSON.stringify(item.proposed_params, null, 2)}</pre>
                </div>

                {item.decision_reason && (
                  <div className="text-xs text-secondary italic">
                    Reason / Note: {item.decision_reason}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 text-xs text-secondary">
                  <span>Created: {new Date(item.created_at).toLocaleString()}</span>

                  {item.status === "PENDING" && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleApprove(item.id)}
                        disabled={actionLoading === item.id}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        {actionLoading === item.id ? "Approving..." : "Approve & Execute"}
                      </button>
                      <button
                        onClick={() => setRejectModalId(item.id)}
                        disabled={actionLoading === item.id}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Reject Reason Modal */}
        {rejectModalId && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-surface-container-lowest max-w-md w-full p-6 rounded-2xl border border-outline-variant/40 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-on-surface">Reject Action Proposal</h3>
              <p className="text-xs text-secondary">Please enter a brief reason for rejecting this AI operation.</p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Budget outside bounds, unauthorized campaign date..."
                className="w-full p-3 text-xs rounded-xl border border-outline-variant focus:border-primary outline-none h-24"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => { setRejectModalId(null); setRejectReason(""); }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-surface-container text-secondary hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === rejectModalId}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

