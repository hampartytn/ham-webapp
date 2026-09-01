"use client";

import type { ChartData, ChartOptions } from "chart.js";
import { useMemo } from "react";

import { ChartSkeleton } from "@/components/charts/chart-frame";
import { HamChartCanvas } from "@/components/charts/ham-chart-canvas";
import { JOB_STATUS_COLORS } from "@/lib/charts/ham-chart-theme";

type JobStatusKey = "PUBLISHED" | "DRAFT" | "UNPUBLISHED" | "CLOSED";

const STATUS_ORDER: JobStatusKey[] = [
  "PUBLISHED",
  "DRAFT",
  "UNPUBLISHED",
  "CLOSED",
];

export function JobStatusChart({
  title,
  emptyMessage,
  errorMessage,
  retryLabel,
  activeLabel,
  counts,
  labels,
  loading,
  error,
  onRetry,
  summary,
}: {
  title: string;
  emptyMessage: string;
  errorMessage: string;
  retryLabel: string;
  activeLabel: string;
  counts: Record<JobStatusKey, number>;
  labels: Record<JobStatusKey, string>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  summary: string;
}) {
  const total =
    counts.PUBLISHED + counts.DRAFT + counts.UNPUBLISHED + counts.CLOSED;
  const slices = STATUS_ORDER.filter((key) => counts[key] > 0).map((key) => ({
    key,
    label: labels[key],
    value: counts[key],
    color: JOB_STATUS_COLORS[key] ?? "#94a3b8",
  }));
  const activePct =
    total > 0 ? Math.round((counts.PUBLISHED / total) * 100) : 0;

  const data = useMemo<ChartData<"doughnut">>(
    () => ({
      labels: slices.map((s) => s.label),
      datasets: [
        {
          data: slices.map((s) => s.value),
          backgroundColor: slices.map((s) => s.color),
          borderColor: "#ffffff",
          borderWidth: 2,
          hoverOffset: 4,
          spacing: slices.length > 1 ? 2 : 0,
        },
      ],
    }),
    [slices],
  );

  const options = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const label = ctx.label ?? "";
              const value = typeof ctx.parsed === "number" ? ctx.parsed : 0;
              return `${label}: ${value}`;
            },
          },
        },
      },
    }),
    [],
  );

  return (
    <section className="ham-employer__card flex h-full flex-col p-6">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <p className="sr-only">{summary}</p>
      <div className="relative mx-auto h-44 w-full max-w-[14rem]">
        {loading ? (
          <ChartSkeleton />
        ) : error ? (
          <div
            className="flex h-full flex-col items-center justify-center gap-3 text-center"
            role="alert"
          >
            <p className="text-sm text-[var(--emp-muted)]">{errorMessage}</p>
            {onRetry ? (
              <button
                type="button"
                className="ham-employer__btn ham-employer__btn--secondary"
                onClick={onRetry}
              >
                {retryLabel}
              </button>
            ) : null}
          </div>
        ) : total === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-[var(--emp-muted)]">{emptyMessage}</p>
          </div>
        ) : (
          <>
            <HamChartCanvas
              type="doughnut"
              data={data}
              options={options}
              ariaLabel={summary}
            />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-extrabold tracking-tight">{activePct}%</p>
              <p className="text-[0.62rem] font-semibold tracking-[0.12em] text-[var(--emp-muted)] uppercase">
                {activeLabel}
              </p>
            </div>
          </>
        )}
      </div>
      {total > 0 && !loading && !error ? (
        <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[0.72rem] text-[var(--emp-muted)]">
          {STATUS_ORDER.map((key) => (
            <li key={key} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: JOB_STATUS_COLORS[key] }}
                aria-hidden
              />
              {labels[key]} ({counts[key]})
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
