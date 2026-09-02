"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BarChart3,
  Briefcase,
  Check,
  CreditCard,
  Headphones,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  formatPaise,
  useBffErrorMessage,
} from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import {
  EMPLOYER_MEMBERSHIP_QUERY_KEY,
  employerMembershipQueryOptions,
} from "@/lib/query/employer-membership";
import {
  loadRazorpayCheckout,
  type RazorpayCheckoutResponse,
} from "@/lib/payments/load-razorpay-checkout";
import type {
  ConfirmMembershipPayment,
  EmployerMembership,
  InitiateMembershipPayment,
} from "@/types/ham";

import {
  EmployerMembershipPayError,
  employerMembershipDisplayStatus,
  formatMembershipAmount,
  isEmployerPayEnabled,
  isEmployerPayVisible,
  orgVerificationPendingNote,
} from "./employer-membership-view";

export function EmployerMembershipPanel() {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [notice, setNotice] = useState<{
    kind: "error" | "hint";
    text: string;
  } | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const memQ = useQuery(employerMembershipQueryOptions);

  const payMut = useMutation({
    mutationFn: async () => {
      const membership = memQ.data;
      if (!membership?.plan) {
        throw new EmployerMembershipPayError("no_plan");
      }
      const initiated = await bffJson<InitiateMembershipPayment>(
        proxyPath("payments/initiate"),
        {
          method: "POST",
          body: JSON.stringify({
            purpose: "EMPLOYER_MEMBERSHIP",
            planId: membership.plan.id,
          }),
        },
      );
      let Razorpay;
      try {
        Razorpay = await loadRazorpayCheckout();
      } catch {
        throw new EmployerMembershipPayError("checkout");
      }
      const payload = initiated.providerPayload;
      const checkoutResponse = await new Promise<RazorpayCheckoutResponse>(
        (resolve, reject) => {
          const checkout = new Razorpay({
            key: String(payload.keyId),
            amount: Number(payload.amountPaise),
            currency: String(payload.currency),
            order_id: String(payload.orderId),
            name: membership.plan?.name,
            handler: (response: RazorpayCheckoutResponse) => resolve(response),
            modal: {
              ondismiss: () =>
                reject(new EmployerMembershipPayError("cancelled")),
            },
          });
          checkout.open();
        },
      );
      return bffJson<ConfirmMembershipPayment>(proxyPath("payments/confirm"), {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: checkoutResponse.razorpay_order_id,
          razorpay_payment_id: checkoutResponse.razorpay_payment_id,
          razorpay_signature: checkoutResponse.razorpay_signature,
        }),
      });
    },
    onSuccess: async (confirmed) => {
      setNotice(null);
      if (confirmed.paymentId) setTransactionId(confirmed.paymentId);
      await qc.invalidateQueries({ queryKey: EMPLOYER_MEMBERSHIP_QUERY_KEY });
      await qc.invalidateQueries({ queryKey: ["employer-profile"] });
    },
    onError: (e) => {
      if (e instanceof EmployerMembershipPayError) {
        if (e.code === "cancelled") {
          setNotice({ kind: "hint", text: t("paymentCancelled") });
          return;
        }
        if (e.code === "checkout") {
          setNotice({ kind: "error", text: t("checkoutUnavailable") });
          return;
        }
        setNotice({ kind: "error", text: t("planUnavailable") });
        return;
      }
      setNotice({ kind: "error", text: errMsg(e) });
    },
  });

  if (memQ.isPending && !memQ.data) {
    return (
      <div className="ham-employer-mem">
        <h1 className="ham-employer-mem__title">{t("membershipTitle")}</h1>
        <LoadingState />
      </div>
    );
  }
  if (memQ.error || !memQ.data) {
    return (
      <div className="ham-employer-mem">
        <h1 className="ham-employer-mem__title">{t("membershipTitle")}</h1>
        <ErrorState onRetry={() => void memQ.refetch()} />
      </div>
    );
  }

  const m = memQ.data;
  const display = employerMembershipDisplayStatus(m);
  const paying = payMut.isPending;
  const payVisible = isEmployerPayVisible(m);
  const payEnabled = isEmployerPayEnabled({
    canPay: m.canPay,
    paying,
    hasPlan: Boolean(m.plan),
  });

  if (display === "verified") {
    return (
      <MembershipActiveView
        membership={m}
        transactionId={transactionId}
      />
    );
  }

  return (
    <MembershipPurchaseView
      membership={m}
      display={display}
      paying={paying}
      payVisible={payVisible}
      payEnabled={payEnabled}
      notice={notice}
      onPay={() => payMut.mutate()}
    />
  );
}

