"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { useApiHealth } from "@/hooks/useApiHealth";

export interface DemoDataBadgeProps {
  /**
   * Force the badge on/off. When omitted the badge follows the global API
   * health tracker: it appears automatically when the backend is unreachable
   * and the screen fell back to mock data.
   */
  isDemo?: boolean;
  /** Overrides the default label. */
  label?: string;
  className?: string;
}

/**
 * Subtle indicator that the data on screen is mock/demo data because the
 * backend could not be reached.
 */
export function DemoDataBadge({
  isDemo,
  label = "Demo Data (Backend Offline)",
  className = "",
}: DemoDataBadgeProps) {
  const health = useApiHealth();
  const show = isDemo ?? health.status === "offline";

  if (!show) return null;

  return (
    <span
      data-testid="demo-data-badge"
      title={health.lastErrorMessage ?? "Live data is unavailable — showing mock records."}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-label-xs text-label-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 select-none ${className}`}
    >
      <AlertCircle size={12} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

export default DemoDataBadge;
