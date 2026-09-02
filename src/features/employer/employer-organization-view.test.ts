import { describe, expect, it } from "vitest";

import {
  companyProfileChecklist,
  companyProfileCompletionPercent,
  isOrganizationVerified,
  isPremiumMembership,
  organizationVerificationBadgeKey,
} from "./employer-organization-view";

const empty = {
  fullName: "",
  name: "",
  description: "",
  contactEmail: "",
  contactPhone: "",
  districtId: "",
  cityId: "",
};

describe("companyProfileCompletionPercent", () => {
  it("is 0 when no fields are filled", () => {
    expect(companyProfileCompletionPercent(empty)).toBe(0);
  });

  it("counts filled fields without a hardcoded percent", () => {
    expect(
      companyProfileCompletionPercent({
        ...empty,
        fullName: "MO",
        name: "Monkrov",
        description: "It is a IT Company",
        contactEmail: "a@b.com",
        contactPhone: "+919898989898",
        districtId: "d1",
      }),
    ).toBe(86);
    expect(
      companyProfileCompletionPercent({
        ...empty,
        fullName: "MO",
        name: "Monkrov",
        description: "It is a IT Company",
        contactEmail: "a@b.com",
        contactPhone: "+919898989898",
        districtId: "d1",
        cityId: "c1",
      }),
    ).toBe(100);
  });
});

describe("companyProfileChecklist", () => {
  it("requires name, district, and phone or email", () => {
    expect(
      companyProfileChecklist({
        name: "Monkrov",
        districtId: "d1",
        contactEmail: "",
        contactPhone: "+91",
      }),
    ).toEqual([
      { key: "name", ok: true },
      { key: "location", ok: true },
      { key: "contact", ok: true },
    ]);
    expect(
      companyProfileChecklist({
        name: "",
        districtId: "",
        contactEmail: "",
        contactPhone: "",
      }).every((item) => !item.ok),
    ).toBe(true);
  });
});

describe("organization status helpers", () => {
  it("maps verification and membership from backend fields", () => {
    expect(isOrganizationVerified("VERIFIED")).toBe(true);
    expect(isOrganizationVerified("UNVERIFIED")).toBe(false);
    expect(isPremiumMembership("ACTIVE")).toBe(true);
    expect(isPremiumMembership("INACTIVE")).toBe(false);
    expect(organizationVerificationBadgeKey("UNVERIFIED")).toBe(
      "orgUnverifiedOrganization",
    );
    expect(organizationVerificationBadgeKey("VERIFIED")).toBe(
      "orgVerifiedOrganization",
    );
  });
});