function MembershipPurchaseView({
  membership,
  display,
  paying,
  payVisible,
  payEnabled,
  notice,
  onPay,
}: {
  membership: EmployerMembership;
  display: "pending" | "failed" | "required";
  paying: boolean;
  payVisible: boolean;
  payEnabled: boolean;
  notice: { kind: "error" | "hint"; text: string } | null;
  onPay: () => void;
}) {
  const t = useTranslations("employer");
  const plan = membership.plan;
  const price = plan ? formatPaise(plan.amountPaise) : null;
  const priceDisplay = plan
    ? formatMembershipAmount(plan.amountPaise, plan.currency)
    : null;

  return (
    <div className="ham-employer-mem">
      <header className="ham-employer-mem__hero">
        <h1 className="ham-employer-mem__title">{t("unlockMembershipTitle")}</h1>
        <p className="ham-employer-mem__subtitle">
          {t("unlockMembershipSubtitle")}
        </p>
        <p className="ham-employer-mem__require">{t("membershipRequiredToPost")}</p>
        <p className="ham-employer-mem__support">
          {price
            ? t("membershipRequiredSupport", { price })
            : t("membershipRequiredSupportNoPrice")}
        </p>
      </header>

      <section className="ham-employer__card ham-employer-mem__offer">
        <div className="ham-employer-mem__price-block">
          <p className="ham-employer-mem__price">{priceDisplay ?? "—"}</p>
          <p className="ham-employer-mem__period">{t("membershipOneTime")}</p>
        </div>
        <div className="ham-employer-mem__rule" />
        <ul className="ham-employer-mem__benefits">
          <li className="ham-employer-mem__benefit--lead">
            <span className="ham-employer-mem__icon" aria-hidden>
              <Briefcase className="size-5" />
            </span>
            <div>
              <p className="ham-employer-mem__benefit-title">
                {t("benefitPostingTitle")}
              </p>
              <p className="ham-employer-mem__benefit-body">
                {t("benefitPostingBody")}
              </p>
            </div>
          </li>
          <li>
            <span className="ham-employer-mem__icon" aria-hidden>
              <Sparkles className="size-5" />
            </span>
            <p className="ham-employer-mem__benefit-title">
              {t("benefitPriorityTitle")}
            </p>
            <p className="ham-employer-mem__benefit-body">
              {t("benefitPriorityBody")}
            </p>
          </li>
          <li>
            <span className="ham-employer-mem__icon" aria-hidden>
              <BarChart3 className="size-5" />
            </span>
            <p className="ham-employer-mem__benefit-title">
              {t("benefitTrackingTitle")}
            </p>
            <p className="ham-employer-mem__benefit-body">
              {t("benefitTrackingBody")}
            </p>
          </li>
          <li>
            <span className="ham-employer-mem__icon" aria-hidden>
              <ShieldCheck className="size-5" />
            </span>
            <p className="ham-employer-mem__benefit-title">
              {t("benefitPremiumTitle")}
            </p>
            <p className="ham-employer-mem__benefit-body">
              {t("benefitPremiumBody")}
            </p>
          </li>
        </ul>
        <div className="ham-employer-mem__chips">
          <span className="ham-employer-mem__chip">
            <CreditCard className="size-3.5" aria-hidden />
            {t("securePayment")}
          </span>
          <span className="ham-employer-mem__chip">
            <Headphones className="size-3.5" aria-hidden />
            {t("supportAllHours")}
          </span>
        </div>
      </section>

      {display === "pending" ? (
        <p className="ham-employer-mem__status-note" role="status">
          {t("membershipDisplay.pending")}
        </p>
      ) : null}
      {display === "failed" ? (
        <p className="ham-employer-mem__status-note ham-employer-mem__status-note--error" role="alert">
          {t("membershipDisplay.failed")}
        </p>
      ) : null}

      {!membership.profileComplete ? (
        <section className="ham-employer-mem__prereq">
          <p>{t("completeProfileForMembership")}</p>
          <Link
            href="/employer/organization"
            className="ham-employer__btn ham-employer__btn--secondary"
          >
            {t("completeProfile")}
          </Link>
        </section>
      ) : null}

      {notice ? (
        <p
          className={
            notice.kind === "hint"
              ? "ham-employer-mem__status-note"
              : "ham-employer-mem__status-note ham-employer-mem__status-note--error"
          }
          role={notice.kind === "hint" ? "status" : "alert"}
        >
          {notice.text}
        </p>
      ) : null}

      {payVisible ? (
        <button
          type="button"
          className="ham-employer__btn ham-employer__btn--lg ham-employer__btn--primary ham-employer-mem__cta"
          disabled={!payEnabled}
          onClick={onPay}
        >
          {paying ? <span className="ham-employer__spinner" /> : null}
          {paying
            ? t("payingMembership")
            : price
              ? t("activateMembershipCta", { price })
              : t("activateMembership")}
        </button>
      ) : null}
      {payVisible ? (
        <p className="ham-employer-mem__cta-note">{t("membershipCtaNote")}</p>
      ) : null}
      <p className="ham-employer-mem__footnote">{t("membershipDoesNotVerifyOrg")}</p>
    </div>
  );
}

