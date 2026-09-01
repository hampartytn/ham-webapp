"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { EmployerOrg } from "@/types/ham";

export function EmployerMembershipPage() {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const [msg, setMsg] = useState<string | null>(null);
  const profileQ = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () =>
      bffJson<{
        id: string;
        fullName: string | null;
        organization: EmployerOrg | null;
      }>(proxyPath("employer/profile")),
  });

  const payMut = useMutation({
    mutationFn: () =>
      bffJson<{ paymentId: string; status: string }>(
        proxyPath("payments/initiate"),
        {
          method: "POST",
          body: JSON.stringify({ purpose: "EMPLOYER_ACTIVATION" }),
        },
      ),
    onSuccess: (d) => setMsg(t("paymentStatus", { status: d.status })),
    onError: (e) => setMsg(errMsg(e)),
  });

  if (profileQ.isPending && !profileQ.data) return <LoadingState />;
  if (profileQ.error) {
    return <ErrorState onRetry={() => void profileQ.refetch()} />;
  }

  const org = profileQ.data?.organization;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-[2rem] font-bold">{t("navMembership")}</h1>
      <section className="ham-employer__card space-y-3 p-6">
        <p className="text-sm text-[var(--emp-muted)]">{t("membershipHelp")}</p>
        <p className="text-sm">
          {t("verificationState")}:{" "}
          <strong>
            {org
              ? t(`orgVerification.${org.verificationState}` as "orgVerification.UNVERIFIED")
              : "—"}
          </strong>
        </p>
        <p className="text-sm">
          {t("activationStatus")}: <strong>{org?.activationStatus ?? "—"}</strong>
        </p>
        <Link href="/employer/verification" className="text-sm font-semibold text-[var(--emp-primary)] hover:underline">
          {t("accountVerification")}
        </Link>
        <p className="text-sm text-[var(--emp-muted)]">{t("paymentsNote")}</p>
        <button
          type="button"
          className="ham-employer__btn ham-employer__btn--secondary"
          disabled={payMut.isPending}
          onClick={() => payMut.mutate()}
        >
          {t("initiatePayment")}
        </button>
        {msg ? <p className="text-sm">{msg}</p> : null}
      </section>
    </div>
  );
}
