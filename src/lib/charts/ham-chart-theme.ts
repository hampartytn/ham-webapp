/** HAM employer chart palette — matches `src/styles/employer.css` tokens. */

export const HAM_CHART = {
  primary: "#be1b0f",
  primaryDark: "#9a160c",
  primaryFill: "rgba(190, 27, 15, 0.14)",
  success: "#16a34a",
  successFill: "rgba(22, 163, 74, 0.14)",
  warning: "#f59e0b",
  warningFill: "rgba(245, 158, 11, 0.16)",
  error: "#dc2626",
  info: "#0ea5e9",
  infoFill: "rgba(14, 165, 233, 0.14)",
  ink: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  grid: "rgba(226, 232, 240, 0.9)",
  surface: "#ffffff",
  tooltipBg: "#0f172a",
  draft: "#94a3b8",
  unpublished: "#f59e0b",
  closed: "#64748b",
} as const;

export const JOB_STATUS_COLORS: Record<string, string> = {
  PUBLISHED: HAM_CHART.primary,
  DRAFT: HAM_CHART.draft,
  UNPUBLISHED: HAM_CHART.unpublished,
  CLOSED: HAM_CHART.closed,
};

export const APP_STATUS_COLORS: Record<string, string> = {
  SUBMITTED: HAM_CHART.primary,
  VIEWED: HAM_CHART.info,
  SHORTLISTED: HAM_CHART.warning,
  HIRED: HAM_CHART.success,
  REJECTED: HAM_CHART.error,
  WITHDRAWN: HAM_CHART.draft,
};

export const HAM_CHART_FONT =
  'var(--font-employer-sans), Inter, ui-sans-serif, system-ui, sans-serif';
