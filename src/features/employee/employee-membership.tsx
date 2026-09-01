"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { StatusBadge, useBffErrorMessage } from "@/components/shared/status-badge";
import { BffError, bffJson, proxyPath } from "@/lib/api/bff-client";
import type { MembershipStatus } from "@/types/ham";

export function EmployeeMembershipPanel() {
  const t = useTranslations("employee");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [accepted, setAccepted] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const memQ = useQuery({
    queryKey: ["membership"],
    queryFn: () => bffJson<MembershipStatus>(proxyPath("membership")),
  });

  const joinMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("membership/join"), {
        method: "POST",
        body: JSON.stringify({
          termsVersion: memQ.data?.termsVersion,
          accepted: true,
        }),
      }),
    onSuccess: async () => {
      setMsg(null);
      await qc.invalidateQueries({ queryKey: ["membership"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  const declineMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("membership/decline"), {
        method: "POST",
        body: JSON.stringify({ termsVersion: memQ.data?.termsVersion }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["membership"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  const withdrawMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("membership/withdraw"), {
        method: "POST",
        body: JSON.stringify({ termsVersion: memQ.data?.termsVersion }),
      }),
    onError: (e) => {
      if (e instanceof BffError && e.code === "NOT_ENABLED") {
        setMsg(t("withdrawNotEnabled"));
      } else {
        setMsg(errMsg(e));
      }
    },
  });

  if (memQ.isPending && !memQ.data) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold">{t("membershipTitle")}</h1>
        <LoadingState />
      </div>
    );
  }
  if (memQ.error || !memQ.data) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold">{t("membershipTitle")}</h1>
        <ErrorState onRetry={() => void memQ.refetch()} />
      </div>
    );
  }

  const m = memQ.data;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">{t("membershipTitle")}</h1>
      <StatusBadge status={m.status} />
      <p className="text-sm">{t("membershipTerms", { version: m.termsVersion })}</p>
      <p className="text-sm">
        {t("identityVerified")}: {m.identityVerified ? t("yes") : t("no")}
      </p>
      {m.canJoin ? <p className="text-sm font-medium">{t("canJoin")}</p> : null}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        {t("acceptTerms")}
      </label>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={!accepted || joinMut.isPending || !m.canJoin}
          onClick={() => joinMut.mutate()}
        >
          {t("join")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={declineMut.isPending}
          onClick={() => declineMut.mutate()}
        >
          {t("decline")}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={withdrawMut.isPending}
          onClick={() => withdrawMut.mutate()}
        >
          {t("withdrawMembership")}
        </Button>
      </div>

      {msg ? (
        <p className="text-sm text-destructive" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
