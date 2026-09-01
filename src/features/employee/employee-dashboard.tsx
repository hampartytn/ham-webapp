"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { ME_QUERY_KEY, ME_STALE_MS } from "@/lib/query/session-cache";
import type { MeResponse } from "@/types/ham";

export function EmployeeDashboard() {
  const t = useTranslations("employee");
  const ts = useTranslations("shell");
  const { data, error, isPending, refetch } = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: ME_STALE_MS,
  });

  if (error && !data) {
    return (
      <ErrorState
        code={error && "code" in error ? String((error as { code?: string }).code) : undefined}
        onRetry={() => void refetch()}
      />
    );
  }

  const o = data?.onboarding;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboardTitle")}</h1>
        <p className="text-muted-foreground">
          {data ? ts("sessionPhone", { phone: data.phone }) : "\u00a0"}
        </p>
      </div>
      {isPending && !data ? (
        <LoadingState />
      ) : !data || !o ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <>
      <section className="space-y-2">
        <h2 className="text-lg font-medium">{t("onboarding")}</h2>
        <ul className="space-y-1 text-sm">
          <li>
            {t("phoneVerified")}: {o.phoneVerified ? t("yes") : t("no")}
          </li>
          <li>
            {t("profileComplete")}: {o.profileComplete ? t("yes") : t("no")}
          </li>
          <li>
            {t("identityVerified")}: {o.identityVerified ? t("yes") : t("no")}
          </li>
          <li>{t("membership", { status: o.hamMembershipStatus })}</li>
        </ul>
      </section>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href="/employee/profile">
          {t("editProfile")}
        </Link>
        <Link className="underline" href="/employee/jobs">
          {t("findJobs")}
        </Link>
        <Link className="underline" href="/employee/verification">
          {t("verificationTitle")}
        </Link>
        <Link className="underline" href="/employee/membership">
          {t("membershipTitle")}
        </Link>
      </div>
        </>
      )}
    </div>
  );
}
