"use client";

import { useTranslations } from "next-intl";

import { EmployerPanel } from "@/components/employer/employer-page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { EmployerPostJobButton } from "@/features/employer/employer-job-create-gate";
import {
  toneForStatus,
} from "@/features/employer/dashboard-utils";
import type { EmployerJob } from "@/types/ham";

type StatusCounts = {
  PUBLISHED: number;
  DRAFT: number;
  UNPUBLISHED: number;
  CLOSED: number;
};

const SEGMENTS: (keyof StatusCounts)[] = [
  "PUBLISHED",
  "DRAFT",
  "UNPUBLISHED",
  "CLOSED",
];

const SEGMENT_COLOR: Record<keyof StatusCounts, string> = {
  PUBLISHED: "bg-emerald-600",
  DRAFT: "bg-sky-500",
  UNPUBLISHED: "bg-stone-400",
  CLOSED: "bg-red-400",
};

export function EmployerJobStatusBar({ counts }: { counts: StatusCounts }) {
  const t = useTranslations("employer");
  const total = SEGMENTS.reduce((sum, key) => sum + counts[key], 0);

  const summary = SEGMENTS.filter((k) => counts[k] > 0)
    .map((k) => `${counts[k]} ${t(`status.${k}` as "status.DRAFT")}`)
    .join(", ");

  if (total === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-[var(--emp-muted)]">
        {t("jobStatusMix")}
      </p>
      <div
        className="ham-employer__status-bar"
        role="img"
        aria-label={t("jobStatusMixAria", { summary })}
      >
        {SEGMENTS.map((key) => {
          const n = counts[key];
          if (n <= 0) return null;
          const pct = Math.max(4, (n / total) * 100);
          return (
            <span
              key={key}
              className={`ham-employer__status-seg ${SEGMENT_COLOR[key]}`}
              style={{ width: `${pct}%` }}
              title={`${t(`status.${key}` as "status.DRAFT")}: ${n}`}
            />
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[0.7rem] text-[var(--emp-muted)]">
        {SEGMENTS.map((key) =>
          counts[key] > 0 ? (
            <li key={key} className="inline-flex items-center gap-1.5">
              <span
                className={`size-2 rounded-sm ${SEGMENT_COLOR[key]}`}
                aria-hidden
              />
              {t(`status.${key}` as "status.DRAFT")} ({counts[key]})
            </li>
          ) : null,
        )}
      </ul>
    </div>
  );
}

export function EmployerJobsPulse({
  jobs,
  districtName,
  applicationCounts,
}: {
  jobs: EmployerJob[];
  districtName: Map<string, string>;
  /** Counts only for jobs whose applications were fetched. */
  applicationCounts: Map<string, number>;
}) {
  const t = useTranslations("employer");

  return (
    <EmployerPanel
      title={t("jobsPulseTitle")}
      action={
        <Link
          href="/employer/jobs"
          className="shrink-0 text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          {t("viewAllJobs")}
        </Link>
      }
      className="overflow-hidden p-0"
    >
      {jobs.length === 0 ? (
        <div className="px-4 py-8 text-center">
          <p className="text-sm font-medium">{t("noJobsYet")}</p>
          <p className="mt-1 text-xs text-[var(--emp-muted)]">
            {t("noJobsHint")}
          </p>
          <div className="mt-4">
            <EmployerPostJobButton className="ham-employer__btn ham-employer__btn--primary ham-employer__btn--sm">
              {t("postJob")}
            </EmployerPostJobButton>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--emp-border)]">
          {jobs.map((job) => {
            const appCount = applicationCounts.get(job.id);
            const location =
              districtName.get(job.districtId) ?? null;
            const primaryHref =
              job.status === "DRAFT"
                ? `/employer/jobs/${job.id}/edit`
                : `/employer/jobs/${job.id}/applicants`;
            const primaryLabel =
              job.status === "DRAFT" ? t("editJob") : t("applicants");

            return (
              <li key={job.id} className="ham-employer__pulse-row">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/employer/jobs/${job.id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {job.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge
                      status={job.status}
                      label={t(`status.${job.status}` as "status.DRAFT")}
                      tone={toneForStatus(job.status)}
                    />
                    {location ? (
                      <span className="text-xs text-[var(--emp-muted)]">
                        {location}
                      </span>
                    ) : null}
                    {appCount != null ? (
                      <span className="text-xs text-[var(--emp-muted)]">
                        {t("applicationCount", { count: appCount })}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </EmployerPanel>
  );
}
