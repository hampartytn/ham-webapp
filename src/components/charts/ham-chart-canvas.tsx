"use client";

import {
  Chart,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from "chart.js";
import { useLayoutEffect, useRef } from "react";

import {
  applyHamChartDefaults,
  registerHamCharts,
} from "@/lib/charts/register-ham-charts";
import { cn } from "@/lib/utils";

type HamChartCanvasProps<TType extends ChartType> = {
  type: TType;
  data: ChartData<TType>;
  options?: ChartOptions<TType>;
  ariaLabel: string;
  className?: string;
};

type ChartHandle = {
  canvas: HTMLCanvasElement | null;
  data: ChartData;
  options: ChartOptions | undefined;
  stop: () => void;
  destroy: () => void;
  update: (mode?: string) => void;
};

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function dataSignature<TType extends ChartType>(data: ChartData<TType>) {
  return JSON.stringify({
    labels: data.labels,
    datasets: data.datasets.map((dataset) => ({
      label: dataset.label,
      values: dataset.data,
    })),
  });
}

function canvasStillLive(canvas: HTMLCanvasElement | null | undefined) {
  return Boolean(canvas?.isConnected && canvas.ownerDocument?.defaultView);
}

function teardownChart(chart: ChartHandle | null) {
  if (!chart) return;
  try {
    if (chart.options) {
      chart.options.animation = false;
    }
    chart.stop();
    chart.destroy();
  } catch {
    /* Chart.js animator / resize can outlive the canvas on route change */
  }
}

export function HamChartCanvas<TType extends ChartType>({
  type,
  data,
  options,
  ariaLabel,
  className,
}: HamChartCanvasProps<TType>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartHandle | null>(null);
  const dataRef = useRef(data);
  const optionsRef = useRef(options);
  const aliveRef = useRef(false);
  const skipNextUpdate = useRef(true);
  dataRef.current = data;
  optionsRef.current = options;
  const signature = dataSignature(data);

  // Layout effect so destroy runs while the canvas is still in the document.
  // useEffect cleanup is too late: Chart.js already saw detach and tried to
  // resize a null canvas (`ownerDocument`) / tick a dead animator (`_fn`).
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvasStillLive(canvas) || !canvas) return;

    registerHamCharts();
    applyHamChartDefaults();
    skipNextUpdate.current = true;
    aliveRef.current = true;

    const chart = new Chart(canvas, {
      type,
      data: dataRef.current,
      options: optionsRef.current,
    });
    if (prefersReducedMotion() && chart.options) {
      chart.options.animation = false;
    }
    chartRef.current = chart as unknown as ChartHandle;

    return () => {
      aliveRef.current = false;
      chartRef.current = null;
      teardownChart(chart as unknown as ChartHandle);
    };
  }, [type]);

  useLayoutEffect(() => {
    if (!aliveRef.current) return;
    const chart = chartRef.current;
    if (!chart || !canvasStillLive(chart.canvas)) return;
    if (skipNextUpdate.current) {
      skipNextUpdate.current = false;
      return;
    }
    try {
      chart.data = dataRef.current;
      // Background cache refresh must not animate — also avoids Chart.js
      // animator callbacks after the canvas has been unmounted.
      chart.update("none");
    } catch {
      /* unmounted mid-update */
    }
  }, [signature]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
    </div>
  );
}
