"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { LanguageSelector } from "@/components/shared/language-selector";
import { LogoutButton } from "@/components/shared/logout-button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { PasswordSetForm } from "@/features/auth/components/password-set-form";
import { Button } from "@/components/ui/button";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { MeResponse } from "@/types/ham";

export function EmployerSettingsPanel() {
  const t = useTranslations("employer");
  const ta = useTranslations("auth");
  const ts = useTranslations("shell");
  const errMsg = useBffErrorMessage();
  const [msg, setMsg] = useState<string | null>(null);

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
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

  if (meQ.isLoading) return <LoadingState />;
  if (meQ.error || !meQ.data) {
    return <ErrorState onRetry={() => void meQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <EmployerPageHeader
        title={ts("settings")}
        subtitle={t("settingsSubtitle")}
      />

      <section className="ham-employer__panel space-y-3">
        <h2 className="text-base font-semibold">{t("sectionAccount")}</h2>
        <p className="text-sm">
          <span className="font-medium">{t("accountPhone")}: </span>
          {meQ.data.phone}
        </p>
        {meQ.data.employerProfile?.organizationName ? (
          <p className="text-sm">
            <span className="font-medium">{t("orgTitle")}: </span>
            {meQ.data.employerProfile.organizationName}
          </p>
        ) : null}
      </section>

      <section className="ham-employer__panel space-y-3">
        <h2 className="text-base font-semibold">{t("sectionLanguage")}</h2>
        <p className="text-sm text-[var(--emp-muted)]">{t("languageHelp")}</p>
        <LanguageSelector appearance="form" />
      </section>

      <section className="ham-employer__panel space-y-4">
        <h2 className="text-base font-semibold">{ta("setPasswordTitle")}</h2>
        <PasswordSetForm />
      </section>

      <section className="ham-employer__panel space-y-3">
        <h2 className="text-base font-semibold">{t("sectionPayments")}</h2>
        <p className="text-sm text-[var(--emp-muted)]">{t("paymentsNote")}</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => payMut.mutate()}
          disabled={payMut.isPending}
        >
          {t("initiatePayment")}
        </Button>
        {msg ? <p className="text-sm">{msg}</p> : null}
      </section>

      <section className="ham-employer__panel">
        <LogoutButton />
      </section>
    </div>
  );
}
