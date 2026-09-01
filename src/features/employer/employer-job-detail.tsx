"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Calendar,
  Clock,
  MapPin,
  Pencil,
  Users,
  XCircle,
  PauseCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { formatPaise, useBffErrorMessage } from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions } from "@/lib/query/catalog";
import { displayWorkerName, formatRelativeTime, workerInitials } from "@/features/employer/dashboard-utils";
import { cn } from "@/lib/utils";
import type { ApplicantItem, EmployerJob } from "@/types/ham";

export function EmployerJobDetail({ jobId }: { jobId: string }) {
  const t = useTranslations("employer");
  const locale = useLocale();
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const jobQ = useQuery({
    queryKey: ["employer-job", jobId],
    queryFn: () => bffJson<EmployerJob>(proxyPath(`employer/jobs/${jobId}`)),
  });

  const appsQ = useQuery({
    queryKey: ["applicants", jobId, 1, ""],
    queryFn: () =>
      bffEnvelope<ApplicantItem[], OffsetMeta>(
        proxyPath(`employer/jobs/${jobId}/applications`, { page: 1, limit: 20 }),
      ),
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
    onError: (e) => setMsg(errMsg(e)),
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
      <div className="space-y-5">
        <h1 className="text-[2rem] font-bold">{t("jobsTitle")}</h1>
        <LoadingState />
      </div>
    );
  }
  if (jobQ.error || !jobQ.data) {
    return (
      <div className="space-y-5">
        <h1 className="text-[2rem] font-bold">{t("jobsTitle")}</h1>
        <ErrorState onRetry={() => void jobQ.refetch()} />
      </div>
    );
  }

  const job = jobQ.data;
  const apps = appsQ.data?.data ?? [];
  const totalApps = appsQ.data?.meta?.total ?? apps.length;
  const hired = apps.filter((a) => a.status === "HIRED").length;
  const shortlisted = apps.filter((a) => a.status === "SHORTLISTED").length;
  const fillPct = job.vacancies
    ? Math.min(100, Math.round((hired / job.vacancies) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <nav className="text-sm text-[var(--emp-muted)]">
        <Link href="/employer/jobs" className="hover:text-[var(--emp-primary)]">
          {t("jobsTitle")}
        </Link>
        <span> / </span>
        <span className="text-[var(--emp-ink)]">{job.title}</span>
      </nav>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[2rem] font-bold leading-10">{job.title}</h1>
            <span
              className={cn(
                "ham-employer__pill",
                job.status === "PUBLISHED"
                  ? "ham-employer__pill--success"
                  : "ham-employer__pill--muted",
              )}
            >
              {job.status === "PUBLISHED"
                ? t("statusActive")
                : t(`status.${job.status}` as "status.DRAFT")}
            </span>
          </div>
          <p className="mt-2 flex flex-wrap gap-4 text-sm text-[var(--emp-muted)]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-4" />
              {districtName.get(job.districtId) ?? "—"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="size-4" />
              {t("postedOn", {
                date: new Date(job.publishedAt ?? job.createdAt).toLocaleDateString(locale),
              })}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-xs">
              # {job.id.slice(0, 8)}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="ham-employer__card p-4">
              <p className="text-sm text-[var(--emp-muted)]">{t("hourlyWage")}</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-bold">
                <Banknote className="size-5 text-[var(--emp-primary)]" />
                {formatPaise(job.wageMinPaise)}
                {job.wagePeriod
                  ? ` / ${t(`wagePeriodLabel.${job.wagePeriod}` as "wagePeriodLabel.DAY")}`
                  : ""}
              </p>
            </div>
            <div className="ham-employer__card p-4">
              <p className="text-sm text-[var(--emp-muted)]">{t("workersRequired")}</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-bold">
                <Users className="size-5 text-[var(--emp-primary)]" />
                {job.vacancies}
              </p>
              <p className="mt-1 text-sm text-[var(--emp-success)]">
                {t("filledCount", { count: hired })}
              </p>
            </div>
            <div className="ham-employer__card p-4">
              <p className="text-sm text-[var(--emp-muted)]">{t("jobTypeLabel")}</p>
              <p className="mt-1 flex items-center gap-2 text-xl font-bold">
                <Clock className="size-5 text-[var(--emp-primary)]" />
                {t(`jobType.${job.jobType}` as "jobType.FULL_TIME")}
              </p>
            </div>
          </div>

          {(() => {
            const facilityLabels = [
              t("facilityTransport"),
              t("facilityFood"),
              t("facilityMedical"),
            ];
            const found = facilityLabels.filter((label) =>
              job.description.includes(label),
            );
            if (found.length === 0) return null;
            return (
              <section className="ham-employer__card p-6">
                <h2 className="mb-4 text-lg font-semibold">{t("facilitiesProvided")}</h2>
                <ul className="flex flex-wrap gap-2">
                  {found.map((label) => (
                    <li
                      key={label}
                      className="rounded-full border border-[var(--emp-border)] px-3 py-1 text-sm"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })()}

          <section className="ham-employer__card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("jobRequirements")}</h2>
            {job.skills.length === 0 ? (
              <p className="text-sm text-[var(--emp-muted)]">{t("noSkillsListed")}</p>
            ) : (
              <ul className="space-y-3">
                {job.skills.map((s) => (
                  <li key={s.skillId} className="flex items-start gap-2 text-sm">
                    <span className="mt-0.5 flex size-5 items-center justify-center rounded-full bg-[var(--emp-success-soft)] text-[var(--emp-success)]">
                      ✓
                    </span>
                    {s.name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="ham-employer__card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("arrivalInstructions")}</h2>
            <div className="rounded-lg bg-[var(--emp-soft)] p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {job.description}
            </div>
          </section>

          <section className="ham-employer__card p-6">
            <h2 className="mb-4 text-lg font-semibold">{t("recentApplicants")}</h2>
            {appsQ.isPending && !appsQ.data ? (
              <LoadingState />
            ) : apps.length === 0 ? (
              <p className="text-sm text-[var(--emp-muted)]">{t("noApplicantsYet")}</p>
            ) : (
              <ul className="divide-y divide-[var(--emp-border)]">
                {apps.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/employer/jobs/${jobId}/applicants`}
                      className="flex items-center gap-3 py-3 hover:bg-[var(--emp-soft)]"
                    >
                      <span className="flex size-10 items-center justify-center rounded-full bg-[var(--emp-primary-light)] text-sm font-semibold text-[var(--emp-primary-dark)]">
                        {workerInitials(a.employee.fullName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          {displayWorkerName(a.employee.fullName, t("unnamedApplicant"))}
                        </p>
                        <p className="text-sm text-[var(--emp-muted)]">
                          {formatRelativeTime(a.createdAt, locale)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "ham-employer__pill",
                          a.status === "SHORTLISTED" || a.status === "HIRED"
                            ? "ham-employer__pill--success"
                            : a.status === "SUBMITTED"
                              ? "ham-employer__pill--muted"
                              : "ham-employer__pill--info",
                        )}
                      >
                        {t(`appStatus.${a.status}` as "appStatus.SUBMITTED")}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="ham-employer__card space-y-3 p-6">
            <h2 className="text-lg font-semibold">{t("manageJob")}</h2>
            {job.status !== "CLOSED" ? (
              <Link
                href={`/employer/jobs/${jobId}/edit`}
                className="ham-employer__btn ham-employer__btn--primary w-full"
              >
                <Pencil className="size-4" />
                {t("editJobDetails")}
              </Link>
            ) : null}
            {job.status === "DRAFT" || job.status === "UNPUBLISHED" ? (
              <button
                type="button"
                className="ham-employer__btn ham-employer__btn--secondary w-full"
                disabled={publishMut.isPending}
                onClick={() => publishMut.mutate()}
              >
                {t("publish")}
              </button>
            ) : null}
            {job.status === "PUBLISHED" ? (
              <button
                type="button"
                className="ham-employer__btn ham-employer__btn--secondary w-full"
                disabled
                title={t("pauseHiringUnavailable")}
              >
                <PauseCircle className="size-4" />
                {t("pauseHiring")}
              </button>
            ) : null}
            {job.status !== "CLOSED" ? (
              <button
                type="button"
                className="ham-employer__btn ham-employer__btn--danger w-full"
                disabled={closeMut.isPending}
                onClick={() => setCloseOpen(true)}
              >
                {closeMut.isPending ? <span className="ham-employer__spinner" /> : <XCircle className="size-4" />}
                {t("close")}
              </button>
            ) : null}
            {msg ? <p className="text-sm text-[var(--emp-error)]">{msg}</p> : null}
          </section>

          <section className="ham-employer__card p-6">
            <h2 className="text-lg font-semibold">{t("applicationStatus")}</h2>
            <p className="mt-3 text-2xl font-bold">
              {t("totalApplications", { count: totalApps })}
            </p>
            <div className="ham-employer__progress mt-3">
              <span style={{ width: `${fillPct}%`, background: "var(--emp-primary)" }} />
            </div>
            <p className="mt-3 text-sm text-[var(--emp-muted)]">
              {t("shortlistedCount", { count: shortlisted })} · {t("hiredCount", { count: hired })}
            </p>
            <Link
              href={`/employer/jobs/${jobId}/applicants`}
              className="mt-4 inline-block text-sm font-semibold text-[var(--emp-primary)] hover:underline"
            >
              {t("viewAllApplicantsArrow")}
            </Link>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={t("confirmClose")}
        pending={closeMut.isPending}
        onConfirm={() => closeMut.mutate()}
      />
    </div>
  );
}
