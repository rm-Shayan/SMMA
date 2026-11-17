"use client";

import React from "react";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { PageSkeleton } from "./PageSkeleton";

export interface AsyncBoundaryProps {
  /** Show the skeleton while the request is in flight. */
  isLoading: boolean;
  /** Show the retryable error state. */
  isError?: boolean;
  /** The thrown error — used to extract a human readable message. */
  error?: unknown;
  /** Show the empty state once the request succeeded without records. */
  isEmpty?: boolean;
  /** Retry handler rendered inside the error state. */
  onRetry?: () => void;
  /** Custom skeleton; defaults to the shared `<PageSkeleton />`. */
  skeleton?: React.ReactNode;
  /** Custom empty state; defaults to the shared `<EmptyState />`. */
  empty?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  children: React.ReactNode;
}

/** Extracts the most useful message from an unknown error value. */
export function resolveErrorMessage(error: unknown): string {
  if (!error) return "Failed to load data.";

  if (typeof error === "string") return error;

  if (typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      detail?: unknown;
      data?: { detail?: unknown; message?: unknown };
      details?: { detail?: unknown; message?: unknown };
    };

    const nested =
      candidate.data?.detail ??
      candidate.data?.message ??
      candidate.details?.detail ??
      candidate.details?.message;

    if (typeof nested === "string" && nested.trim()) return nested;
    if (typeof candidate.detail === "string" && candidate.detail.trim()) {
      return candidate.detail;
    }
    if (typeof candidate.message === "string" && candidate.message.trim()) {
      return candidate.message;
    }
  }

  return "Failed to load data.";
}

/**
 * Unifies the four states of an async screen — loading, error, empty and
 * ready — behind a single wrapper so every page renders them consistently.
 */
export function AsyncBoundary({
  isLoading,
  isError = false,
  error,
  isEmpty = false,
  onRetry,
  skeleton,
  empty,
  emptyTitle = "No data found",
  emptyDescription = "There are no records matching your request or filter.",
  children,
}: AsyncBoundaryProps) {
  if (isLoading) {
    return <>{skeleton ?? <PageSkeleton />}</>;
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load this data"
        message={resolveErrorMessage(error)}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      <>
        {empty ?? (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </>
    );
  }

  return <>{children}</>;
}

export default AsyncBoundary;
