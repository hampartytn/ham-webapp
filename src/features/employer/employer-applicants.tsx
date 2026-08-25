"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmployerDetailDrawer } from "@/components/employer/employer-detail-drawer";
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
import type { ApplicantItem, CatalogItem, EmployerJob } from "@/types/ham";

const APP_STATUSES = [
  "",
  "SUBMITTED",
  "VIEWED",
  "SHORTLISTED",
  "REJECTED",
  "WITHDRAWN",
  "HIRED",
] as const;

const UPDATE_STATUSES = ["VIEWED", "SHORTLISTED", "REJECTED", "HIRED"] as const;

export function EmployerApplicantsHub({
  initialJobId,
}: {
  initialJobId?: string;
}) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [jobIdOverride, setJobIdOverride] = useState<string | null>(
    initialJobId ?? null,
  );
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ApplicantItem | null>(null);
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
  const jobId =
    jobIdOverride ??
    (initialJobId && jobs.some((j) => j.id === initialJobId)
      ? initialJobId
      : (jobs[0]?.id ?? ""));
  const selectedJob = jobs.find((j) => j.id === jobId);

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
    queryKey: ["applicants", jobId, page, status],
    enabled: Boolean(jobId),
    queryFn: () =>
      bffEnvelope<ApplicantItem[], OffsetMeta>(
        proxyPath(`employer/jobs/${jobId}/applications`, {
          page,
          limit: 20,
          ...(status ? { status } : {}),
        }),
      ),
  });

  const statusMut = useMutation({
    mutationFn: ({
      applicationId,
      nextStatus,
    }: {
      applicationId: string;
      nextStatus: string;
    }) =>
      bffJson(
        proxyPath(`employer/jobs/${jobId}/applications/${applicationId}`),
        {
          method: "PATCH",
          body: JSON.stringify({ status: nextStatus }),
        },
      ),
    onSuccess: async () => {
      setPendingStatus(null);
      setSelected(null);
      await qc.invalidateQueries({ queryKey: ["applicants", jobId] });
    },
    onError: (e) => {
      setPendingStatus(null);
      setMsg(errMsg(e));
    },
  });

  if (jobsQ.isLoading) return <LoadingState />;
  if (jobsQ.error) return <ErrorState onRetry={() => void jobsQ.refetch()} />;

  if (jobs.length === 0) {
    return (
      <div className="space-y-4">
        <EmployerPageHeader title={t("applicants")} subtitle={t("applicantsSubtitle")} />
        <div className="ham-employer__panel space-y-3">
          <EmptyState title={t("noJobsYet")} description={t("applicantsNeedJobs")} />
          <Button asChild>
            <Link href="/employer/jobs/new">{t("postJob")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  function requestStatusChange(next: string) {
    if (!selected) return;
    if (next === "REJECTED" || next === "HIRED") {
      setPendingStatus(next);
      return;
    }
    statusMut.mutate({ applicationId: selected.id, nextStatus: next });
  }

  return (
    <div className="space-y-5">
      <EmployerPageHeader
        title={t("applicants")}
        subtitle={t("applicantsSubtitle")}
      />
      <p className="text-sm text-[var(--emp-muted)]">{t("privacyNote")}</p>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="applicant-job">
            {t("filterJob")}
          </label>
          <select
            id="applicant-job"
            className="h-10 min-w-[12rem] rounded-md border border-input bg-white px-3 text-sm"
            value={jobId}
            onChange={(e) => {
              setJobIdOverride(e.target.value);
              setPage(1);
              setSelected(null);
            }}
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="applicant-status">
            {t("filterStatus")}
          </label>
          <select
            id="applicant-status"
            className="h-10 rounded-md border border-input bg-white px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            {APP_STATUSES.map((s) => (
              <option key={s || "all"} value={s}>
                {s ? t(`appStatus.${s}` as "appStatus.SUBMITTED") : t("filterAll")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

      {listQ.isLoading ? (
        <LoadingState />
      ) : listQ.error ? (
        <ErrorState onRetry={() => void listQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={t("noApplicantsYet")} />
      ) : (
        <div className="ham-employer__table-wrap">
          <table className="ham-employer__table">
            <thead>
              <tr>
                <th>{t("applicantName")}</th>
                <th>{t("appliedJob")}</th>
                <th>{t("skills")}</th>
                <th>{t("statusLabel")}</th>
                <th>{t("appliedOn")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer hover:bg-[var(--emp-soft)]"
                  onClick={() => setSelected(a)}
                >
                  <td className="font-medium">
                    {a.employee.fullName ?? a.employee.id}
                  </td>
                  <td>{selectedJob?.title ?? "—"}</td>
                  <td>
                    <div className="flex max-w-[14rem] flex-wrap gap-1">
                      {a.employee.skills.slice(0, 3).map((s) => (
                        <span
                          key={s.skillId}
                          className="rounded bg-[var(--emp-soft)] px-2 py-0.5 text-xs"
                        >
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <StatusBadge
                      status={a.status}
                      label={t(`appStatus.${a.status}` as "appStatus.SUBMITTED")}
                    />
                  </td>
                  <td className="whitespace-nowrap text-[var(--emp-muted)]">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && items.length > 0 ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}

      <EmployerDetailDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.employee.fullName ?? t("applicantDetail")}
        description={selectedJob?.title}
        footer={
          selected &&
          selected.status !== "WITHDRAWN" &&
          selected.status !== "HIRED" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="update-status">
                {t("updateStatus")}
              </label>
              <select
                id="update-status"
                className="h-10 w-full rounded-md border border-input px-3 text-sm"
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
          <div className="space-y-4 text-sm">
            <div>
              <StatusBadge
                status={selected.status}
                label={t(`appStatus.${selected.status}` as "appStatus.SUBMITTED")}
              />
            </div>
            <div>
              <p className="font-medium">{t("skills")}</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {selected.employee.skills.map((s) => (
                  <li
                    key={s.skillId}
                    className="rounded bg-[var(--emp-soft)] px-2 py-0.5 text-xs"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
            {selected.employee.districtId ? (
              <p>
                <span className="font-medium">{t("district")}: </span>
                {districtName.get(selected.employee.districtId) ??
                  selected.employee.districtId}
              </p>
            ) : null}
            {selected.employee.availabilityStatus ? (
              <p>
                <span className="font-medium">{t("availabilityLabel")}: </span>
                {t(
                  `availability.${selected.employee.availabilityStatus}` as "availability.AVAILABLE",
                )}
              </p>
            ) : null}
            {selected.coverNote ? (
              <div>
                <p className="font-medium">{t("coverNote")}</p>
                <p className="mt-1 whitespace-pre-wrap text-[var(--emp-muted)]">
                  {selected.coverNote}
                </p>
              </div>
            ) : null}
            <p className="text-[var(--emp-muted)]">
              {t("appliedOn")}: {new Date(selected.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-[var(--emp-muted)]">{t("privacyNote")}</p>
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
            applicationId: selected.id,
            nextStatus: pendingStatus,
          });
        }}
      />
    </div>
  );
}

/** Deep-link wrapper for /employer/jobs/[jobId]/applicants */
export function EmployerApplicants({ jobId }: { jobId: string }) {
  return <EmployerApplicantsHub initialJobId={jobId} />;
}
