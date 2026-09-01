"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, ClipboardCheck, Info, Shield } from "lucide-react";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { cn } from "@/lib/utils";
import type { EmployerOrg } from "@/types/ham";

export function EmployerVerificationPage() {
  const t = useTranslations("employer");
  const profileQ = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () =>
      bffJson<{
        id: string;
        fullName: string | null;
        organization: EmployerOrg | null;
      }>(proxyPath("employer/profile")),
  });

  if (profileQ.isPending && !profileQ.data) return <LoadingState />;
  if (profileQ.error) {
    return <ErrorState onRetry={() => void profileQ.refetch()} />;
  }

  const org = profileQ.data?.organization;
  const state = org?.verificationState ?? "UNVERIFIED";
  const verified = state === "VERIFIED";
  const rejected = state === "REJECTED";
  const pending = state === "PENDING" || state === "UNVERIFIED";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-lg font-semibold text-[var(--emp-muted)]">
        {t("accountVerification")}
      </h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="ham-employer__card relative overflow-hidden p-6 lg:col-span-2">
          <div className="absolute inset-x-0 top-0 h-1 bg-[var(--emp-primary-light)]" />
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--emp-primary-light)] text-[var(--emp-primary)]">
              <ClipboardCheck className="size-8" />
            </span>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-[2rem] font-bold leading-10">
                  {verified
                    ? t("verificationComplete")
                    : rejected
                      ? t("orgVerification.REJECTED")
                      : t("verificationPending")}
                </h2>
                <span
                  className={cn(
                    "ham-employer__pill",
                    verified
                      ? "ham-employer__pill--success"
                      : rejected
                        ? "ham-employer__pill--danger"
                        : "ham-employer__pill--info",
                  )}
                >
                  {t(`orgVerification.${state}` as "orgVerification.PENDING")}
                </span>
              </div>
              <p className="mb-6 max-w-lg text-base text-[var(--emp-muted)]">
                {verified
                  ? t("verificationCompleteBody")
                  : t("verificationPendingBody")}
              </p>
              {pending ? (
                <div className="flex gap-3 rounded-lg bg-[var(--emp-soft)] p-4">
                  <Info className="mt-0.5 size-5 shrink-0 text-[var(--emp-muted)]" />
                  <div>
                    <p className="font-semibold">{t("restrictedAccessTitle")}</p>
                    <p className="text-sm text-[var(--emp-muted)]">
                      {t("restrictedWhilePending")}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </section>
        <section className="ham-employer__card flex flex-col justify-between p-6">
          <div>
            <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-[var(--emp-primary-light)] text-[var(--emp-primary)]">
              <ArrowRight className="size-5" />
            </span>
            <h2 className="font-semibold">{t("maximizeWait")}</h2>
            <p className="mt-2 text-sm text-[var(--emp-muted)]">{t("maximizeWaitBody")}</p>
          </div>
          <Link
            href="/employer/organization"
            className="ham-employer__btn ham-employer__btn--primary mt-6 w-full"
          >
            {t("completeProfile")}
            <ArrowRight className="size-4" />
          </Link>
        </section>
        <section className="ham-employer__card p-6 lg:col-span-3">
          <h2 className="mb-6 text-lg font-semibold">{t("whatHappensNext")}</h2>
          <ol className="relative grid gap-8 md:grid-cols-3">
            <span className="absolute left-8 right-8 top-5 hidden h-0.5 bg-[var(--emp-border)] md:block" />
            <span
              className="absolute left-8 top-5 hidden h-0.5 bg-[var(--emp-primary)] md:block"
              style={{ width: verified ? "66%" : "33%" }}
            />
            <li className="relative z-10 flex items-center gap-4 md:flex-col md:text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--emp-primary)] text-white">
                <Check className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{t("stepRegistration")}</p>
                <p className="text-sm text-[var(--emp-muted)]">{t("accountCreated")}</p>
              </div>
            </li>
            <li className="relative z-10 flex items-center gap-4 md:flex-col md:text-center">
              <span
                className={cn(
                  "flex size-10 items-center justify-center rounded-full",
                  verified
                    ? "bg-[var(--emp-primary)] text-white"
                    : "bg-[var(--emp-primary-light)] text-[var(--emp-primary)]",
                )}
              >
                <Shield className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{t("stepDocumentCheck")}</p>
                <p className="text-sm font-medium text-[var(--emp-primary)]">
                  {verified ? t("verificationComplete") : t("inProgress")}
                </p>
              </div>
            </li>
            <li
              className={cn(
                "relative z-10 flex items-center gap-4 md:flex-col md:text-center",
                !verified && "opacity-50",
              )}
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-[var(--emp-soft)] text-[var(--emp-muted)]">
                <Check className="size-5" />
              </span>
              <div>
                <p className="font-semibold">{t("stepApproval")}</p>
                <p className="text-sm text-[var(--emp-muted)]">{t("fullAccessGranted")}</p>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}
