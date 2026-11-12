"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/services/api";

interface DashboardErrorStateProps {
  error: ApiError;
  onRetry: () => void;
}

const STATUS_LABEL: Record<number, string> = {
  0: "Network error",
  400: "Bad request",
  403: "Forbidden",
  404: "Not found",
  429: "Rate limited",
  500: "Server error",
  502: "Bad gateway",
  503: "Service unavailable",
};

export default function DashboardErrorState({ error, onRetry }: DashboardErrorStateProps) {
  const [remaining, setRemaining] = useState(error.retryAfterSeconds ?? 0);

  useEffect(() => {
    setRemaining(error.retryAfterSeconds ?? 0);
  }, [error]);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const label =
    error.status === 0 ? STATUS_LABEL[0] : STATUS_LABEL[error.status] ?? `HTTP ${error.status}`;

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-xs p-8 md:p-10 max-w-xl mx-auto my-12 overflow-hidden border-t-4 border-error border-x border-b border-outline-variant/40">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-error-container text-error flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[28px]">error</span>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">
              Unable to retrieve tenant metrics
            </h2>
            <span className="font-label-sm text-label-sm font-semibold uppercase px-2 py-0.5 rounded bg-error-container text-on-error-container">
              {label}
            </span>
          </div>
          <p className="mt-2 font-body-md text-body-md text-secondary">{error.message}</p>
          {remaining > 0 && (
            <p className="mt-2 font-label-sm text-label-sm text-secondary">
              Rate limited — retry available in {remaining}s.
            </p>
          )}
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onRetry}
              disabled={remaining > 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-error text-on-error font-label-md text-label-md hover:bg-on-error-container transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
