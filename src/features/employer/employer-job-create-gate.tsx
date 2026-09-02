"use client";

import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";

import { LoadingState } from "@/components/shared/loading-state";
import { useRouter } from "@/i18n/navigation";
import { employerMembershipQueryOptions } from "@/lib/query/employer-membership";

import { EmployerMembershipRequiredDialog } from "./employer-membership-required-dialog";
import { employerJobCreateGate } from "./employer-membership-view";

export function useEmployerJobCreateGate() {
  const membershipQ = useQuery(employerMembershipQueryOptions);
  const gate = employerJobCreateGate(
    membershipQ.data?.status,
    Boolean(membershipQ.data) || membershipQ.isError,
  );
  return {
    gate,
    amountPaise: membershipQ.data?.plan?.amountPaise ?? null,
  };
}

export function EmployerPostJobButton({
  className,
  children,
  ariaLabel,
}: {
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { gate, amountPaise } = useEmployerJobCreateGate();

  const onPostJob = () => {
    if (gate === "loading") return;
    if (gate === "allow") {
      router.push("/employer/jobs/new");
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={className}
        disabled={gate === "loading"}
        aria-busy={gate === "loading"}
        aria-label={ariaLabel}
        onClick={onPostJob}
      >
        {gate === "loading" ? (
          <span className="ham-employer__spinner" aria-hidden />
        ) : null}
        {children}
      </button>
      <EmployerMembershipRequiredDialog
        open={open}
        onOpenChange={setOpen}
        amountPaise={amountPaise}
      />
    </>
  );
}

export function EmployerJobCreatePageGate({ children }: { children: ReactNode }) {
  const t = useTranslations("employer");
  const router = useRouter();
  const { gate, amountPaise } = useEmployerJobCreateGate();
  const [open, setOpen] = useState(true);

  if (gate === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-[2rem] font-bold leading-10">{t("postNewJob")}</h1>
        <LoadingState />
      </div>
    );
  }

  if (gate === "blocked") {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-[2rem] font-bold leading-10">{t("postNewJob")}</h1>
        <p className="text-base text-[var(--emp-muted)]">
          {t("membershipRequiredToPost")}
        </p>
        <EmployerMembershipRequiredDialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) router.push("/employer");
          }}
          amountPaise={amountPaise}
        />
      </div>
    );
  }

  return children;
}
