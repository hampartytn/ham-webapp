import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

import { HAM_CHART, HAM_CHART_FONT } from "@/lib/charts/ham-chart-theme";

let registered = false;
let defaultsApplied = false;

/** Tree-shakeable Chart.js registration — only the types HAM uses. */
export function registerHamCharts() {
  if (registered) return;
  Chart.register(
    LineController,
    LineElement,
    PointElement,
    BarController,
    BarElement,
    DoughnutController,
    ArcElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler,
  );
  registered = true;
}

export function applyHamChartDefaults() {
  // Always pin this: a delayed resize after React unmounts the canvas is what
  // threw `Cannot read properties of null (ownerDocument)`.
  Chart.defaults.resizeDelay = 0;
  if (defaultsApplied) return;
  Chart.defaults.font.family = HAM_CHART_FONT;
  Chart.defaults.font.size = 12;
  Chart.defaults.color = HAM_CHART.muted;
  Chart.defaults.borderColor = HAM_CHART.grid;
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.animation = {
    duration: 280,
    easing: "easeOutQuart",
  };
  Chart.defaults.plugins.legend.labels.boxWidth = 10;
  Chart.defaults.plugins.legend.labels.boxHeight = 10;
  Chart.defaults.plugins.legend.labels.padding = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.tooltip.backgroundColor = HAM_CHART.tooltipBg;
  Chart.defaults.plugins.tooltip.titleColor = "#ffffff";
  Chart.defaults.plugins.tooltip.bodyColor = "#ffffff";
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.plugins.tooltip.displayColors = true;
  defaultsApplied = true;
}
