"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  formatPaise,
  useBffErrorMessage,
} from "@/components/shared/status-badge";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { PublicJob } from "@/types/ham";

export function EmployeeJobDetail({ jobId }: { jobId: string }) {
  const t = useTranslations("employee");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [coverNote, setCoverNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const jobQ = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => bffJson<PublicJob>(proxyPath(`jobs/${jobId}`)),
  });

  const applyMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("applications"), {
        method: "POST",
        body: JSON.stringify({
          jobId,
          coverNote: coverNote || undefined,
        }),
      }),
    onSuccess: async () => {
      setMessage(t("applied"));
      await qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e) => setMessage(errMsg(e)),
  });

  if (jobQ.isLoading) return <LoadingState />;
  if (jobQ.error || !jobQ.data) {
    return <ErrorState onRetry={() => void jobQ.refetch()} />;
  }

  const job = jobQ.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">{job.title}</h1>
      <p className="whitespace-pre-wrap text-sm">{job.description}</p>
      <p className="text-sm text-muted-foreground">
        {t("organization")}: {job.organization.name}
      </p>
      <p className="text-sm">{t("vacancies", { count: job.vacancies })}</p>
      <p className="text-sm">
        {t("wage")}: {formatPaise(job.wageMinPaise)}
        {job.wageMaxPaise != null ? ` – ${formatPaise(job.wageMaxPaise)}` : ""}
      </p>
      <ul className="flex flex-wrap gap-2 text-xs">
        {job.skills.map((s) => (
          <li key={s.skillId} className="rounded-md bg-secondary px-2 py-1">
            {s.name}
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <label className="text-sm font-medium">{t("coverNote")}</label>
        <textarea
          className="min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm"
          value={coverNote}
          onChange={(e) => setCoverNote(e.target.value)}
        />
        <Button
          type="button"
          disabled={applyMut.isPending}
          onClick={() => applyMut.mutate()}
        >
          {t("apply")}
        </Button>
        {message ? <p className="text-sm">{message}</p> : null}
      </div>
    </div>
  );
}
