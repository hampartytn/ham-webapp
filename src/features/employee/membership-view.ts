import type { MembershipStatus } from "@/types/ham";

export type MembershipPayErrorCode = "cancelled" | "checkout" | "no_plan";

export class MembershipPayError extends Error {
  readonly code: MembershipPayErrorCode;

  constructor(code: MembershipPayErrorCode) {
    super(code);
    this.name = "MembershipPayError";
    this.code = code;
  }
}

export function isPayVisible(membership: Pick<MembershipStatus, "plan" | "status">): boolean {
  return Boolean(membership.plan) && membership.status !== "JOINED";
}

export function isPayEnabled(input: {
  canPay: boolean;
  accepted: boolean;
  paying: boolean;
  hasPlan: boolean;
}): boolean {
  return input.canPay && input.accepted && !input.paying && input.hasPlan;
}

export function membershipStatusKey(
  status: string | null,
): "NONE" | "JOINED" | "DECLINED" | "WITHDRAWN" {
  if (status === "JOINED" || status === "DECLINED" || status === "WITHDRAWN") {
    return status;
  }
  return "NONE";
}

export function paymentStatusKey(
  status: string | null,
): "CREATED" | "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | null {
  if (
    status === "CREATED" ||
    status === "PENDING" ||
    status === "SUCCEEDED" ||
    status === "FAILED" ||
    status === "CANCELLED"
  ) {
    return status;
  }
  return null;
}

export function membershipBadgeTone(
  status: string | null,
): "neutral" | "success" | "muted" {
  if (status === "JOINED") return "success";
  if (status === "DECLINED" || status === "WITHDRAWN") return "muted";
  return "neutral";
}
