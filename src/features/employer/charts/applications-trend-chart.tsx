"use client";

import type { ChartData, ChartOptions } from "chart.js";
import { useMemo, type ReactNode } from "react";

import { ChartFrame } from "@/components/charts/chart-frame";
import { HamChartCanvas } from "@/components/charts/ham-chart-canvas";
import type { ApplicationTrendBucket } from "@/features/employer/dashboard-utils";
import { HAM_CHART } from "@/lib/charts/ham-chart-theme";

export function ApplicationsTrendChart({
  title,
  summary,
  note,
  emptyMessage,
  errorMessage,
  retryLabel,
  seriesApplications,
  seriesShortlisted,
  seriesHired,
  buckets,
  loading,
  error,
  onRetry,
  headerRight,
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
  buckets: ApplicationTrendBucket[];
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  headerRight?: ReactNode;
}) {
  const hasValues = buckets.some(
    (b) => b.applications > 0 || b.shortlisted > 0 || b.hired > 0,
  );
  const dense = buckets.length > 12;

  const data = useMemo<ChartData<"line">>(
    () => ({
      labels: buckets.map((b) => b.label),
      datasets: [
        {
          label: seriesApplications,
          data: buckets.map((b) => b.applications),
          borderColor: HAM_CHART.primary,
          backgroundColor: HAM_CHART.primaryFill,
          fill: true,
          tension: 0.25,
          cubicInterpolationMode: "monotone",
          borderWidth: 2,
          pointRadius: dense ? 0 : 2,
          pointHoverRadius: 4,
          pointBackgroundColor: HAM_CHART.primary,
          pointBorderColor: HAM_CHART.surface,
          pointBorderWidth: 1,
        },
        {
          label: seriesShortlisted,
          data: buckets.map((b) => b.shortlisted),
          borderColor: HAM_CHART.warning,
          backgroundColor: HAM_CHART.warning,
          fill: false,
          tension: 0.25,
          cubicInterpolationMode: "monotone",
          borderWidth: 2,
          pointRadius: dense ? 0 : 2,
          pointHoverRadius: 4,
          pointBackgroundColor: HAM_CHART.warning,
          pointBorderColor: HAM_CHART.surface,
          pointBorderWidth: 1,
        },
        {
          label: seriesHired,
          data: buckets.map((b) => b.hired),
          borderColor: HAM_CHART.success,
          backgroundColor: HAM_CHART.success,
          fill: false,
          tension: 0.25,
          cubicInterpolationMode: "monotone",
          borderWidth: 2,
          pointRadius: dense ? 0 : 2,
          pointHoverRadius: 4,
          pointBackgroundColor: HAM_CHART.success,
          pointBorderColor: HAM_CHART.surface,
          pointBorderWidth: 1,
        },
      ],
    }),
    [buckets, dense, seriesApplications, seriesHired, seriesShortlisted],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: HAM_CHART.muted },
        },
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label(ctx) {
              const label = ctx.dataset.label ?? "";
              const value = ctx.parsed.y ?? 0;
              return `${label}: ${value}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: dense ? 8 : 12,
            color: HAM_CHART.muted,
          },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            maxTicksLimit: 5,
            color: HAM_CHART.muted,
          },
          grid: { color: HAM_CHART.grid },
          border: { display: false },
        },
      },
    }),
    [dense],
  );

  return (
    <ChartFrame
      title={title}
      summary={summary}
      note={note}
      loading={loading}
      error={error}
      empty={!loading && !error && !hasValues}
      emptyMessage={emptyMessage}
      errorMessage={errorMessage}
      onRetry={onRetry}
      retryLabel={retryLabel}
      heightClassName="h-64"
      headerRight={headerRight}
    >
      <HamChartCanvas
        type="line"
        data={data}
        options={options}
        ariaLabel={title}
      />
    </ChartFrame>
  );
}
