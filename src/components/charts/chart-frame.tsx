"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("ham-employer__skel h-full w-full rounded-lg", className)}
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading</span>
    </div>
  );
}

export function ChartFrame({
  title,
  summary,
  note,
  loading,
  error,
  empty,
  emptyMessage,
  errorMessage,
  onRetry,
  retryLabel,
  heightClassName = "h-64",
  children,
  headerRight,
}: {
  title: string;
  summary?: string;
  note?: string;
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyMessage: string;
  errorMessage?: string;
  onRetry?: () => void;
  retryLabel?: string;
  heightClassName?: string;
  children: ReactNode;
  headerRight?: ReactNode;
}) {
  return (
    <section className="ham-employer__card flex flex-col p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {summary ? (
            <p className="mt-1 text-sm text-[var(--emp-muted)]">{summary}</p>
          ) : null}
        </div>
        {headerRight}
      </div>
      <div className={cn("relative w-full", heightClassName)}>
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center" role="alert">
            <p className="text-sm text-[var(--emp-muted)]">
              {errorMessage ?? emptyMessage}
            </p>
            {onRetry ? (
              <button
                type="button"
                className="ham-employer__btn ham-employer__btn--secondary"
                onClick={onRetry}
              >
                {retryLabel ?? "Retry"}
              </button>
            ) : null}
          </div>
        ) : empty ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-[var(--emp-muted)]">{emptyMessage}</p>
          </div>
        ) : (
          children
        )}
      </div>
      {note && !loading && !error && !empty ? (
        <p className="mt-3 text-[11px] text-[var(--emp-muted)]">{note}</p>
      ) : null}
    </section>
  );
}