function MembershipActiveView({
  membership,
  transactionId,
}: {
  membership: EmployerMembership;
  transactionId: string | null;
}) {
  const t = useTranslations("employer");
  const plan = membership.plan;
  const price = plan
    ? formatPaise(plan.amountPaise)
    : null;
  const showPendingNote = orgVerificationPendingNote(
    membership.verificationState,
  );

  return (
    <div className="ham-employer-mem ham-employer-mem--active">
      <header className="ham-employer-mem__hero ham-employer-mem__hero--row">
        <h1 className="ham-employer-mem__title">{t("membershipActiveTitle")}</h1>
        <span className="ham-employer-mem__verified">
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
          {t("membershipVerifiedBadge")}
        </span>
      </header>

      <p className="ham-employer-mem__banner" role="status">
        {transactionId
          ? t("paymentSuccessBannerWithId", { id: transactionId })
          : t("paymentSuccessBanner")}
      </p>

      <section className="ham-employer__card ham-employer-mem__detail">
        <span className="ham-employer-mem__active-pill">{t("membershipActivePill")}</span>
        <dl className="ham-employer-mem__facts">
          <div>
            <dt>{t("membershipStatusLabel")}</dt>
            <dd className="ham-employer-mem__fact-active">
              {t("membershipStatusActive")}
            </dd>
          </div>
          <div>
            <dt>{t("membershipPrice")}</dt>
            <dd>
              {price
                ? t("membershipPricePaid", { price })
                : t("membershipStatusActive")}
            </dd>
          </div>
          <div>
            <dt>{t("membershipLevelLabel")}</dt>
            <dd>{t("membershipLevelPremium")}</dd>
          </div>
        </dl>
      </section>

      <Link
        href="/employer"
        className="ham-employer__btn ham-employer__btn--lg ham-employer__btn--primary ham-employer-mem__cta"
      >
        {t("membershipGoToDashboard")}
      </Link>

      {showPendingNote ? (
        <p className="ham-employer-mem__footnote">
          {membership.verificationState === "REJECTED"
            ? t("orgVerificationRejectedNote")
            : t("orgVerificationStillPending")}
        </p>
      ) : null}
    </div>
  );
}
