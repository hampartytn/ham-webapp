"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  BarChart3,
  Check,
  CheckCircle2,
  Pause,
  Pencil,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { PaginationControls } from "@/components/shared/pagination";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import {
  displayWorkerName,
  workerInitials,
} from "@/features/employer/dashboard-utils";
import { EmployerMembershipRequiredDialog } from "@/features/employer/employer-membership-required-dialog";
import { isEmployerMembershipRequiredError } from "@/features/employer/employer-membership-view";
import { useEmployerJobCreateGate } from "@/features/employer/employer-job-create-gate";
import {
  applicantStatusCounts,
  formatJobCompensation,
  jobCanClose,
  jobCanEdit,
  jobCanPublish,
  jobHasText,
  jobPostedAt,
  jobShowsPause,
} from "@/features/employer/employer-jobs-view";
import { geoDistrictsQueryOptions } from "@/lib/query/catalog";
import type { ApplicantItem, EmployerJob } from "@/types/ham";

const RECENT_PAGE_SIZE = 3;

export function EmployerJobDetail({ jobId }: { jobId: string }) {
  const t = useTranslations("employer");
  const locale = useLocale();
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [appsPage, setAppsPage] = useState(1);
  const { gate, amountPaise } = useEmployerJobCreateGate();

  const jobQ = useQuery({
    queryKey: ["employer-job", jobId],
    queryFn: () => bffJson<EmployerJob>(proxyPath(`employer/jobs/${jobId}`)),
  });

  const metricsQ = useQuery({
    queryKey: ["applicants", jobId, 1, "detail-metrics"],
    queryFn: () =>
      bffEnvelope<ApplicantItem[], OffsetMeta>(
        proxyPath(`employer/jobs/${jobId}/applications`, {
          page: 1,
          limit: 50,
        }),
      ),
    staleTime: 20_000,
  });

  const recentQ = useQuery({
    queryKey: ["applicants", jobId, appsPage, "detail-recent"],
    placeholderData: keepPreviousData,
    queryFn: () =>
      bffEnvelope<ApplicantItem[], OffsetMeta>(
        proxyPath(`employer/jobs/${jobId}/applications`, {
          page: appsPage,
          limit: RECENT_PAGE_SIZE,
        }),
      ),
    staleTime: 20_000,
  });

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const districtName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of districtsQ.data ?? []) map.set(d.id, d.name);
    return map;
  }, [districtsQ.data]);

  const publishMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${jobId}/publish`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["employer-job", jobId] });
      await qc.invalidateQueries({ queryKey: ["employer-jobs"] });
    },
    onError: (e) => {
      if (isEmployerMembershipRequiredError(e)) {
        setMembershipOpen(true);
        return;
      }
      setMsg(errMsg(e));
    },
  });

  const closeMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${jobId}/close`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      setCloseOpen(false);
      await qc.invalidateQueries({ queryKey: ["employer-job", jobId] });
      await qc.invalidateQueries({ queryKey: ["employer-jobs"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  if (jobQ.isPending && !jobQ.data) {
    return (
      <div className="ham-employer-job" aria-busy="true">
        <div className="ham-employer__skel h-5 w-36 rounded-md" />
        <div className="ham-employer__skel h-10 w-64 rounded-md" />
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="ham-employer__skel h-28 rounded-[var(--emp-radius-lg)]"
            />
          ))}
        </div>
        <div className="ham-employer__skel h-48 rounded-[var(--emp-radius-lg)]" />
      </div>
    );
  }
  if (jobQ.error || !jobQ.data) {
    return (
      <div className="ham-employer-job">
        <Link href="/employer/jobs" className="ham-employer-job__back">
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToJobs")}
        </Link>
        <ErrorState onRetry={() => void jobQ.refetch()} />
      </div>
    );
  }

  const job = jobQ.data;
  const metricsApps = metricsQ.data?.data ?? [];
  const counts = applicantStatusCounts(metricsApps);
  const totalApps = metricsQ.data?.meta?.total ?? counts.total;
  const metricsLoading = metricsQ.isPending && !metricsQ.data;
  const recent = recentQ.data?.data ?? [];
  const recentMeta = recentQ.data?.meta;
  const recentPages = recentMeta
    ? Math.max(1, Math.ceil(recentMeta.total / recentMeta.limit))
    : 1;
  const pay = formatJobCompensation(
    job.wageMinPaise,
    job.wageMaxPaise,
    job.wagePeriod
      ? t(`wagePeriodLabel.${job.wagePeriod}` as "wagePeriodLabel.DAY")
      : null,
  );
  const location = districtName.get(job.districtId) ?? null;
  const posted = new Date(jobPostedAt(job)).toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const statusLabel =
    job.status === "PUBLISHED"
      ? t("statusActive")
      : job.status === "UNPUBLISHED"
        ? t("tabPaused")
        : t(`status.${job.status}` as "status.DRAFT");

  return (
    <div className="ham-employer-job">
      <Link href="/employer/jobs" className="ham-employer-job__back">
        <ArrowLeft className="size-4" aria-hidden />
        {t("backToJobs")}
      </Link>

      <div className="ham-employer-job__top">
        <div>
          <div className="ham-employer-job__heading">
            <h1>{job.title}</h1>
            <span className="ham-employer__pill ham-employer-job__status">
              {statusLabel}
            </span>
          </div>
          <p className="ham-employer-job__posted">
            {t("postedOnDate", { date: posted })}
          </p>
        </div>
        <div className="ham-employer-job__actions">
          <Link
            href={`/employer/jobs/${jobId}/applicants`}
            className="ham-employer__btn ham-employer__btn--primary"
          >
            <Users className="size-4" aria-hidden />
            {t("manageApplicants")}
          </Link>
          {jobCanEdit(job.status) ? (
            <Link
              href={`/employer/jobs/${jobId}/edit`}
              className="ham-employer__btn ham-employer__btn--secondary"
            >
              <Pencil className="size-4" aria-hidden />
              {t("editJob")}
            </Link>
          ) : null}
          {jobCanPublish(job.status) ? (
            <button
              type="button"
              className="ham-employer__btn ham-employer__btn--secondary"
              disabled={publishMut.isPending || gate === "loading"}
              onClick={() => {
                if (gate === "blocked") {
                  setMembershipOpen(true);
                  return;
                }
                publishMut.mutate();
              }}
            >
              {publishMut.isPending ? (
                <span className="ham-employer__spinner" />
              ) : null}
              {t("publish")}
            </button>
          ) : null}
          {jobShowsPause(job.status) ? (
            <button
              type="button"
              className="ham-employer__btn ham-employer__btn--secondary"
              disabled
              title={t("pauseHiringUnavailable")}
            >
              <Pause className="size-4" aria-hidden />
              {t("pause")}
            </button>
          ) : null}
          {jobCanClose(job.status) ? (
            <button
              type="button"
              className="ham-employer__btn ham-employer-job__btn-close"
              disabled={closeMut.isPending}
              onClick={() => setCloseOpen(true)}
            >
              {closeMut.isPending ? (
                <span className="ham-employer__spinner" />
              ) : (
                <X className="size-4" aria-hidden />
              )}
              {t("closeAction")}
            </button>
          ) : null}
        </div>
      </div>
      {msg ? <p className="text-sm text-[var(--emp-error)]">{msg}</p> : null}

      <section>
        <h2 className="ham-employer-job__hero-title">{t("heroMetrics")}</h2>
        <div className="ham-employer-job__metrics mt-3">
          <div className="ham-employer-job__metric">
            <BarChart3 className="size-5" aria-hidden />
            <p className="ham-employer-job__metric-label">
              {t("metricTotalApplications")}
            </p>
            <p className="ham-employer-job__metric-value">
              {metricsLoading ? "—" : totalApps}
            </p>
          </div>
          <div className="ham-employer-job__metric">
            <CheckCircle2 className="size-5" aria-hidden />
            <p className="ham-employer-job__metric-label">
              {t("metricShortlisted")}
            </p>
            <p className="ham-employer-job__metric-value">
              {metricsLoading ? "—" : counts.shortlisted}
            </p>
          </div>
          <div className="ham-employer-job__metric">
            <UserPlus className="size-5" aria-hidden />
            <p className="ham-employer-job__metric-label">{t("metricHired")}</p>
            <p className="ham-employer-job__metric-value">
              {metricsLoading ? "—" : counts.hired}
            </p>
          </div>
        </div>
      </section>

      <div className="ham-employer-job__grid">
        <div className="ham-employer-job__stack">
          {jobHasText(job.description) ? (
            <section className="ham-employer__card ham-employer-job__panel">
              <h2>{t("jobDescription")}</h2>
              <p className="ham-employer-job__body">{job.description}</p>
            </section>
          ) : null}

          {job.skills.length > 0 ? (
            <section className="ham-employer__card ham-employer-job__panel">
              <h2>{t("requirementsTitle")}</h2>
              <ul className="ham-employer-job__reqs">
                {job.skills.map((skill) => (
                  <li key={skill.skillId}>
                    <Check className="size-4" aria-hidden />
                    <span>{skill.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="ham-employer__card ham-employer-job__panel">
            <h2>{t("recentApplicantsTitle")}</h2>
            {recentQ.isPending && !recentQ.data ? (
              <div className="ham-employer-job__people">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="ham-employer__skel h-16 rounded-[var(--emp-radius-lg)]"
                  />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <p className="text-sm text-[var(--emp-muted)]">
                {t("noApplicantsYet")}
              </p>
            ) : (
              <>
                <div className="ham-employer-job__people">
                  {recent.map((app) => {
                    const name = displayWorkerName(
                      app.employee.fullName,
                      t("unnamedApplicant"),
                    );
                    return (
                      <div key={app.id} className="ham-employer-job__person">
                        <span className="ham-employer-job__avatar" aria-hidden>
                          {workerInitials(app.employee.fullName)}
                        </span>
                        <p className="ham-employer-job__person-name">{name}</p>
                        <Link
                          href={`/employer/jobs/${jobId}/applicants`}
                          className="ham-employer__btn ham-employer__btn--secondary ham-employer-job__view"
                        >
                          {t("view")}
                        </Link>
                      </div>
                    );
                  })}
                </div>
                {recentMeta && recentMeta.total > RECENT_PAGE_SIZE ? (
                  <div className="ham-employer-job__pager">
                    <PaginationControls
                      page={appsPage}
                      hasPrevious={appsPage > 1}
                      hasNext={appsPage < recentPages}
                      onPrevious={() => setAppsPage((p) => p - 1)}
                      onNext={() => setAppsPage((p) => p + 1)}
                    />
                  </div>
                ) : null}
              </>
            )}
          </section>
        </div>

        <div className="ham-employer-job__stack">
          {pay ? (
            <dl className="ham-employer__card ham-employer-job__fact">
              <dt>{t("compensationLabel")}</dt>
              <dd>{pay}</dd>
            </dl>
          ) : null}
          <dl className="ham-employer__card ham-employer-job__fact">
            <dt>{t("jobTypeFact")}</dt>
            <dd>{t(`jobType.${job.jobType}` as "jobType.FULL_TIME")}</dd>
          </dl>
          {location ? (
            <dl className="ham-employer__card ham-employer-job__fact">
              <dt>{t("locationFact")}</dt>
              <dd>{location}</dd>
            </dl>
          ) : null}
        </div>
      </div>

      <EmployerMembershipRequiredDialog
        open={membershipOpen}
        onOpenChange={setMembershipOpen}
        amountPaise={amountPaise}
      />
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={t("confirmClose")}
        pending={closeMut.isPending}
        onConfirm={() => {
          if (closeMut.isPending) return;
          closeMut.mutate();
        }}
      />
    </div>
  );
}
