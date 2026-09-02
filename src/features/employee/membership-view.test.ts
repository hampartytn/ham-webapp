import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { formatPaise } from "@/components/shared/status-badge";

import {
  MembershipPayError,
  isPayEnabled,
  isPayVisible,
  membershipStatusKey,
  paymentStatusKey,
} from "./membership-view";

const PLAN = {
  id: "plan-1",
  code: "employee-ham-membership",
  name: "HAM membership",
  amountPaise: 9900,
  currency: "INR",
};

describe("isPayEnabled", () => {
  it("is disabled without canPay, terms, plan, or while paying", () => {
    expect(
      isPayEnabled({
        canPay: false,
        accepted: true,
        paying: false,
        hasPlan: true,
      }),
    ).toBe(false);
    expect(
      isPayEnabled({
        canPay: true,
        accepted: false,
        paying: false,
        hasPlan: true,
      }),
    ).toBe(false);
    expect(
      isPayEnabled({
        canPay: true,
        accepted: true,
        paying: true,
        hasPlan: true,
      }),
    ).toBe(false);
    expect(
      isPayEnabled({
        canPay: true,
        accepted: true,
        paying: false,
        hasPlan: false,
      }),
    ).toBe(false);
  });

  it("is enabled when canPay, terms accepted, plan present, and not paying", () => {
    expect(
      isPayEnabled({
        canPay: true,
        accepted: true,
        paying: false,
        hasPlan: true,
      }),
    ).toBe(true);
  });
});

describe("isPayVisible", () => {
  it("shows Pay when a plan exists and membership is not JOINED", () => {
    expect(isPayVisible({ plan: PLAN, status: null })).toBe(true);
    expect(isPayVisible({ plan: PLAN, status: "DECLINED" })).toBe(true);
  });

  it("hides Pay after JOINED even if a plan is returned", () => {
    expect(isPayVisible({ plan: PLAN, status: "JOINED" })).toBe(false);
  });
});

describe("status labels", () => {
  it("maps known membership statuses and treats null as not a member", () => {
    expect(membershipStatusKey(null)).toBe("NONE");
    expect(membershipStatusKey("JOINED")).toBe("JOINED");
    expect(membershipStatusKey("DECLINED")).toBe("DECLINED");
    expect(membershipStatusKey("WITHDRAWN")).toBe("WITHDRAWN");
    expect(membershipStatusKey("EXPIRED")).toBe("NONE");
  });

  it("maps payment statuses without treating cancel as paid or joined", () => {
    expect(paymentStatusKey("CANCELLED")).toBe("CANCELLED");
    expect(paymentStatusKey("SUCCEEDED")).toBe("SUCCEEDED");
    expect(membershipStatusKey(null)).not.toBe("JOINED");
    expect(new MembershipPayError("cancelled").code).toBe("cancelled");
  });
});

describe("price from API amount", () => {
  it("formats 9900 paise as ₹99 from the input, not a membership literal", () => {
    expect(formatPaise(9900)).toBe("₹99");
    expect(formatPaise(5000)).toBe("₹50");
  });

  it("does not hardcode 99 or 9900 in membership view helpers or panel", () => {
    const dir = dirname(fileURLToPath(import.meta.url));
    const view = readFileSync(join(dir, "membership-view.ts"), "utf8");
    const panel = readFileSync(join(dir, "employee-membership.tsx"), "utf8");
    expect(view).not.toMatch(/\b99\b/);
    expect(view).not.toMatch(/\b9900\b/);
    expect(panel).not.toMatch(/\b99\b/);
    expect(panel).not.toMatch(/\b9900\b/);
  });
});
