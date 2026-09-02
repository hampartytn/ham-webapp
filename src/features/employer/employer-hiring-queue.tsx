"use client";

import { motion } from "framer-motion";
import { Clock, MapPin, Plus, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { EmployerPostJobButton } from "@/features/employer/employer-job-create-gate";
import {
  displayWorkerName,
  formatRelativeTime,
  workerInitials,
  type DashboardApplicantRow,
} from "@/features/employer/dashboard-utils";
import type { EmployerJob } from "@/types/ham";

export function EmployerHiringQueuePremium({
  rows,
  empty,
}: {
  rows: DashboardApplicantRow[];
  empty: boolean;
}) {
  const t = useTranslations("employer");
  const locale = useLocale();

  return (
    <section className="ham-employer__card p-5 md:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            {t("hiringQueueTitle")}
          </h2>
          <p className="mt-0.5 text-sm text-[var(--emp-muted)]">
            {t("hiringQueueSubtitle")}
          </p>
        </div>
        <Link
          href="/employer/applicants"
          className="inline-flex items-center gap-1 rounded-full bg-[#fde8e4] px-3 py-1.5 text-xs font-semibold text-[var(--emp-primary)] transition hover:bg-[#fbd5ce]"
        >
          {t("viewAllApplicants")}
          <span aria-hidden>→</span>
        </Link>
      </div>

      {empty ? (
        <div className="ham-employer__empty-dashed">{t("hiringQueueEmptyHint")}</div>
      ) : (
        <ul className="space-y-3">
          {rows.map(({ application, jobTitle, jobId }, index) => {
            const name = displayWorkerName(
              application.employee.fullName,
              t("unnamedApplicant"),
            );
            const skills = application.employee.skills.slice(0, 2);
            const isNew = application.status === "SUBMITTED";
            return (
              <motion.li
                key={application.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.28 }}
                className="ham-employer__queue-item"
              >
                <span className="ham-employer__avatar" aria-hidden>
                  {workerInitials(application.employee.fullName)}
                  {isNew ? <span className="ham-employer__avatar-dot" /> : null}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{name}</p>
                    {isNew ? (
                      <span className="ham-employer__chip ham-employer__chip--new">
                        {t("badgeNew")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--emp-muted)]">
                    {jobTitle}
                  </p>
                  {skills.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <li key={s.skillId} className="ham-employer__chip">
                          {s.name}
                          {s.yearsExperience != null
                            ? ` · ${s.yearsExperience}+`
                            : ""}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1 text-[0.7rem] text-[var(--emp-muted)]">
                    <Clock className="size-3" aria-hidden />
                    <time dateTime={application.createdAt}>
                      {formatRelativeTime(application.createdAt, locale)}
                    </time>
                  </span>
                  <Link
                    href={`/employer/jobs/${jobId}/applicants`}
                    className="ham-employer__btn-dark"
                  >
                    {t("review")}
                  </Link>
                </div>
              </motion.li>
            );
          })}
          <li className="ham-employer__empty-dashed">{t("noMoreApplications")}</li>
        </ul>
      )}
    </section>
  );
}

export function EmployerActiveJobsPremium({
  jobs,
  districtName,
  applicationCounts,
}: {
  jobs: EmployerJob[];
  districtName: Map<string, string>;
  applicationCounts: Map<string, number>;
}) {
  const t = useTranslations("employer");

  return (
    <section className="ham-employer__card p-5 md:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">{t("activeJobsTitle")}</h2>
        <EmployerPostJobButton
          className="inline-flex size-9 items-center justify-center rounded-full border border-[var(--emp-border)] bg-white text-[var(--emp-ink)] shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          ariaLabel={t("postJob")}
        >
          <Plus className="size-4" />
        </EmployerPostJobButton>
      </div>

      {jobs.length === 0 ? (
        <div className="ham-employer__empty-dashed">{t("noJobsHint")}</div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job, index) => {
            const appCount = applicationCounts.get(job.id);
            const location = districtName.get(job.districtId);
            const tone =
              job.status === "PUBLISHED"
                ? ""
                : job.status === "DRAFT"
                  ? "ham-employer__job-item--draft"
                  : "ham-employer__job-item--closed";
            return (
              <motion.li
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + index * 0.05, duration: 0.28 }}
                className={`ham-employer__job-item ${tone}`}
              >
                <div className="flex items-start justify-between gap-2 ps-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{job.title}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-[var(--emp-muted)]">
                      {location ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" aria-hidden />
                          {location}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[0.68rem] font-semibold text-emerald-700">
                        <span
                          className="size-1.5 rounded-full bg-emerald-500"
                          aria-hidden
                        />
                        {job.status === "PUBLISHED"
                          ? t("statusActive")
                          : t(`status.${job.status}` as "status.DRAFT")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 ps-2">
                  {appCount != null ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wide uppercase">
                      <User className="size-3.5 text-[var(--emp-muted)]" aria-hidden />
                      {t("applicationCount", { count: appCount })}
                    </span>
                  ) : (
                    <span />
                  )}
                  <Link
                    href={
                      job.status === "DRAFT"
                        ? `/employer/jobs/${job.id}/edit`
                        : `/employer/jobs/${job.id}`
                    }
                    className="rounded-xl border border-[var(--emp-border)] bg-white px-3.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--emp-soft)]"
                  >
                    {t("manage")}
                  </Link>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
