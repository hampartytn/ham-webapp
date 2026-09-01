"use client";

import type { ChartData, ChartOptions } from "chart.js";
import { useMemo } from "react";

import { ChartFrame } from "@/components/charts/chart-frame";
import { HamChartCanvas } from "@/components/charts/ham-chart-canvas";
import type { JobPerformanceRow } from "@/features/employer/dashboard-utils";
import { HAM_CHART } from "@/lib/charts/ham-chart-theme";

function shortTitle(title: string, max = 32) {
  const trimmed = title.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function JobPerformanceChart({
  title,
  summary,
  note,
  emptyMessage,
  errorMessage,
  retryLabel,
  seriesApplications,
  seriesShortlisted,
  seriesHired,
  rows,
  loading,
  error,
  onRetry,
}: {
  title: string;
  summary?: string;
  note?: string;
  emptyMessage: string;
  errorMessage: string;
  retryLabel: string;
  seriesApplications: string;
  seriesShortlisted: string;
  seriesHired: string;
  rows: JobPerformanceRow[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  const hasValues = rows.some(
    (r) => r.applications > 0 || r.shortlisted > 0 || r.hired > 0,
  );
  const heightClassName =
    rows.length > 4 ? "h-72" : rows.length > 2 ? "h-60" : "h-52";

  const data = useMemo<ChartData<"bar">>(
    () => ({
      labels: rows.map((r) => shortTitle(r.title)),
      datasets: [
        {
          label: seriesApplications,
          data: rows.map((r) => r.applications),
          backgroundColor: HAM_CHART.primary,
          borderRadius: 4,
          maxBarThickness: 16,
        },
        {
          label: seriesShortlisted,
          data: rows.map((r) => r.shortlisted),
          backgroundColor: HAM_CHART.warning,
          borderRadius: 4,
          maxBarThickness: 16,
        },
        {
          label: seriesHired,
          data: rows.map((r) => r.hired),
          backgroundColor: HAM_CHART.success,
          borderRadius: 4,
          maxBarThickness: 16,
        },
      ],
    }),
    [rows, seriesApplications, seriesHired, seriesShortlisted],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: HAM_CHART.muted },
        },
        tooltip: {
          callbacks: {
            title(items) {
              const index = items[0]?.dataIndex ?? 0;
              return rows[index]?.title ?? "";
            },
            label(ctx) {
              const label = ctx.dataset.label ?? "";
              const value = ctx.parsed.x ?? 0;
              return `${label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { precision: 0, maxTicksLimit: 6, color: HAM_CHART.muted },
          grid: { color: HAM_CHART.grid },
          border: { display: false },
        },
        y: {
          ticks: { color: HAM_CHART.ink, autoSkip: false },
          grid: { display: false },
          border: { display: false },
        },
      },
    }),
    [rows],
  );

  return (
    <ChartFrame
      title={title}
      summary={summary}
      note={note}
      loading={loading}
      error={error}
      empty={!loading && !error && (!rows.length || !hasValues)}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      onRetry={onRetry}
      retryLabel={retryLabel}
      heightClassName={heightClassName}
    >
      <HamChartCanvas
        type="bar"
        data={data}
        options={options}
        ariaLabel={title}
      />
    </ChartFrame>
  );
}
