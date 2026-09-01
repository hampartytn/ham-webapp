"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationControls } from "@/components/shared/pagination";
import { StatusBadge, useBffErrorMessage } from "@/components/shared/status-badge";
import {
  bffEnvelope,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import type { ApplicationItem } from "@/types/ham";

export function EmployeeApplicationsList() {
  const t = useTranslations("employee");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [withdrawId, setWithdrawId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["applications", page],
    placeholderData: keepPreviousData,
    queryFn: () =>
      bffEnvelope<ApplicationItem[], OffsetMeta>(
        proxyPath("applications", { page, limit: 20 }),
      ),
  });

  const withdrawMut = useMutation({
    mutationFn: (id: string) =>
      bffEnvelope(proxyPath(`applications/${id}/withdraw`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      setWithdrawId(null);
      await qc.invalidateQueries({ queryKey: ["applications"] });
    },
    onError: (e) => setError(errMsg(e)),
  });

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("myApplications")}</h1>
      {listQ.isPending && !listQ.data ? (
        <LoadingState />
      ) : listQ.error ? (
        <ErrorState onRetry={() => void listQ.refetch()} />
      ) : (
        <>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {items.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-4">
        {items.map((app) => (
          <li
            key={app.id}
            className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3"
          >
            <div>
              <p className="font-medium">{app.job.title}</p>
              <p className="text-sm text-muted-foreground">
                {app.job.organization.name}
              </p>
              <StatusBadge status={app.status} />
            </div>
            {app.status !== "WITHDRAWN" && app.status !== "HIRED" ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setWithdrawId(app.id)}
              >
                {t("withdraw")}
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
      {meta ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}
        </>
      )}

      <ConfirmDialog
        open={Boolean(withdrawId)}
        onOpenChange={(o) => !o && setWithdrawId(null)}
        title={t("confirmWithdraw")}
        pending={withdrawMut.isPending}
        onConfirm={() => {
          if (withdrawId) withdrawMut.mutate(withdrawId);
        }}
      />
    </div>
  );
}
