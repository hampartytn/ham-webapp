"use client";

import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck } from "lucide-react";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { cn } from "@/lib/utils";
import type { EmployerOrg } from "@/types/ham";

function verificationHeadingKey(
  state: string,
):
  | "verificationComplete"
  | "orgVerification.REJECTED"
  | "verificationPending"
  | "orgVerification.UNVERIFIED" {
  if (state === "VERIFIED") return "verificationComplete";
  if (state === "REJECTED") return "orgVerification.REJECTED";
  if (state === "PENDING") return "verificationPending";
  return "orgVerification.UNVERIFIED";
}

function verificationBodyKey(
  state: string,
):
  | "verificationCompleteBody"
  | "verificationRejectedBody"
  | "verificationPendingBody"
  | "verificationUnverifiedBody" {
  if (state === "VERIFIED") return "verificationCompleteBody";
  if (state === "REJECTED") return "verificationRejectedBody";
  if (state === "PENDING") return "verificationPendingBody";
  return "verificationUnverifiedBody";
}

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

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-lg font-semibold text-[var(--emp-muted)]">
        {t("accountVerification")}
      </h1>
      <section className="ham-employer__card relative overflow-hidden p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-[var(--emp-primary-light)]" />
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-[var(--emp-primary-light)] text-[var(--emp-primary)]">
            <ClipboardCheck className="size-8" />
          </span>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-[2rem] font-bold leading-10">
                {t(verificationHeadingKey(state))}
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
                {t(`orgVerification.${state}` as "orgVerification.UNVERIFIED")}
              </span>
            </div>
            <p className="max-w-lg text-base text-[var(--emp-muted)]">
              {t(verificationBodyKey(state))}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
