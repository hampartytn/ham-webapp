"use client";

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Mail, Search } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmployerBadge, appBadgeTone } from "@/components/employer/employer-badge";
import { EmployerDetailDrawer } from "@/components/employer/employer-detail-drawer";
import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions, skillsQueryOptions } from "@/lib/query/catalog";
import { ApplicationStatusChart } from "@/features/employer/charts/application-status-chart";
import {
  applicationStatusCounts,
  displayWorkerName,
  formatRelativeTime,
  workerInitials,
} from "@/features/employer/dashboard-utils";
import { cn } from "@/lib/utils";
import type { ApplicantItem, EmployerJob } from "@/types/ham";

const TABS = ["", "SUBMITTED", "SHORTLISTED", "HIRED", "REJECTED"] as const;
const UPDATE_STATUSES = ["VIEWED", "SHORTLISTED", "REJECTED", "HIRED"] as const;

type Row = { application: ApplicantItem; job: EmployerJob };

export function EmployerApplicantsHub({
  initialJobId,
}: {
  initialJobId?: string;
}) {
  const t = useTranslations("employer");
  const locale = useLocale();
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [tab, setTab] = useState<string>(initialJobId ? "" : "SUBMITTED");
  const [jobFilter, setJobFilter] = useState(initialJobId ?? "");
  const [skillFilter, setSkillFilter] = useState("");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(8);
  const [selected, setSelected] = useState<Row | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const jobsQ = useQuery({
    queryKey: ["employer-jobs", "applicants-hub"],
    queryFn: () =>
      bffEnvelope<EmployerJob[], OffsetMeta>(
        proxyPath("employer/jobs", { page: 1, limit: 50 }),
      ),
  });

  const jobs = useMemo(() => jobsQ.data?.data ?? [], [jobsQ.data?.data]);
  const targetJobs = jobFilter ? jobs.filter((j) => j.id === jobFilter) : jobs;

  const appQueries = useQueries({
    queries: targetJobs.map((job) => ({
      queryKey: ["applicants", job.id, 1, "hub"],
      enabled: Boolean(job.id),
      placeholderData: keepPreviousData,
      queryFn: () =>
        bffEnvelope<ApplicantItem[], OffsetMeta>(
          proxyPath(`employer/jobs/${job.id}/applications`, {
            page: 1,
            limit: 50,
          }),
        ),
      staleTime: 20_000,
    })),
  });

  const rows: Row[] = [];
  appQueries.forEach((query, i) => {
    const job = targetJobs[i];
    if (!job || !query.data?.data) return;
    for (const application of query.data.data) {
      rows.push({ application, job });
    }
  });
  rows.sort(
    (a, b) =>
      new Date(b.application.createdAt).getTime() -
      new Date(a.application.createdAt).getTime(),
  );

  const filtered = rows.filter((row) => {
    if (tab && row.application.status !== tab) return false;
    if (tab === "SUBMITTED" && row.application.status !== "SUBMITTED") return false;
    const name = row.application.employee.fullName ?? "";
    if (q && !name.toLowerCase().includes(q.toLowerCase()) && !row.job.title.toLowerCase().includes(q.toLowerCase())) {
      return false;
    }
    if (
      skillFilter &&
      !row.application.employee.skills.some((s) => s.skillId === skillFilter)
    ) {
      return false;
    }
    return true;
  });

  const counts = {
    SUBMITTED: rows.filter((r) => r.application.status === "SUBMITTED").length,
    SHORTLISTED: rows.filter((r) => r.application.status === "SHORTLISTED").length,
    HIRED: rows.filter((r) => r.application.status === "HIRED").length,
  };
  const statusMix = applicationStatusCounts(
    rows.map((r) => r.application.status),
  );
  const appsFailed =
    targetJobs.length > 0 &&
    appQueries.every((q) => Boolean(q.error) && !q.data);
  const retryApps = () => {
    appQueries.forEach((q) => {
      void q.refetch();
    });
  };

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const skillsQ = useQuery(skillsQueryOptions);
  const districtName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of districtsQ.data ?? []) map.set(d.id, d.name);
    return map;
  }, [districtsQ.data]);

  const statusMut = useMutation({
    mutationFn: ({
      jobId,
      applicationId,
      nextStatus,
    }: {
      jobId: string;
      applicationId: string;
      nextStatus: string;
    }) =>
      bffJson(proxyPath(`employer/jobs/${jobId}/applications/${applicationId}`), {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      }),
    onSuccess: async () => {
      setPendingStatus(null);
      setSelected(null);
      await qc.invalidateQueries({ queryKey: ["applicants"] });
    },
    onError: (e) => {
      setPendingStatus(null);
      setMsg(errMsg(e));
    },
  });

  const appsPending = targetJobs.length > 0 && appQueries.some((q) => q.isPending && !q.data);

  function requestStatusChange(next: string) {
    if (!selected) return;
    if (next === "REJECTED" || next === "HIRED") {
      setPendingStatus(next);
      return;
    }
    statusMut.mutate({
      jobId: selected.job.id,
      applicationId: selected.application.id,
      nextStatus: next,
    });
  }

  return (
    <div className="space-y-8">
      <EmployerPageHeader
        title={t("applicationsOverviewTitle")}
        subtitle={t("applicationsOverviewSubtitle")}
      />

      {jobsQ.error ? (
        <ErrorState onRetry={() => void jobsQ.refetch()} />
      ) : !jobsQ.isPending && jobs.length === 0 ? (
        <div className="ham-employer__card space-y-3 p-8">
          <EmptyState title={t("noJobsYet")} description={t("applicantsNeedJobs")} />
          <Button asChild>
            <Link href="/employer/jobs/new">{t("postJob")}</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="max-w-md">
            <ApplicationStatusChart
              title={t("applicationStatusMix")}
              emptyMessage={t("applicationsTrendEmpty")}
              errorMessage={t("chartLoadError")}
              retryLabel={t("chartRetry")}
              counts={statusMix}
              labels={{
                SUBMITTED: t("appStatus.SUBMITTED"),
                VIEWED: t("appStatus.VIEWED"),
                SHORTLISTED: t("appStatus.SHORTLISTED"),
                HIRED: t("appStatus.HIRED"),
                REJECTED: t("appStatus.REJECTED"),
                WITHDRAWN: t("appStatus.WITHDRAWN"),
              }}
              loading={jobsQ.isPending || appsPending}
              error={appsFailed}
              onRetry={retryApps}
              summary={t("applicationStatusMixAria", {
                total: rows.length,
              })}
            />
          </div>
          <div className="overflow-x-auto border-b border-[var(--emp-border)]">
            <nav className="flex min-w-max gap-6">
              {TABS.map((value) => {
                const active = tab === value;
                const label =
                  value === ""
                    ? t("tabAllApplications")
                    : value === "SUBMITTED"
                      ? t("tabNew")
                      : t(`appStatus.${value}` as "appStatus.SHORTLISTED");
                const badge =
                  value === "SUBMITTED"
                    ? counts.SUBMITTED
                    : value === "SHORTLISTED"
                      ? counts.SHORTLISTED
                      : value === "HIRED"
                        ? counts.HIRED
                        : null;
                return (
                  <button
                    key={value || "all"}
                    type="button"
                    className={cn(
                      "whitespace-nowrap border-b-2 py-4 text-lg",
                      active
                        ? "border-[var(--emp-primary)] font-semibold text-[var(--emp-primary)]"
                        : "border-transparent text-[var(--emp-muted)] hover:text-[var(--emp-primary)]",
                    )}
                    onClick={() => setTab(value)}
                  >
                    {label}
                    {badge != null ? (
                      <span
                        className={cn(
                          "ms-2 rounded-full px-2 py-0.5 text-xs font-semibold",
                          active
                            ? "bg-[var(--emp-primary-light)] text-[var(--emp-primary-dark)]"
                            : "bg-[var(--emp-soft)]",
                        )}
                      >
                        {badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="ham-employer__card flex flex-col gap-3 p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--emp-muted)]" />
              <input
                className="ham-employer__input pl-9"
                placeholder={t("searchByName")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <select
              className="ham-employer__input sm:w-56"
              value={jobFilter}
              onChange={(e) => setJobFilter(e.target.value)}
            >
              <option value="">{t("filterByJob")}</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
            <select
              className="ham-employer__input sm:w-56"
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
            >
              <option value="">{t("filterBySkill")}</option>
              {(skillsQ.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {msg ? <p className="text-sm text-[var(--emp-error)]">{msg}</p> : null}

          {(jobsQ.isPending && !jobsQ.data) || appsPending ? (
            <LoadingState />
          ) : filtered.length === 0 ? (
            <EmptyState title={t("noApplicantsYet")} />
          ) : (
            <>
            <ul className="space-y-4">
              {filtered.slice(0, visible).map((row) => {
                const a = row.application;
                const canHire =
                  a.status !== "HIRED" &&
                  a.status !== "REJECTED" &&
                  a.status !== "WITHDRAWN";
                const exp = a.employee.skills.find((s) => s.yearsExperience != null)
                  ?.yearsExperience;
                return (
                  <li key={a.id} className="ham-employer__card p-6 transition-shadow hover:shadow-md">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                      <div className="flex flex-1 items-center gap-6">
                        <span className="relative flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--emp-primary-light)] text-lg font-semibold text-[var(--emp-primary-dark)]">
                          {workerInitials(a.employee.fullName)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-lg font-semibold">
                              {displayWorkerName(a.employee.fullName, t("unnamedApplicant"))}
                            </h3>
                            <EmployerBadge tone={appBadgeTone(a.status)}>
                              {a.status === "SUBMITTED"
                                ? t("tabNew")
                                : a.status === "VIEWED"
                                  ? t("inReview")
                                  : t(`appStatus.${a.status}` as "appStatus.SUBMITTED")}
                            </EmployerBadge>
                          </div>
                          <p className="text-sm font-medium text-[var(--emp-muted)]">
                            {t("appliedFor", { job: row.job.title })}
                          </p>
                          <p className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--emp-muted)]">
                            {exp != null ? <span>{t("yearsExp", { count: exp })}</span> : null}
                            {a.employee.districtId ? (
                              <span>{districtName.get(a.employee.districtId) ?? ""}</span>
                            ) : null}
                            <span>{formatRelativeTime(a.createdAt, locale)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-wrap gap-2">
                        {a.employee.skills.slice(0, 3).map((s) => (
                          <span
                            key={s.skillId}
                            className="rounded-full border border-[var(--emp-border)] bg-[var(--emp-soft)] px-3 py-1 text-xs uppercase tracking-wide"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--emp-border)] pt-4 lg:border-t-0 lg:pt-0">
                        <Link
                          href="/employer/messages"
                          className="ham-employer__btn ham-employer__btn--icon"
                          aria-label={t("navMessages")}
                          title={t("navMessages")}
                        >
                          <Mail className="size-5" />
                        </Link>
                        <button
                          type="button"
                          className="ham-employer__btn ham-employer__btn--secondary ham-employer__btn--sm"
                          onClick={() => setSelected(row)}
                        >
                          {t("viewProfile")}
                        </button>
                        {canHire && a.status !== "SHORTLISTED" ? (
                          <button
                            type="button"
                            className="ham-employer__btn ham-employer__btn--secondary ham-employer__btn--sm"
                            disabled={statusMut.isPending}
                            onClick={() => {
                              setSelected(row);
                              statusMut.mutate({
                                jobId: row.job.id,
                                applicationId: a.id,
                                nextStatus: "SHORTLISTED",
                              });
                            }}
                          >
                            {t("appStatus.SHORTLISTED")}
                          </button>
                        ) : null}
                        {canHire ? (
                          <button
                            type="button"
                            className="ham-employer__btn ham-employer__btn--primary ham-employer__btn--sm"
                            disabled={statusMut.isPending}
                            onClick={() => {
                              setSelected(row);
                              setPendingStatus("HIRED");
                            }}
                          >
                            {statusMut.isPending && pendingStatus === "HIRED" ? (
                              <span className="ham-employer__spinner" />
                            ) : null}
                            {t("hireWorker")}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            {filtered.length > visible ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  className="ham-employer__btn ham-employer__btn--ghost"
                  onClick={() => setVisible((n) => n + 8)}
                >
                  {t("loadMoreApplications")}
                  <ChevronRight className="size-4 rotate-90" />
                </button>
              </div>
            ) : null}
            </>
          )}
        </>
      )}

      <EmployerDetailDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={
          selected
            ? displayWorkerName(selected.application.employee.fullName, t("unnamedApplicant"))
            : t("applicantDetail")
        }
        description={selected?.job.title}
        footer={
          selected &&
          selected.application.status !== "WITHDRAWN" &&
          selected.application.status !== "HIRED" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="update-status">
                {t("updateStatus")}
              </label>
              <select
                id="update-status"
                className="ham-employer__input"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  requestStatusChange(e.target.value);
                  e.target.value = "";
                }}
              >
                <option value="">{t("updateStatus")}</option>
                {UPDATE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`appStatus.${s}`)}
                  </option>
                ))}
              </select>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3 text-sm">
            <p>{t(`appStatus.${selected.application.status}` as "appStatus.SUBMITTED")}</p>
            <p className="text-[var(--emp-muted)]">{t("privacyNote")}</p>
            {selected.application.coverNote ? (
              <p className="whitespace-pre-wrap">{selected.application.coverNote}</p>
            ) : null}
          </div>
        ) : null}
      </EmployerDetailDrawer>

      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onOpenChange={(open) => {
          if (!open) setPendingStatus(null);
        }}
        title={
          pendingStatus === "HIRED"
            ? t("confirmHire")
            : t("confirmReject")
        }
        pending={statusMut.isPending}
        onConfirm={() => {
          if (!selected || !pendingStatus) return;
          statusMut.mutate({
            jobId: selected.job.id,
            applicationId: selected.application.id,
            nextStatus: pendingStatus,
          });
        }}
      />
    </div>
  );
}

export function EmployerApplicants({ jobId }: { jobId: string }) {
  return <EmployerApplicantsHub initialJobId={jobId} />;
}
