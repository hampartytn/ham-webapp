"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge, useBffErrorMessage } from "@/components/shared/status-badge";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { VerificationMe } from "@/types/ham";

export function EmployeeVerificationPanel() {
  const t = useTranslations("employee");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const meQ = useQuery({
    queryKey: ["verification-me"],
    queryFn: () => bffJson<VerificationMe>(proxyPath("verification/me")),
  });

  const startMut = useMutation({
    mutationFn: () =>
      bffJson<{ verificationId: string; status: string }>(
        proxyPath("verification/start"),
        { method: "POST", body: "{}" },
      ),
    onSuccess: async () => {
      setMsg(null);
      await qc.invalidateQueries({ queryKey: ["verification-me"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  const mockMut = useMutation({
    mutationFn: (result: "SUCCEEDED" | "FAILED") => {
      const id = meQ.data?.verificationId;
      if (!id) throw new Error("no verification");
      return bffJson(proxyPath("verification/mock/complete"), {
        method: "POST",
        body: JSON.stringify({ verificationId: id, result }),
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["verification-me"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
      await qc.invalidateQueries({ queryKey: ["membership"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  if (meQ.isPending && !meQ.data) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold">{t("verificationTitle")}</h1>
        <LoadingState />
      </div>
    );
  }
  if (meQ.error) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold">{t("verificationTitle")}</h1>
        <ErrorState onRetry={() => void meQ.refetch()} />
      </div>
    );
  }

  const v = meQ.data;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">{t("verificationTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("verificationHint")}</p>

      {!v ? (
        <p className="text-sm">{t("noVerification")}</p>
      ) : (
        <div className="space-y-2 text-sm">
          <StatusBadge status={v.status} />
          <p>ID: {v.verificationId}</p>
          <p>Provider: {v.provider}</p>
          {v.maskedIdentity ? (
            <p>{t("maskedIdentity", { value: v.maskedIdentity })}</p>
          ) : null}
        </div>
      )}

      <Button
        type="button"
        disabled={startMut.isPending}
        onClick={() => startMut.mutate()}
      >
        {t("startVerification")}
      </Button>

      {v && process.env.NODE_ENV !== "production" ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => mockMut.mutate("SUCCEEDED")}
          >
            {t("mockComplete")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => mockMut.mutate("FAILED")}
          >
            {t("mockFail")}
          </Button>
        </div>
      ) : null}

      {msg ? (
        <p className="text-sm text-destructive" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
