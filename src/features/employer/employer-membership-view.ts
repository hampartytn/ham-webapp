import { formatPaise } from "@/components/shared/status-badge";
import { BffError } from "@/lib/api/bff-client";
import type { EmployerMembership } from "@/types/ham";

export type EmployerMembershipPayErrorCode =
  | "cancelled"
  | "checkout"
  | "no_plan";

export class EmployerMembershipPayError extends Error {
  readonly code: EmployerMembershipPayErrorCode;

  constructor(code: EmployerMembershipPayErrorCode) {
    super(code);
    this.name = "EmployerMembershipPayError";
    this.code = code;
  }
}

export type EmployerMembershipDisplayStatus =
  | "verified"
  | "pending"
  | "failed"
  | "required";

export function employerMembershipDisplayStatus(
  membership: Pick<EmployerMembership, "status" | "paymentStatus">,
): EmployerMembershipDisplayStatus {
  if (membership.status === "ACTIVE") return "verified";
  if (membership.paymentStatus === "FAILED") return "failed";
  if (
    membership.paymentStatus === "PENDING" ||
    membership.paymentStatus === "CREATED"
  ) {
    return "pending";
  }
  return "required";
}

export function isEmployerPayVisible(
  membership: Pick<EmployerMembership, "plan" | "status">,
): boolean {
  return Boolean(membership.plan) && membership.status !== "ACTIVE";
}

export function isEmployerPayEnabled(input: {
  canPay: boolean;
  paying: boolean;
  hasPlan: boolean;
}): boolean {
  return input.canPay && !input.paying && input.hasPlan;
}

export function employerMembershipBadgeTone(
  display: EmployerMembershipDisplayStatus,
): "success" | "info" | "danger" | "warning" {
  if (display === "verified") return "success";
  if (display === "pending") return "info";
  if (display === "failed") return "danger";
  return "warning";
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

export function formatMembershipAmount(
  amountPaise: number,
  currency: string,
): string {
  const amount = formatPaise(amountPaise);
  const code = currency.trim();
  return code ? `${amount} ${code}` : amount;
}

export function isEmployerMembershipActive(
  status: string | undefined,
): boolean {
  return status === "ACTIVE";
}

export function employerJobCreateGate(
  status: string | undefined,
  statusKnown: boolean,
): "loading" | "allow" | "blocked" {
  if (!statusKnown) return "loading";
  return isEmployerMembershipActive(status) ? "allow" : "blocked";
}

export function isEmployerMembershipRequiredError(error: unknown): boolean {
  return error instanceof BffError && error.code === "MEMBERSHIP_REQUIRED";
}

export function orgVerificationPendingNote(
  verificationState: string | undefined,
): boolean {
  return verificationState !== "VERIFIED";
}

export type OrgVerificationSummary = "verified" | "pending" | "rejected";

export function orgVerificationSummary(
  verificationState: string | undefined,
): OrgVerificationSummary {
  if (verificationState === "VERIFIED") return "verified";
  if (verificationState === "REJECTED") return "rejected";
  return "pending";
}

export function membershipActivatedLabel(
  activatedAt: string | null,
): string | null {
  if (!activatedAt) return null;
  return Number.isNaN(Date.parse(activatedAt)) ? null : activatedAt;
}
