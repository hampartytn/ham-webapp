import { formatPaise } from "@/components/shared/status-badge";
import type { ApplicantItem, EmployerJob } from "@/types/ham";

export type JobListSort = "newest" | "oldest" | "title";

export type JobListStatusFilter =
  "" | "PUBLISHED" | "DRAFT" | "UNPUBLISHED" | "CLOSED";

export function jobStatusFilterOptions(): JobListStatusFilter[] {
  return ["", "PUBLISHED", "DRAFT", "UNPUBLISHED", "CLOSED"];
}

export function filterJobsByTitle(
  jobs: EmployerJob[],
  query: string,
): EmployerJob[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return jobs;
  return jobs.filter((job) => job.title.toLowerCase().includes(needle));
}

export function sortEmployerJobs(
  jobs: EmployerJob[],
  sort: JobListSort,
): EmployerJob[] {
  const copy = [...jobs];
  if (sort === "title") {
    copy.sort((a, b) => a.title.localeCompare(b.title));
    return copy;
  }
  copy.sort((a, b) => {
    const aTime = Date.parse(a.publishedAt ?? a.createdAt);
    const bTime = Date.parse(b.publishedAt ?? b.createdAt);
    return sort === "oldest" ? aTime - bTime : bTime - aTime;
  });
  return copy;
}

export function newApplicantCount(
  apps: Pick<ApplicantItem, "status">[],
): number {
  return apps.filter((app) => app.status === "SUBMITTED").length;
}

export function applicantStatusCounts(apps: Pick<ApplicantItem, "status">[]): {
  total: number;
  shortlisted: number;
  hired: number;
  submitted: number;
} {
  let shortlisted = 0;
  let hired = 0;
  let submitted = 0;
  for (const app of apps) {
    if (app.status === "SHORTLISTED") shortlisted += 1;
    if (app.status === "HIRED") hired += 1;
    if (app.status === "SUBMITTED") submitted += 1;
  }
  return { total: apps.length, shortlisted, hired, submitted };
}

export function applicantProgressPercent(
  applicantCount: number,
  vacancies: number,
): number {
  if (applicantCount <= 0) return 0;
  const basis = Math.max(vacancies, applicantCount);
  return Math.min(100, Math.round((applicantCount / basis) * 100));
}

export function newApplicantSharePercent(
  newCount: number,
  total: number,
): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((newCount / total) * 100));
}

export function sumApplicantTotals(
  counts: Array<number | null | undefined>,
): number {
  return counts.reduce<number>(
    (sum, n) => sum + (typeof n === "number" ? n : 0),
    0,
  );
}

export function jobLocationLine(
  location: string | null | undefined,
  jobTypeLabel: string,
): string {
  const loc = location?.trim();
  if (loc && jobTypeLabel) return `${loc} • ${jobTypeLabel}`;
  return loc || jobTypeLabel;
}

export function uniqueJobsById(jobs: EmployerJob[]): EmployerJob[] {
  const seen = new Set<string>();
  const out: EmployerJob[] = [];
  for (const job of jobs) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
  }
  return out;
}

export function formatJobCompensation(
  wageMinPaise: number | null,
  wageMaxPaise: number | null,
  periodLabel: string | null,
): string | null {
  if (wageMinPaise == null && wageMaxPaise == null) return null;
  const min = wageMinPaise != null ? formatPaise(wageMinPaise) : null;
  const max = wageMaxPaise != null ? formatPaise(wageMaxPaise) : null;
  const amount =
    min && max && min !== max ? `${min} – ${max}` : (min ?? max ?? "");
  if (!amount) return null;
  return periodLabel ? `${amount} / ${periodLabel}` : amount;
}

export function jobPostedAt(
  job: Pick<EmployerJob, "publishedAt" | "createdAt">,
): string {
  return job.publishedAt ?? job.createdAt;
}

export function jobCanEdit(status: string): boolean {
  return status !== "CLOSED";
}

export function jobCanClose(status: string): boolean {
  return status !== "CLOSED";
}

export function jobCanPublish(status: string): boolean {
  return status === "DRAFT" || status === "UNPUBLISHED";
}

export function jobShowsPause(status: string): boolean {
  return status === "PUBLISHED";
}

export function jobHasText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}
