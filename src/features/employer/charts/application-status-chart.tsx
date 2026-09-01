"use client";

import type { ChartData, ChartOptions } from "chart.js";
import { useMemo } from "react";

import { ChartSkeleton } from "@/components/charts/chart-frame";
import { HamChartCanvas } from "@/components/charts/ham-chart-canvas";
import { APP_STATUS_COLORS } from "@/lib/charts/ham-chart-theme";

const STATUS_ORDER = [
  "SUBMITTED",
  "VIEWED",
  "SHORTLISTED",
  "HIRED",
  "REJECTED",
  "WITHDRAWN",
] as const;

type AppStatusKey = (typeof STATUS_ORDER)[number];

export function ApplicationStatusChart({
  title,
  emptyMessage,
  errorMessage,
  retryLabel,
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
  counts: Record<string, number>;
  labels: Record<AppStatusKey, string>;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  summary: string;
}) {
  const slices = STATUS_ORDER.filter((key) => (counts[key] ?? 0) > 0).map(
    (key) => ({
      key,
      label: labels[key],
      value: counts[key] ?? 0,
      color: APP_STATUS_COLORS[key] ?? "#94a3b8",
    }),
  );
  const total = slices.reduce((sum, s) => sum + s.value, 0);

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
      cutout: "62%",
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
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <p className="sr-only">{summary}</p>
      <div className="relative mx-auto h-40 w-full max-w-[13rem]">
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
          <HamChartCanvas
            type="doughnut"
            data={data}
            options={options}
            ariaLabel={summary}
          />
        )}
      </div>
      {total > 0 && !loading && !error ? (
        <ul className="mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[0.72rem] text-[var(--emp-muted)]">
          {slices.map((s) => (
            <li key={s.key} className="inline-flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: s.color }}
                aria-hidden
              />
              {s.label} ({s.value})
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
