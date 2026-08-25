"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  StatusBadge,
  useBffErrorMessage,
} from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { CatalogItem, EmployerJob } from "@/types/ham";

export function EmployerJobDetail({ jobId }: { jobId: string }) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const jobQ = useQuery({
    queryKey: ["employer-job", jobId],
    queryFn: () => bffJson<EmployerJob>(proxyPath(`employer/jobs/${jobId}`)),
  });

  const districtsQ = useQuery({
    queryKey: ["geo-districts"],
    queryFn: () => bffJson<CatalogItem[]>(proxyPath("geo/districts")),
  });

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

  if (jobQ.isLoading) return <LoadingState />;
  if (jobQ.error || !jobQ.data) {
    return <ErrorState onRetry={() => void jobQ.refetch()} />;
  }
  const job = jobQ.data;

  return (
    <div className="space-y-5">
      <EmployerPageHeader
        title={job.title}
        subtitle={t(`jobType.${job.jobType}` as "jobType.FULL_TIME")}
        actions={
          <div className="flex flex-wrap gap-2">
            {job.status !== "CLOSED" ? (
              <Button asChild variant="outline">
                <Link href={`/employer/jobs/${jobId}/edit`}>{t("editJob")}</Link>
              </Button>
            ) : null}
            {job.status === "DRAFT" || job.status === "UNPUBLISHED" ? (
              <Button
                type="button"
                onClick={() => publishMut.mutate()}
                disabled={publishMut.isPending}
              >
                {t("publish")}
              </Button>
            ) : null}
            {job.status !== "CLOSED" ? (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setCloseOpen(true)}
              >
                {t("close")}
              </Button>
            ) : null}
            <Button asChild variant="outline">
              <Link href={`/employer/jobs/${jobId}/applicants`}>
                {t("applicants")}
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={job.status} label={t(`status.${job.status}` as "status.DRAFT")} />
        <span className="text-sm text-[var(--emp-muted)]">
          {districtName.get(job.districtId) ?? job.districtId}
        </span>
        <span className="text-sm text-[var(--emp-muted)]">
          · {t("vacancies")}: {job.vacancies}
        </span>
      </div>

      <section className="ham-employer__panel space-y-3">
        <h2 className="text-base font-semibold">{t("description")}</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed">
          {job.description}
        </p>
      </section>

      {job.skills.length > 0 ? (
        <section className="ham-employer__panel space-y-3">
          <h2 className="text-base font-semibold">{t("skills")}</h2>
          <ul className="flex flex-wrap gap-2">
            {job.skills.map((s) => (
              <li
                key={s.skillId}
                className="rounded-full bg-[var(--emp-soft)] px-3 py-1 text-xs font-medium"
              >
                {s.name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {(job.wageMinPaise != null || job.wageMaxPaise != null) && (
        <section className="ham-employer__panel text-sm">
          <h2 className="mb-2 text-base font-semibold">{t("sectionCompensation")}</h2>
          <p>
            {job.wageMinPaise != null
              ? `₹${Math.round(job.wageMinPaise / 100)}`
              : "—"}
            {" – "}
            {job.wageMaxPaise != null
              ? `₹${Math.round(job.wageMaxPaise / 100)}`
              : "—"}
            {job.wagePeriod
              ? ` / ${t(`wagePeriodLabel.${job.wagePeriod}` as "wagePeriodLabel.DAY")}`
              : ""}
          </p>
        </section>
      )}

      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

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
