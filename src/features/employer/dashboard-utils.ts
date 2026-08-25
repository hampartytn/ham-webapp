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
      return "warning";
    case "DRAFT":
    case "VIEWED":
      return "info";
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
