"use client";

import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Eye, Filter, Pause, Pencil, Play, Plus, Search, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmployerBadge, jobBadgeTone } from "@/components/employer/employer-badge";
import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationControls } from "@/components/shared/pagination";
import { formatPaise, useBffErrorMessage } from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions } from "@/lib/query/catalog";
import { cn } from "@/lib/utils";
import type { ApplicantItem, EmployerJob } from "@/types/ham";

const TABS = ["", "PUBLISHED", "DRAFT", "UNPUBLISHED", "CLOSED"] as const;

export function EmployerJobsList() {
  const t = useTranslations("employer");
  const locale = useLocale();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const districtName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of districtsQ.data ?? []) map.set(d.id, d.name);
    return map;
  }, [districtsQ.data]);

  const listQ = useQuery({
    queryKey: ["employer-jobs", page, status],
    placeholderData: keepPreviousData,
    queryFn: () =>
      bffEnvelope<EmployerJob[], OffsetMeta>(
        proxyPath("employer/jobs", {
          page,
          limit: 20,
          ...(status ? { status } : {}),
        }),
      ),
  });

  const tabCountQueries = useQueries({
    queries: TABS.map((tab) => ({
      queryKey: ["employer-jobs", "tab-count", tab],
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      queryFn: () =>
        bffEnvelope<EmployerJob[], OffsetMeta>(
          proxyPath("employer/jobs", {
            page: 1,
            limit: 1,
            ...(tab ? { status: tab } : {}),
          }),
        ),
    })),
  });

  const jobs = (listQ.data?.data ?? []).filter((job) =>
    q.trim()
      ? job.title.toLowerCase().includes(q.trim().toLowerCase())
      : true,
  );
  const meta = listQ.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const appQueries = useQueries({
    queries: jobs.map((job) => ({
      queryKey: ["applicants", job.id, 1, "jobs-overview"],
      queryFn: () =>
        bffEnvelope<ApplicantItem[], OffsetMeta>(
          proxyPath(`employer/jobs/${job.id}/applications`, {
            page: 1,
            limit: 50,
          }),
        ),
      staleTime: 30_000,
    })),
  });

  const hiredByJob = new Map<string, number>();
  const appsByJob = new Map<string, number>();
  appQueries.forEach((qItem, i) => {
    const job = jobs[i];
    if (!job || !qItem.data) return;
    appsByJob.set(job.id, qItem.data.meta?.total ?? qItem.data.data.length);
    hiredByJob.set(
      job.id,
      qItem.data.data.filter((a) => a.status === "HIRED").length,
    );
  });

  const tabCount = (value: string) => {
    const idx = TABS.indexOf(value as (typeof TABS)[number]);
    const fromCounts = tabCountQueries[idx]?.data?.meta?.total;
    if (typeof fromCounts === "number") return fromCounts;
    if (value === status && typeof meta?.total === "number") return meta.total;
    return null;
  };

  return (
    <div className="space-y-8">
      <EmployerPageHeader
        title={t("jobsOverviewTitle")}
        subtitle={t("jobsOverviewSubtitle")}
        actions={
          <Link href="/employer/jobs/new" className="ham-employer__btn ham-employer__btn--primary">
            <Plus className="size-5" aria-hidden />
            {t("postNewJob")}
          </Link>
        }
      />

      <div className="ham-employer__card overflow-hidden">
        <div className="flex flex-wrap gap-1 border-b border-[var(--emp-border)] px-2 sm:px-6">
          {TABS.map((tab) => {
            const active = status === tab;
            const label =
              tab === ""
                ? t("tabAll")
                : tab === "UNPUBLISHED"
                  ? t("tabPaused")
                  : t(`status.${tab}` as "status.DRAFT");
            const count = tabCount(tab);
            return (
              <button
                key={tab || "all"}
                type="button"
                className={cn(
                  "border-b-2 px-4 py-4 text-base transition-colors",
                  active
                    ? "border-[var(--emp-primary)] font-bold text-[var(--emp-primary)]"
                    : "border-transparent text-[var(--emp-muted)] hover:text-[var(--emp-primary)]",
                )}
                onClick={() => {
                  setStatus(tab);
                  setPage(1);
                }}
              >
                {label}
                {count != null ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--emp-muted)]" />
            <input
              className="ham-employer__input pl-9"
              placeholder={t("filterJobsPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button type="button" className="ham-employer__btn ham-employer__btn--secondary">
            <Filter className="size-4" />
            {t("jobsFilters")}
          </button>
        </div>
      </div>

      <div className="ham-employer__card overflow-x-auto">
        {listQ.isPending && !listQ.data ? (
          <LoadingState />
        ) : listQ.error ? (
          <ErrorState onRetry={() => void listQ.refetch()} />
        ) : jobs.length === 0 ? (
          <div className="p-8">
            <EmptyState title={t("noJobsYet")} description={t("noJobsHint")} />
            <Link href="/employer/jobs/new" className="ham-employer__btn ham-employer__btn--primary mt-4">
              {t("postJob")}
            </Link>
          </div>
        ) : (
          <table className="ham-employer__table min-w-[800px]">
            <thead>
              <tr>
                <th className="w-1/3">{t("colJobDetails")}</th>
                <th>{t("colCompensation")}</th>
                <th>{t("colHiringProgress")}</th>
                <th>{t("statusLabel")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => {
                const hired = hiredByJob.get(job.id) ?? 0;
                const pct = job.vacancies
                  ? Math.min(100, Math.round((hired / job.vacancies) * 100))
                  : 0;
                const apps = appsByJob.get(job.id);
                return (
                  <tr key={job.id}>
                    <td>
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--emp-primary-light)] text-[var(--emp-primary)]">
                          <Briefcase className="size-5" aria-hidden />
                        </span>
                        <div>
                          <Link
                            href={`/employer/jobs/${job.id}`}
                            className="font-semibold hover:text-[var(--emp-primary)]"
                          >
                            {job.title}
                          </Link>
                          <p className="mt-0.5 text-sm text-[var(--emp-muted)]">
                            {t(`jobType.${job.jobType}` as "jobType.FULL_TIME")} ·{" "}
                            {districtName.get(job.districtId) ?? "—"}
                          </p>
                          <p className="text-xs text-[var(--emp-muted)]">
                            {t("postedOn", {
                              date: new Date(job.createdAt).toLocaleDateString(locale),
                            })}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className="font-semibold">{formatPaise(job.wageMinPaise)}</p>
                      <p className="text-sm text-[var(--emp-muted)]">
                        {job.wagePeriod
                          ? t(`wagePeriodLabel.${job.wagePeriod}` as "wagePeriodLabel.DAY")
                          : t(`jobType.${job.jobType}` as "jobType.FULL_TIME")}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm font-medium">
                        {t("filledOf", { filled: hired, total: job.vacancies })}{" "}
                        <span className="text-[var(--emp-muted)]">{pct}%</span>
                      </p>
                      <div className="ham-employer__progress mt-1 w-full max-w-[10rem]">
                        <span style={{ width: `${pct}%` }} />
                      </div>
                      <Link
                        href={`/employer/jobs/${job.id}/applicants`}
                        className="mt-1 inline-block text-sm text-[var(--emp-primary)] hover:underline"
                      >
                        {apps != null
                          ? t("applicationCount", { count: apps })
                          : t("applicants")}
                      </Link>
                    </td>
                    <td>
                      <EmployerBadge tone={jobBadgeTone(job.status)} dot>
                        {job.status === "PUBLISHED"
                          ? t("statusActive")
                          : job.status === "UNPUBLISHED"
                            ? t("tabPaused")
                            : t(`status.${job.status}` as "status.DRAFT")}
                      </EmployerBadge>
                    </td>
                    <td>
                      <JobRowActions job={job} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {meta && jobs.length > 0 ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
    </div>
  );
}

function JobRowActions({ job }: { job: EmployerJob }) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const publishMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${job.id}/publish`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["employer-jobs"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  const closeMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${job.id}/close`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      setCloseOpen(false);
      await qc.invalidateQueries({ queryKey: ["employer-jobs"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  return (
    <div className="space-y-1">
      <div className="ham-employer__row-actions">
        <Link
          href={`/employer/jobs/${job.id}`}
          className="ham-employer__btn ham-employer__btn--icon"
          title={t("view")}
        >
          <Eye className="size-5" />
        </Link>
        {job.status !== "CLOSED" ? (
          <Link
            href={`/employer/jobs/${job.id}/edit`}
            className="ham-employer__btn ham-employer__btn--icon"
            title={t("editJob")}
          >
            <Pencil className="size-5" />
          </Link>
        ) : null}
        {job.status === "PUBLISHED" ? (
          <span
            className="ham-employer__btn ham-employer__btn--icon opacity-50"
            title={t("pauseHiringUnavailable")}
          >
            <Pause className="size-5" />
          </span>
        ) : null}
        {job.status === "DRAFT" || job.status === "UNPUBLISHED" ? (
          <button
            type="button"
            className="ham-employer__btn ham-employer__btn--icon"
            title={t("publish")}
            disabled={publishMut.isPending}
            onClick={() => publishMut.mutate()}
          >
            {publishMut.isPending ? (
              <span className="ham-employer__spinner" />
            ) : (
              <Play className="size-5" />
            )}
          </button>
        ) : null}
        {job.status !== "CLOSED" ? (
          <button
            type="button"
            className="ham-employer__btn ham-employer__btn--icon text-[var(--emp-error)]"
            title={t("close")}
            onClick={() => setCloseOpen(true)}
          >
            {closeMut.isPending ? (
              <span className="ham-employer__spinner" />
            ) : (
              <XCircle className="size-5" />
            )}
          </button>
        ) : null}
      </div>
      {msg ? <p className="text-xs text-[var(--emp-error)]">{msg}</p> : null}
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
