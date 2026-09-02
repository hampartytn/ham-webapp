"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { LanguageSelector } from "@/components/shared/language-selector";
import { LogoutButton } from "@/components/shared/logout-button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PasswordSetForm } from "@/features/auth/components/password-set-form";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { employerMembershipQueryOptions } from "@/lib/query/employer-membership";
import { ME_QUERY_KEY, ME_STALE_MS } from "@/lib/query/session-cache";
import type { MeResponse } from "@/types/ham";

import { employerMembershipDisplayStatus } from "./employer-membership-view";

export function EmployerSettingsPanel() {
  const t = useTranslations("employer");
  const ta = useTranslations("auth");
  const ts = useTranslations("shell");

  const meQ = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: ME_STALE_MS,
  });
  const membershipQ = useQuery(employerMembershipQueryOptions);

  if (meQ.isPending && !meQ.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <EmployerPageHeader
          title={ts("settings")}
          subtitle={t("settingsSubtitle")}
        />
        <LoadingState />
      </div>
    );
  }
  if (meQ.error || !meQ.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <EmployerPageHeader
          title={ts("settings")}
          subtitle={t("settingsSubtitle")}
        />
        <ErrorState onRetry={() => void meQ.refetch()} />
      </div>
    );
  }

  const membershipDisplay = membershipQ.data
    ? employerMembershipDisplayStatus(membershipQ.data)
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <EmployerPageHeader
        title={ts("settings")}
        subtitle={t("settingsSubtitle")}
      />

      <section className="ham-employer__card space-y-3 p-6">
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

      <section className="ham-employer__card space-y-3 p-6">
        <h2 className="text-base font-semibold">{t("sectionLanguage")}</h2>
        <p className="text-sm text-[var(--emp-muted)]">{t("languageHelp")}</p>
        <LanguageSelector appearance="form" />
      </section>

      <section className="ham-employer__card space-y-4 p-6">
        <h2 className="text-base font-semibold">{ta("setPasswordTitle")}</h2>
        <PasswordSetForm />
      </section>

      <section className="ham-employer__card space-y-3 p-6">
        <h2 className="text-base font-semibold">{t("sectionPayments")}</h2>
        <p className="text-sm text-[var(--emp-muted)]">{t("paymentsNote")}</p>
        {membershipDisplay ? (
          <p className="text-sm">
            {t(`membershipDisplay.${membershipDisplay}`)}
          </p>
        ) : null}
        <Link
          href="/employer/membership"
          className="ham-employer__btn ham-employer__btn--secondary"
        >
          {t("manageMembership")}
        </Link>
      </section>

      <section className="ham-employer__card p-6">
        <LogoutButton />
      </section>
    </div>
  );
}
