"use client";

import { useEffect } from "react";
import AppShell from "@/components/AppShell";
import DashboardErrorState from "@/components/dashboard/DashboardErrorState";
import { ApiError } from "@/services/api";

interface DashboardErrorProps {
  error: unknown;
  /** Next.js 16 recovery callback: re-fetches and re-renders the segment. */
  retry: () => void;
}

export default function DashboardError({ error, retry }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard segment failed to render", error);
  }, [error]);

  const apiError =
    error instanceof ApiError
      ? error
      : new ApiError(
          0,
          error instanceof Error ? error.message : "The dashboard failed to render.",
        );

  return (
    <AppShell>
      <DashboardErrorState error={apiError} onRetry={retry} />
    </AppShell>
  );
}
