"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationControls } from "@/components/shared/pagination";
import {
  StatusBadge,
  useBffErrorMessage,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import type { CatalogItem, EmployerJob } from "@/types/ham";

const JOB_STATUSES = ["", "DRAFT", "PUBLISHED", "UNPUBLISHED", "CLOSED"] as const;

export function EmployerJobsList() {
  const t = useTranslations("employer");
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");

  const districtsQ = useQuery({
    queryKey: ["geo-districts"],
    queryFn: () => bffJson<CatalogItem[]>(proxyPath("geo/districts")),
  });

  const districtName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of districtsQ.data ?? []) map.set(d.id, d.name);
    return map;
  }, [districtsQ.data]);

  const listQ = useQuery({
    queryKey: ["employer-jobs", page, status],
    queryFn: () =>
      bffEnvelope<EmployerJob[], OffsetMeta>(
        proxyPath("employer/jobs", {
          page,
          limit: 20,
          ...(status ? { status } : {}),
        }),
      ),
  });

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) return <ErrorState onRetry={() => void listQ.refetch()} />;

  const jobs = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-5">
      <EmployerPageHeader
        title={t("jobsTitle")}
        subtitle={t("jobsSubtitle")}
        actions={
          <Button asChild>
            <Link href="/employer/jobs/new">{t("postJob")}</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm font-medium" htmlFor="job-status-filter">
          {t("filterStatus")}
        </label>
        <select
          id="job-status-filter"
          className="h-10 rounded-md border border-input bg-white px-3 text-sm"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          {JOB_STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s ? t(`status.${s}` as "status.DRAFT") : t("filterAll")}
            </option>
          ))}
        </select>
      </div>

      {jobs.length === 0 ? (
        <div className="ham-employer__panel space-y-3">
          <EmptyState title={t("noJobsYet")} description={t("noJobsHint")} />
          <Button asChild>
            <Link href="/employer/jobs/new">{t("postJob")}</Link>
          </Button>
        </div>
      ) : (
        <div className="ham-employer__table-wrap">
          <table className="ham-employer__table">
            <thead>
              <tr>
                <th>{t("title")}</th>
                <th>{t("location")}</th>
                <th>{t("statusLabel")}</th>
                <th>{t("updated")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link
                      href={`/employer/jobs/${job.id}`}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--emp-muted)]">
                      {t(`jobType.${job.jobType}` as "jobType.FULL_TIME")}
                    </p>
                  </td>
                  <td>
                    {districtName.get(job.districtId) ?? job.districtId}
                  </td>
                  <td>
                    <StatusBadge
                      status={job.status}
                      label={t(`status.${job.status}` as "status.DRAFT")}
                    />
                  </td>
                  <td className="whitespace-nowrap text-[var(--emp-muted)]">
                    {new Date(job.updatedAt).toLocaleDateString()}
                  </td>
                  <td>
                    <JobRowActions job={job} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
      <div className="flex flex-wrap gap-2 text-xs font-medium">
        <Link href={`/employer/jobs/${job.id}`} className="underline">
          {t("view")}
        </Link>
        {job.status !== "CLOSED" ? (
          <Link href={`/employer/jobs/${job.id}/edit`} className="underline">
            {t("editJob")}
          </Link>
        ) : null}
        <Link
          href={`/employer/jobs/${job.id}/applicants`}
          className="underline"
        >
          {t("applicants")}
        </Link>
        {job.status === "DRAFT" || job.status === "UNPUBLISHED" ? (
          <button
            type="button"
            className="underline"
            disabled={publishMut.isPending}
            onClick={() => publishMut.mutate()}
          >
            {t("publish")}
          </button>
        ) : null}
        {job.status !== "CLOSED" ? (
          <button
            type="button"
            className="underline text-destructive"
            onClick={() => setCloseOpen(true)}
          >
            {t("close")}
          </button>
        ) : null}
      </div>
      {msg ? <p className="text-xs text-destructive">{msg}</p> : null}
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