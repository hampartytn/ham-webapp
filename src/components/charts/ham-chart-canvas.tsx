"use client";

import {
  Chart,
  type ChartData,
  type ChartOptions,
  type ChartType,
} from "chart.js";
import { useEffect, useRef } from "react";

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

export function HamChartCanvas<TType extends ChartType>({
  type,
  data,
  options,
  ariaLabel,
  className,
}: HamChartCanvasProps<TType>) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<TType> | null>(null);
  const dataRef = useRef(data);
  const optionsRef = useRef(options);
  const skipNextUpdate = useRef(true);
  dataRef.current = data;
  optionsRef.current = options;
  const signature = dataSignature(data);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    registerHamCharts();
    applyHamChartDefaults();
    skipNextUpdate.current = true;

    const chart = new Chart(canvas, {
      type,
      data: dataRef.current,
      options: optionsRef.current,
    });
    if (prefersReducedMotion() && chart.options) {
      chart.options.animation = false;
    }
    chartRef.current = chart;

    return () => {
      chart.destroy();
      chartRef.current = null;
    };
  }, [type]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    if (skipNextUpdate.current) {
      skipNextUpdate.current = false;
      return;
    }
    chart.data = dataRef.current;
    chart.update();
  }, [signature]);

  return (
    <div className={cn("relative h-full w-full", className)}>
      <canvas ref={canvasRef} role="img" aria-label={ariaLabel} />
    </div>
  );
}
