"use client";

import type { ReactNode } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  FileText,
  Plus,
  Star,
  UserPlus,
  UserCheck,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmployerBadge, jobBadgeTone } from "@/components/employer/employer-badge";
import { ErrorState } from "@/components/shared/error-state";
import { Link } from "@/i18n/navigation";
import { EmployerDashboardSkeleton } from "@/features/employer/employer-dashboard-skeleton";
import { ApplicationsTrendChart } from "@/features/employer/charts/applications-trend-chart";
import { JobPerformanceChart } from "@/features/employer/charts/job-performance-chart";
import { JobStatusChart } from "@/features/employer/charts/job-status-chart";
import {
  buildApplicationTrendBuckets,
  buildJobPerformanceRows,
  CHART_RANGES,
  countInWindow,
  dashboardDisplayName,
  displayWorkerName,
  formatRelativeTime,
  jobStatusCounts,
  pickJobsForPulse,
  type ChartRangeId,
  type DashboardApplicantRow,
} from "@/features/employer/dashboard-utils";
import { bffEnvelope, bffJson, type OffsetMeta, proxyPath } from "@/lib/api/bff-client";
import { employerJobsFeedQueryOptions } from "@/lib/query/employer-jobs";
import { ME_QUERY_KEY, ME_STALE_MS } from "@/lib/query/session-cache";
import type { ApplicantItem, EmployerJob, EmployerOrg, MeResponse } from "@/types/ham";
import { cn } from "@/lib/utils";

function greetingKey(date = new Date()): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  const h = date.getHours();
  if (h < 12) return "greetingMorning";
  if (h < 17) return "greetingAfternoon";
  return "greetingEvening";
}

