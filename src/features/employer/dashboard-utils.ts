/** Employer dashboard helpers — display sanitization and derived attention model. */

import type { ApplicantItem, EmployerJob, MeResponse } from "@/types/ham";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function looksLikeId(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (UUID_RE.test(v)) return true;
  // CUID / nanoid-ish technical ids
  if (/^[a-z0-9_-]{20,}$/i.test(v) && !/\s/.test(v)) return true;
  return false;
}

/** Never expose employee UUIDs / technical ids as display names. */
export function displayWorkerName(
  fullName: string | null | undefined,
  unnamedLabel: string,
): string {
  const name = fullName?.trim();
  if (!name || looksLikeId(name)) return unnamedLabel;
  return name;
}

export function workerInitials(fullName: string | null | undefined): string {
  const name = fullName?.trim();
  if (!name || looksLikeId(name)) return "?";
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[parts.length - 1]!.slice(0, 1)}`.toUpperCase();
}

export function formatRelativeTime(
  iso: string,
  locale: string = "en",
): string {
  const date = new Date(iso);
  const diffSec = Math.round((date.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (abs < 60) return rtf.format(Math.round(diffSec), "second");
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
  if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  return rtf.format(Math.round(diffSec / (86400 * 365)), "year");
}

export type DashboardApplicantRow = {
  application: ApplicantItem;
  jobTitle: string;
  jobId: string;
};

export type AttentionKind =
  | "org_missing"
  | "org_incomplete"
  | "submitted_applicants"
  | "draft_jobs";

export type AttentionItem = {
  id: string;
  kind: AttentionKind;
  severity: "critical" | "high" | "medium";
  count?: number;
  href: string;
};

export function buildAttentionItems(input: {
  orgId: string | null | undefined;
  organization:
    | {
        districtId: string | null;
        contactPhone: string | null;
        contactEmail: string | null;
      }
    | null
    | undefined;
  draftCount: number;
  submittedCount: number;
}): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (!input.orgId) {
    items.push({
      id: "org_missing",
      kind: "org_missing",
      severity: "critical",
      href: "/employer/organization",
    });
  } else if (input.organization) {
    const softIncomplete =
      !input.organization.districtId ||
      !(input.organization.contactPhone || input.organization.contactEmail);
    if (softIncomplete) {
      items.push({
        id: "org_incomplete",
        kind: "org_incomplete",
        severity: "medium",
        href: "/employer/organization",
      });
    }
  }

  if (input.submittedCount > 0) {
    items.push({
      id: "submitted_applicants",
      kind: "submitted_applicants",
      severity: "high",
      count: input.submittedCount,
      href: "/employer/applicants",
    });
  }

  if (input.draftCount > 0) {
    items.push({
      id: "draft_jobs",
      kind: "draft_jobs",
      severity: "high",
      count: input.draftCount,
      href: "/employer/jobs",
    });
  }

  return items.slice(0, 5);
}

export function dashboardDisplayName(me: MeResponse): {
  welcomeName: string;
  companyLine: string | null;
} {
  const fullName = me.employerProfile?.fullName?.trim() || null;
  const orgName = me.employerProfile?.organizationName?.trim() || null;

  if (fullName && !looksLikeId(fullName)) {
    return { welcomeName: fullName, companyLine: orgName };
  }
  if (orgName) {
    return { welcomeName: orgName, companyLine: null };
  }
  return { welcomeName: me.phone, companyLine: null };
}

export function pickJobsForPulse(jobs: EmployerJob[], limit = 5): EmployerJob[] {
  const published = jobs.filter((j) => j.status === "PUBLISHED");
  const drafts = jobs.filter((j) => j.status === "DRAFT");
  const rest = jobs.filter(
    (j) => j.status !== "PUBLISHED" && j.status !== "DRAFT",
  );
  return [...published, ...drafts, ...rest].slice(0, limit);
}

export function jobStatusCounts(jobs: EmployerJob[]) {
  return {
    PUBLISHED: jobs.filter((j) => j.status === "PUBLISHED").length,
    DRAFT: jobs.filter((j) => j.status === "DRAFT").length,
    UNPUBLISHED: jobs.filter((j) => j.status === "UNPUBLISHED").length,
    CLOSED: jobs.filter((j) => j.status === "CLOSED").length,
  };
}

export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  | "muted";

export function toneForStatus(status: string): StatusTone {
  switch (status) {
    case "PUBLISHED":
    case "HIRED":
    case "SHORTLISTED":
      return "success";
    case "SUBMITTED":
      return "info";
    case "DRAFT":
    case "VIEWED":
      return "muted";
    case "REJECTED":
    case "CLOSED":
      return "danger";
    case "UNPUBLISHED":
    case "WITHDRAWN":
      return "muted";
    default:
      return "neutral";
  }
}

export type ChartRangeId = "7d" | "20d" | "6m" | "1y" | "3y" | "5y" | "all";

export const CHART_RANGES: { id: ChartRangeId; days: number | null }[] = [
  { id: "7d", days: 7 },
  { id: "20d", days: 20 },
  { id: "6m", days: 183 },
  { id: "1y", days: 365 },
  { id: "3y", days: 365 * 3 },
  { id: "5y", days: 365 * 5 },
  { id: "all", days: null },
];

function startOfDay(ms: number) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function inRange(iso: string, fromMs: number) {
  return new Date(iso).getTime() >= fromMs;
}

export function countInWindow(timestamps: string[], days: number): number {
  const from = Date.now() - days * 86400000;
  return timestamps.filter((t) => inRange(t, from)).length;
}

export type ApplicationTrendBucket = {
  label: string;
  applications: number;
  shortlisted: number;
  hired: number;
};

function emptyTrendBucket(label: string): ApplicationTrendBucket {
  return { label, applications: 0, shortlisted: 0, hired: 0 };
}

function addTrendRow(bucket: ApplicationTrendBucket, status: string) {
  bucket.applications += 1;
  if (status === "SHORTLISTED") bucket.shortlisted += 1;
  if (status === "HIRED") bucket.hired += 1;
}

export function buildApplicationTrendBuckets(
  rows: { createdAt: string; status: string }[],
  range: ChartRangeId,
  locale: string,
): ApplicationTrendBucket[] {
  const now = Date.now();
  const spec = CHART_RANGES.find((r) => r.id === range) ?? CHART_RANGES[0]!;
  const fromMs = spec.days == null ? 0 : now - spec.days * 86400000;
  const filtered = rows.filter((r) => inRange(r.createdAt, fromMs));

  if (range === "7d" || range === "20d") {
    const days = range === "7d" ? 7 : 20;
    const buckets: ApplicationTrendBucket[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const start = startOfDay(now - i * 86400000);
      const end = start + 86400000;
      const label = new Date(start).toLocaleDateString(locale, {
        weekday: range === "7d" ? "short" : undefined,
        day: "numeric",
        month: range === "20d" ? "short" : undefined,
      });
      const bucket = emptyTrendBucket(label);
      for (const row of filtered) {
        const ms = new Date(row.createdAt).getTime();
        if (ms >= start && ms < end) addTrendRow(bucket, row.status);
      }
      buckets.push(bucket);
    }
    return buckets;
  }

  const monthCount =
    range === "6m" ? 6 : range === "1y" ? 12 : range === "3y" ? 36 : range === "5y" ? 60 : 24;
  const earliest = filtered.reduce((min, r) => {
    const ms = new Date(r.createdAt).getTime();
    return ms < min ? ms : min;
  }, now);
  const months =
    range === "all"
      ? Math.max(
          6,
          Math.min(
            24,
            Math.ceil((now - startOfDay(earliest)) / (86400000 * 30)) || 6,
          ),
        )
      : Math.min(monthCount, 24);

  const buckets: ApplicationTrendBucket[] = [];
  const cursor = new Date();
  cursor.setDate(1);
  cursor.setHours(0, 0, 0, 0);
  for (let i = months - 1; i >= 0; i -= 1) {
    const start = new Date(cursor.getFullYear(), cursor.getMonth() - i, 1).getTime();
    const end = new Date(cursor.getFullYear(), cursor.getMonth() - i + 1, 1).getTime();
    const bucket = emptyTrendBucket(
      new Date(start).toLocaleDateString(locale, {
        month: "short",
        year: months > 12 ? "2-digit" : undefined,
      }),
    );
    for (const row of filtered) {
      const ms = new Date(row.createdAt).getTime();
      if (ms >= start && ms < end) addTrendRow(bucket, row.status);
    }
    buckets.push(bucket);
  }
  return buckets;
}

export function buildHiringBuckets(
  timestamps: string[],
  range: ChartRangeId,
  locale: string,
): { label: string; count: number }[] {
  return buildApplicationTrendBuckets(
    timestamps.map((createdAt) => ({ createdAt, status: "SUBMITTED" })),
    range,
    locale,
  ).map((b) => ({ label: b.label, count: b.applications }));
}

export type JobPerformanceRow = {
  title: string;
  applications: number;
  shortlisted: number;
  hired: number;
};

export function buildJobPerformanceRows(
  jobs: { id: string; title: string }[],
  applicationCounts: Map<string, number>,
  applicants: DashboardApplicantRow[],
): JobPerformanceRow[] {
  return jobs.map((job) => {
    const rows = applicants.filter((r) => r.jobId === job.id);
    return {
      title: job.title,
      applications: applicationCounts.get(job.id) ?? rows.length,
      shortlisted: rows.filter((r) => r.application.status === "SHORTLISTED")
        .length,
      hired: rows.filter((r) => r.application.status === "HIRED").length,
    };
  });
}

export function applicationStatusCounts(
  statuses: string[],
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const status of statuses) {
    counts[status] = (counts[status] ?? 0) + 1;
  }
  return counts;
}
