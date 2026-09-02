import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { formatPaise } from "@/components/shared/status-badge";
import { BffError } from "@/lib/api/bff-client";

import {
  EmployerMembershipPayError,
  employerJobCreateGate,
  employerMembershipBadgeTone,
  employerMembershipDisplayStatus,
  formatMembershipAmount,
  isEmployerMembershipActive,
  isEmployerMembershipRequiredError,
  isEmployerPayEnabled,
  isEmployerPayVisible,
  orgVerificationPendingNote,
  paymentStatusKey,
} from "./employer-membership-view";

const PLAN = {
  id: "plan-1",
  code: "employer-ham-membership",
  name: "Employer HAM Membership",
  amountPaise: 9900,
  currency: "INR",
};

describe("employerMembershipDisplayStatus", () => {
  it("shows verified only after backend membership is ACTIVE", () => {
    expect(
      employerMembershipDisplayStatus({
        status: "ACTIVE",
        paymentStatus: "SUCCEEDED",
      }),
    ).toBe("verified");
    expect(
      employerMembershipDisplayStatus({
        status: "INACTIVE",
        paymentStatus: "SUCCEEDED",
      }),
    ).toBe("required");
  });

  it("maps pending and failed payments without marking membership verified", () => {
    expect(
      employerMembershipDisplayStatus({
        status: "INACTIVE",
        paymentStatus: "PENDING",
      }),
    ).toBe("pending");
    expect(
      employerMembershipDisplayStatus({
        status: "INACTIVE",
        paymentStatus: "FAILED",
      }),
    ).toBe("failed");
    expect(
      employerMembershipDisplayStatus({
        status: "INACTIVE",
        paymentStatus: null,
      }),
    ).toBe("required");
  });
});

describe("pay visibility", () => {
  it("shows pay when a plan exists and membership is not ACTIVE", () => {
    expect(isEmployerPayVisible({ plan: PLAN, status: "INACTIVE" })).toBe(true);
    expect(isEmployerPayVisible({ plan: PLAN, status: "ACTIVE" })).toBe(false);
    expect(isEmployerPayVisible({ plan: null, status: "INACTIVE" })).toBe(false);
  });

  it("enables pay only when the backend says canPay", () => {
    expect(
      isEmployerPayEnabled({ canPay: true, paying: false, hasPlan: true }),
    ).toBe(true);
    expect(
      isEmployerPayEnabled({ canPay: false, paying: false, hasPlan: true }),
    ).toBe(false);
    expect(
      isEmployerPayEnabled({ canPay: true, paying: true, hasPlan: true }),
    ).toBe(false);
  });
});

describe("employerJobCreateGate", () => {
  it("waits until membership status is known", () => {
    expect(employerJobCreateGate("ACTIVE", false)).toBe("loading");
    expect(employerJobCreateGate(undefined, false)).toBe("loading");
  });

  it("allows job creation only when membership is ACTIVE", () => {
    expect(isEmployerMembershipActive("ACTIVE")).toBe(true);
    expect(isEmployerMembershipActive("INACTIVE")).toBe(false);
    expect(employerJobCreateGate("ACTIVE", true)).toBe("allow");
    expect(employerJobCreateGate("INACTIVE", true)).toBe("blocked");
    expect(employerJobCreateGate(undefined, true)).toBe("blocked");
  });

  it("detects MEMBERSHIP_REQUIRED API errors", () => {
    expect(
      isEmployerMembershipRequiredError(
        new BffError({
          status: 403,
          code: "MEMBERSHIP_REQUIRED",
          message: "Employer membership is required to post jobs",
        }),
      ),
    ).toBe(true);
    expect(
      isEmployerMembershipRequiredError(
        new BffError({
          status: 403,
          code: "FORBIDDEN",
          message: "Forbidden",
        }),
      ),
    ).toBe(false);
  });
});

describe("status helpers", () => {
  it("maps payment statuses and badge tones", () => {
    expect(paymentStatusKey("CANCELLED")).toBe("CANCELLED");
    expect(employerMembershipBadgeTone("verified")).toBe("success");
    expect(employerMembershipBadgeTone("required")).toBe("warning");
    expect(new EmployerMembershipPayError("cancelled").code).toBe("cancelled");
  });
});

describe("price from API amount", () => {
  it("formats plan paise from the input, not a membership literal", () => {
    expect(formatPaise(PLAN.amountPaise)).toBe("₹99");
    expect(formatMembershipAmount(PLAN.amountPaise, PLAN.currency)).toBe(
      "₹99 INR",
    );
    expect(formatPaise(5000)).toBe("₹50");
    expect(orgVerificationPendingNote("UNVERIFIED")).toBe(true);
    expect(orgVerificationPendingNote("VERIFIED")).toBe(false);
  });

  it("does not hardcode 99 or 9900 in membership view helpers or panel", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const view = readFileSync(join(dir, "employer-membership-view.ts"), "utf8");
    const panel = readFileSync(join(dir, "employer-membership.tsx"), "utf8");
    const gate = readFileSync(
      join(dir, "employer-membership-required-dialog.tsx"),
      "utf8",
    );
    const settings = readFileSync(join(dir, "employer-settings.tsx"), "utf8");
    const membershipPage = readFileSync(
      join(dir, "../../app/[locale]/employer/membership/page.tsx"),
      "utf8",
    );
    expect(view).not.toMatch(/\b99\b/);
    expect(view).not.toMatch(/\b9900\b/);
    expect(panel).not.toMatch(/\b99\b/);
    expect(panel).not.toMatch(/\b9900\b/);
    expect(gate).not.toMatch(/\b99\b/);
    expect(gate).not.toMatch(/\b9900\b/);
    expect(settings).not.toMatch(/EMPLOYER_ACTIVATION/);
    expect(membershipPage).not.toMatch(/redirect/);
    expect(panel).not.toMatch("/employer/verification");
    expect(panel).not.toMatch("nextCompanyProfile");
    const organization = readFileSync(
      join(dir, "employer-organization.tsx"),
      "utf8",
    );
    expect(organization).not.toMatch("/employer/membership");
    expect(organization).not.toMatch("/employer/verification");
    const verification = readFileSync(
      join(dir, "employer-verification-page.tsx"),
      "utf8",
    );
    expect(verification).not.toMatch("/employer/membership");
    expect(verification).not.toMatch("/employer/organization");
    expect(verification).not.toMatch("stepDocumentCheck");
    expect(verification).not.toMatch("completeProfile");
  });
});
