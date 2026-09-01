"use client";

import { ArrowRight, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

export function EmployerWelcome() {
  const t = useTranslations("employer");
  const ta = useTranslations("auth");

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[480px] flex-col items-center justify-center">
      <div className="ham-employer__card w-full overflow-hidden">
        <div className="relative h-[220px] bg-[var(--emp-soft)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuASzFTRINoDt0k0KIP8kp9AJLR8_iPUOp3iBosNlisydRxOz80dwCPPpTFzk4j_XhE97tT1VjdM6YHSbAAtGLHRzbrvitV3yIlkKHvTNerLk7HlAmXV7_bj6qekRUeucvbt2ecTHuY-sSUIbw7KLz3_hs1VE6AmpK3zeXV2koEdmQRZATxCpyxR5AfJHAVvoz9sS7r7TVBhcP4Lib4gZHs6c_cVXjzKl0YQ5AQvgbwFDC2IE1_LwOdm"
            alt=""
            className="h-full w-full object-cover opacity-90"
          />
        </div>
        <div className="flex flex-col items-center px-8 py-8 text-center">
          <Briefcase className="mb-2 size-6 text-[var(--emp-primary)]" aria-hidden />
          <p className="text-2xl font-semibold text-[var(--emp-primary)]">HAM</p>
          <p className="mb-8 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--emp-muted)]">
            {t("employerWord")}
          </p>
          <h1 className="text-[2rem] font-bold leading-10">{t("welcomeHeadline")}</h1>
          <p className="mt-3 max-w-xs text-base text-[var(--emp-muted)]">{t("welcomeBody")}</p>
          <Link
            href="/employer/onboarding"
            className="ham-employer__btn ham-employer__btn--primary ham-employer__btn--lg mt-8 w-full"
          >
            {t("getStarted")}
            <ArrowRight className="size-4" />
          </Link>
          <p className="mt-4 text-sm text-[var(--emp-muted)]">
            {ta("alreadyHaveAccount")}{" "}
            <Link href="/login" className="font-semibold text-[var(--emp-primary)] hover:underline">
              {ta("loginTitle")}
            </Link>
          </p>
        </div>
      </div>
      <p className="mt-8 text-xs font-semibold uppercase tracking-wide text-[var(--emp-muted)]">
        {t("securePortal")}
      </p>
    </div>
  );
}