export function EmployerDashboard() {
  const t = useTranslations("employer");
  const locale = useLocale();
  const [chartRange, setChartRange] = useState<ChartRangeId>("7d");
  const [chartOpen, setChartOpen] = useState(false);

  const meQ = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: ME_STALE_MS,
  });

  const jobsQ = useQuery(employerJobsFeedQueryOptions);

  const orgQ = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () =>
      bffJson<{
        id: string;
        fullName: string | null;
        organization: EmployerOrg | null;
      }>(proxyPath("employer/profile")),
    staleTime: 60_000,
  });

  const jobs = jobsQ.data?.data ?? [];
  const publishedJobs = jobs.filter((j) => j.status === "PUBLISHED");
  const pulseJobs = pickJobsForPulse(jobs, 6);
  const statusCounts = jobStatusCounts(jobs);
  const fetchJobs = publishedJobs.slice(0, 5);

  const applicantQueries = useQueries({
    queries: fetchJobs.map((job) => ({
      queryKey: ["applicants", job.id, 1, "dashboard"],
      queryFn: () =>
        bffEnvelope<ApplicantItem[], OffsetMeta>(
          proxyPath(`employer/jobs/${job.id}/applications`, {
            page: 1,
            limit: 20,
          }),
        ),
      enabled: fetchJobs.length > 0,
      staleTime: 20_000,
    })),
  });

  const applicationCounts = new Map<string, number>();
  const recentApplicants: DashboardApplicantRow[] = [];
  applicantQueries.forEach((q, index) => {
    const job = fetchJobs[index];
    if (!job || !q.data?.data) return;
    applicationCounts.set(job.id, q.data.meta?.total ?? q.data.data.length);
    for (const application of q.data.data) {
      recentApplicants.push({
        application,
        jobTitle: job.title,
        jobId: job.id,
      });
    }
  });
  recentApplicants.sort(
    (a, b) =>
      new Date(b.application.createdAt).getTime() -
      new Date(a.application.createdAt).getTime(),
  );

  const appTimestamps = recentApplicants.map((r) => r.application.createdAt);
  const trendBuckets = useMemo(
    () =>
      buildApplicationTrendBuckets(
        recentApplicants.map((r) => ({
          createdAt: r.application.createdAt,
          status: r.application.status,
        })),
        chartRange,
        locale,
      ),
    [recentApplicants, chartRange, locale],
  );
  const performanceRows = useMemo(
    () =>
      buildJobPerformanceRows(
        fetchJobs.length > 0 ? fetchJobs : pulseJobs,
        applicationCounts,
        recentApplicants,
      ),
    [fetchJobs, pulseJobs, applicationCounts, recentApplicants],
  );
  const appsLoading =
    fetchJobs.length > 0 &&
    applicantQueries.some((q) => q.isPending && !q.data);
  const appsError =
    fetchJobs.length > 0 &&
    applicantQueries.every((q) => Boolean(q.error) && !q.data);
  const retryApps = () => {
    applicantQueries.forEach((q) => {
      void q.refetch();
    });
  };

  const shortlisted = recentApplicants.filter(
    (r) => r.application.status === "SHORTLISTED",
  ).length;
  const hired = recentApplicants.filter((r) => r.application.status === "HIRED").length;
  const totalApps = recentApplicants.length;
  const verified = orgQ.data?.organization?.verificationState === "VERIFIED";
  const jobsThisWeek = countInWindow(
    jobs.filter((j) => j.status === "PUBLISHED").map((j) => j.publishedAt ?? j.createdAt),
    7,
  );
  const appsThisWeek = countInWindow(appTimestamps, 7);
  const hiredThisMonth = countInWindow(
    recentApplicants
      .filter((r) => r.application.status === "HIRED")
      .map((r) => r.application.updatedAt ?? r.application.createdAt),
    30,
  );

  if (meQ.error && !meQ.data) {
    return <ErrorState onRetry={() => void meQ.refetch()} />;
  }

  const { welcomeName } = meQ.data
    ? dashboardDisplayName(meQ.data)
    : { welcomeName: "…" };
  const jobsPending = jobsQ.isPending && !jobsQ.data;

  const activity = recentApplicants.slice(0, 6).map((row) => {
    const status = row.application.status;
    const title =
      status === "SHORTLISTED"
        ? t("activityShortlisted")
        : status === "HIRED"
          ? t("activityHired")
          : t("activityNewApplication");
    return { row, title, status };
  });

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <h1 className="text-[2rem] font-bold leading-10 tracking-tight text-[var(--emp-ink)]">
              {t(greetingKey())} {welcomeName}
            </h1>
            {verified ? (
              <span className="ham-employer__pill ham-employer__pill--success">
                {t("verifiedEmployer")}
              </span>
            ) : (
              <Link
                href="/employer/verification"
                className="ham-employer__pill ham-employer__pill--info"
              >
                {t(
                  `orgVerification.${orgQ.data?.organization?.verificationState ?? "UNVERIFIED"}` as
                    "orgVerification.UNVERIFIED",
                )}
              </Link>
            )}
          </div>
          <p className="text-base text-[var(--emp-muted)]">{t("pipelineSubtitle")}</p>
        </div>
        <Link href="/employer/jobs/new" className="ham-employer__btn ham-employer__btn--primary">
          <Plus className="size-5" aria-hidden />
          {t("postJob")}
        </Link>
      </div>

      {jobsQ.error && !jobsQ.data ? (
        <ErrorState onRetry={() => void jobsQ.refetch()} />
      ) : jobsPending ? (
        <EmployerDashboardSkeleton omitWelcome />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("statActiveJobsLabel")}
              value={statusCounts.PUBLISHED}
              hint={
                jobsThisWeek > 0
                  ? t("trendUpWeek", { count: jobsThisWeek })
                  : t("trendNoChange")
              }
              trendUp={jobsThisWeek > 0}
              icon={<BriefcaseBusiness className="size-4" />}
              href="/employer/jobs"
            />
            <StatCard
              label={t("statApplicationsLabel")}
              value={totalApps}
              hint={
                appsThisWeek > 0
                  ? t("trendUpWeek", { count: appsThisWeek })
                  : t("trendNoChange")
              }
              trendUp={appsThisWeek > 0}
              icon={<FileText className="size-4" />}
              href="/employer/applicants"
            />
            <StatCard
              label={t("statShortlistedLabel")}
              value={shortlisted}
              hint={t("trendNoChange")}
              icon={<Star className="size-4" />}
              href="/employer/applicants"
            />
            <StatCard
              label={t("statHiredLabel")}
              value={hired}
              hint={
                hiredThisMonth > 0
                  ? t("trendUpMonth", { count: hiredThisMonth })
                  : t("trendNoChange")
              }
              trendUp={hiredThisMonth > 0}
              icon={<UserCheck className="size-4" />}
              href="/employer/applicants"
              success
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
              <ApplicationsTrendChart
                title={t("hiringPerformance")}
                summary={t("applicationsTrendSummary", {
                  total: trendBuckets.reduce((sum, b) => sum + b.applications, 0),
                })}
                note={t("chartDataNote")}
                emptyMessage={t("applicationsTrendEmpty")}
                errorMessage={t("chartLoadError")}
                retryLabel={t("chartRetry")}
                seriesApplications={t("chartSeriesApplications")}
                seriesShortlisted={t("chartSeriesShortlisted")}
                seriesHired={t("chartSeriesHired")}
                buckets={trendBuckets}
                loading={appsLoading}
                error={appsError}
                onRetry={retryApps}
                headerRight={
                  <div className="relative">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-sm text-[var(--emp-muted)] hover:text-[var(--emp-primary)]"
                      aria-expanded={chartOpen}
                      onClick={() => setChartOpen((v) => !v)}
                    >
                      {t(`chartRange.${chartRange}` as "chartRange.7d")}
                      <ChevronDown className="size-4" />
                    </button>
                    {chartOpen ? (
                      <ul className="absolute end-0 z-20 mt-2 min-w-44 rounded-lg border border-[var(--emp-border)] bg-white py-1 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.1)]">
                        {CHART_RANGES.map((r) => (
                          <li key={r.id}>
                            <button
                              type="button"
                              className={cn(
                                "block w-full px-3 py-2 text-left text-sm hover:bg-[var(--emp-soft)]",
                                r.id === chartRange && "font-semibold text-[var(--emp-primary)]",
                              )}
                              onClick={() => {
                                setChartRange(r.id);
                                setChartOpen(false);
                              }}
                            >
                              {t(`chartRange.${r.id}` as "chartRange.7d")}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                }
              />
              <JobPerformanceChart
                title={t("jobPerformance")}
                summary={t("jobPerformanceSummary")}
                note={t("chartDataNote")}
                emptyMessage={t("jobPerformanceEmpty")}
                errorMessage={t("chartLoadError")}
                retryLabel={t("chartRetry")}
                seriesApplications={t("chartSeriesApplications")}
                seriesShortlisted={t("chartSeriesShortlisted")}
                seriesHired={t("chartSeriesHired")}
                rows={performanceRows}
                loading={appsLoading}
                error={appsError}
                onRetry={retryApps}
              />

              <section className="ham-employer__card overflow-hidden">
                <div className="flex items-center justify-between border-b border-[var(--emp-border)] p-6">
                  <h2 className="text-lg font-semibold">{t("recentJobs")}</h2>
                  <Link href="/employer/jobs" className="text-sm text-[var(--emp-primary)] hover:underline">
                    {t("viewAll")}
                  </Link>
                </div>
                {pulseJobs.length === 0 ? (
                  <p className="p-6 text-sm text-[var(--emp-muted)]">{t("noJobsYet")}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="ham-employer__table">
                      <thead>
                        <tr>
                          <th>{t("colJobTitle")}</th>
                          <th>{t("statusLabel")}</th>
                          <th>{t("colApplications")}</th>
                          <th>{t("colClosingDate")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pulseJobs.map((job) => (
                          <tr key={job.id}>
                            <td>
                              <Link
                                href={`/employer/jobs/${job.id}`}
                                className="font-medium text-[var(--emp-primary)] hover:underline"
                              >
                                {job.title}
                              </Link>
                            </td>
                            <td>
                              <EmployerBadge tone={jobBadgeTone(job.status)} dot>
                                {job.status === "PUBLISHED"
                                  ? t("statusActive")
                                  : t(`status.${job.status}` as "status.DRAFT")}
                              </EmployerBadge>
                            </td>
                            <td>{applicationCounts.get(job.id) ?? "—"}</td>
                            <td className="text-[var(--emp-muted)]">
                              {job.closedAt
                                ? new Date(job.closedAt).toLocaleDateString(locale)
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            <div className="flex min-w-0 flex-col gap-6">
              <JobStatusChart
                title={t("jobStatusMix")}
                emptyMessage={t("jobStatusEmpty")}
                errorMessage={t("chartLoadError")}
                retryLabel={t("chartRetry")}
                activeLabel={t("donutActiveLabel")}
                counts={statusCounts}
                labels={{
                  PUBLISHED: t("statusActive"),
                  DRAFT: t("status.DRAFT"),
                  UNPUBLISHED: t("status.UNPUBLISHED"),
                  CLOSED: t("status.CLOSED"),
                }}
                summary={t("jobStatusMixAria", {
                  summary: t("jobStatusSummary", {
                    active: statusCounts.PUBLISHED,
                    total:
                      statusCounts.PUBLISHED +
                      statusCounts.DRAFT +
                      statusCounts.UNPUBLISHED +
                      statusCounts.CLOSED,
                  }),
                })}
              />
              <section className="ham-employer__card flex h-full flex-col p-6">
              <h2 className="mb-6 text-lg font-semibold">{t("recentActivity")}</h2>
              {activity.length === 0 ? (
                <p className="text-sm text-[var(--emp-muted)]">{t("activityEmpty")}</p>
              ) : (
                <ol className="flex flex-1 flex-col gap-5">
                  {activity.map(({ row, title, status }) => (
                    <li key={row.application.id} className="flex gap-3">
                      <span
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full",
                          status === "SHORTLISTED" || status === "HIRED"
                            ? "bg-[var(--emp-success-soft)] text-[var(--emp-success)]"
                            : "bg-[var(--emp-primary-light)] text-[var(--emp-primary)]",
                        )}
                      >
                        {status === "SHORTLISTED" || status === "HIRED" ? (
                          <CheckCircle2 className="size-4" aria-hidden />
                        ) : (
                          <UserPlus className="size-4" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{title}</p>
                        <p className="text-sm text-[var(--emp-muted)]">
                          {displayWorkerName(
                            row.application.employee.fullName,
                            t("unnamedApplicant"),
                          )}{" "}
                          · {row.jobTitle}
                        </p>
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--emp-muted)]">
                          {formatRelativeTime(row.application.createdAt, locale)}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <Link
                href="/employer/applicants"
                className="mt-6 text-center text-sm font-semibold text-[var(--emp-primary)] hover:underline"
              >
                {t("viewAllActivity")}
              </Link>
            </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  success,
  trendUp,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ReactNode;
  href: string;
  success?: boolean;
  trendUp?: boolean;
}) {
  return (
    <Link
      href={href}
      className="ham-employer__card group flex flex-col justify-between p-6 transition-shadow hover:shadow-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="text-base font-medium text-[var(--emp-muted)]">{label}</span>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full transition-transform group-hover:scale-110",
            success
              ? "bg-[var(--emp-success-soft)] text-[var(--emp-success)]"
              : "bg-[var(--emp-primary-light)] text-[var(--emp-primary)]",
          )}
        >
          {icon}
        </span>
      </div>
      <div>
        <span className="block text-[2rem] font-bold leading-10">{value}</span>
        <p
          className={cn(
            "mt-1 text-sm",
            trendUp ? "text-[var(--emp-success)]" : "text-[var(--emp-muted)]",
          )}
        >
          {hint}
        </p>
      </div>
    </Link>
  );
}
