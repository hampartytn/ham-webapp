"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import {
  StatusBadge,
  formatPaise,
  useBffErrorMessage,
} from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import { BffError, bffJson, proxyPath } from "@/lib/api/bff-client";
import {
  loadRazorpayCheckout,
  type RazorpayCheckoutResponse,
} from "@/lib/payments/load-razorpay-checkout";
import { ME_QUERY_KEY } from "@/lib/query/session-cache";
import type {
  ConfirmMembershipPayment,
  InitiateMembershipPayment,
  MembershipInfo,
  MembershipStatus,
} from "@/types/ham";

import {
  MembershipPayError,
  isPayEnabled,
  isPayVisible,
  membershipBadgeTone,
  membershipStatusKey,
  paymentStatusKey,
} from "./membership-view";

export function EmployeeMembershipPanel() {
  const t = useTranslations("employee");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [accepted, setAccepted] = useState(false);
  const [notice, setNotice] = useState<{
    kind: "error" | "hint";
    text: string;
  } | null>(null);

  const memQ = useQuery({
    queryKey: ["membership"],
    queryFn: () => bffJson<MembershipStatus>(proxyPath("membership")),
  });

  const infoQ = useQuery({
    queryKey: ["membership", "info"],
    queryFn: () => bffJson<MembershipInfo>(proxyPath("membership/info")),
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
      setNotice(null);
      await qc.invalidateQueries({ queryKey: ["membership"] });
      await qc.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
    onError: (e) => setNotice({ kind: "error", text: errMsg(e) }),
  });

  const declineMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("membership/decline"), {
        method: "POST",
        body: JSON.stringify({ termsVersion: memQ.data?.termsVersion }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["membership"] });
      await qc.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
    onError: (e) => setNotice({ kind: "error", text: errMsg(e) }),
  });

  const withdrawMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("membership/withdraw"), {
        method: "POST",
        body: JSON.stringify({ termsVersion: memQ.data?.termsVersion }),
      }),
    onError: (e) => {
      if (e instanceof BffError && e.code === "NOT_ENABLED") {
        setNotice({ kind: "error", text: t("withdrawNotEnabled") });
      } else {
        setNotice({ kind: "error", text: errMsg(e) });
      }
    },
  });

  const payMut = useMutation({
    mutationFn: async () => {
      const membership = memQ.data;
      if (!membership?.plan) {
        throw new MembershipPayError("no_plan");
      }
      const initiated = await bffJson<InitiateMembershipPayment>(
        proxyPath("payments/initiate"),
        {
          method: "POST",
          body: JSON.stringify({
            purpose: "MEMBERSHIP",
            planId: membership.plan.id,
            termsVersion: membership.termsVersion,
            accepted: true,
          }),
        },
      );
      let Razorpay;
      try {
        Razorpay = await loadRazorpayCheckout();
      } catch {
        throw new MembershipPayError("checkout");
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
              ondismiss: () => reject(new MembershipPayError("cancelled")),
            },
          });
          checkout.open();
        },
      );
      await bffJson<ConfirmMembershipPayment>(proxyPath("payments/confirm"), {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: checkoutResponse.razorpay_order_id,
          razorpay_payment_id: checkoutResponse.razorpay_payment_id,
          razorpay_signature: checkoutResponse.razorpay_signature,
        }),
      });
    },
    onSuccess: async () => {
      setNotice(null);
      await qc.invalidateQueries({ queryKey: ["membership"] });
      await qc.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
    onError: (e) => {
      if (e instanceof MembershipPayError) {
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
  const paying = payMut.isPending;
  const statusKey = membershipStatusKey(m.status);
  const payStatusKey = paymentStatusKey(m.paymentStatus);
  const payVisible = isPayVisible(m);
  const payEnabled = isPayEnabled({
    canPay: m.canPay,
    accepted,
    paying,
    hasPlan: Boolean(m.plan),
  });

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">{t("membershipTitle")}</h1>
      <StatusBadge
        status={statusKey}
        label={t(`membershipStatus.${statusKey}`)}
        tone={membershipBadgeTone(m.status)}
      />
      {m.plan ? (
        <div className="space-y-1 text-sm">
          <p className="font-medium">{m.plan.name}</p>
          <p>
            {t("membershipPrice")}: {formatPaise(m.plan.amountPaise)}{" "}
            {m.plan.currency}
          </p>
        </div>
      ) : null}
      {payStatusKey ? (
        <p className="text-sm">
          {t("paymentStatusLabel")}: {t(`paymentStatus.${payStatusKey}`)}
        </p>
      ) : null}
      {infoQ.data?.placeholderNotice ? (
        <p className="text-sm text-muted-foreground">
          {infoQ.data.placeholderNotice}
        </p>
      ) : null}
      <p className="text-sm">{t("membershipTerms", { version: m.termsVersion })}</p>
      <p className="text-sm">
        {t("identityVerified")}:{" "}
        <StatusBadge
          status={m.identityVerified ? "yes" : "no"}
          label={m.identityVerified ? t("yes") : t("no")}
          tone={m.identityVerified ? "success" : "warning"}
        />
      </p>
      {!m.identityVerified ? (
        <p className="text-sm">
          {t("verifyIdentityFirst")}{" "}
          <Link className="underline" href="/employee/verification">
            {t("verificationTitle")}
          </Link>
        </p>
      ) : null}
      {m.canPay ? <p className="text-sm font-medium">{t("canPay")}</p> : null}
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
        {payVisible ? (
          <Button
            type="button"
            disabled={!payEnabled}
            onClick={() => payMut.mutate()}
          >
            {paying ? t("payingMembership") : t("payMembership")}
          </Button>
        ) : null}
        {m.canJoin ? (
          <Button
            type="button"
            disabled={!accepted || joinMut.isPending}
            onClick={() => joinMut.mutate()}
          >
            {t("join")}
          </Button>
        ) : null}
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

      {notice ? (
        <p
          className={
            notice.kind === "hint"
              ? "text-sm text-muted-foreground"
              : "text-sm text-destructive"
          }
          role={notice.kind === "hint" ? "status" : "alert"}
        >
          {notice.text}
        </p>
      ) : null}
    </div>
  );
}
