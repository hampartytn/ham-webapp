import { describe, expect, it } from "vitest";

import { parseHamRole, isRoleAppPath } from "@/lib/auth/role";

describe("parseHamRole", () => {
  it("accepts known roles", () => {
    expect(parseHamRole("EMPLOYEE")).toBe("EMPLOYEE");
    expect(parseHamRole("EMPLOYER")).toBe("EMPLOYER");
    expect(parseHamRole("ADMIN")).toBe("ADMIN");
    expect(parseHamRole("SUPER_ADMIN")).toBe("SUPER_ADMIN");
  });

  it("rejects unknown or empty values", () => {
    expect(parseHamRole(undefined)).toBeUndefined();
    expect(parseHamRole("")).toBeUndefined();
    expect(parseHamRole("employer")).toBeUndefined();
    expect(parseHamRole("HACKER")).toBeUndefined();
  });
});

describe("isRoleAppPath", () => {
  it("matches role trees without locale prefix", () => {
    expect(isRoleAppPath("/employee")).toBe(true);
    expect(isRoleAppPath("/employee/jobs")).toBe(true);
    expect(isRoleAppPath("/employer/applicants")).toBe(true);
    expect(isRoleAppPath("/admin/users")).toBe(true);
  });

  it("does not match public routes", () => {
    expect(isRoleAppPath("/login")).toBe(false);
    expect(isRoleAppPath("/")).toBe(false);
    expect(isRoleAppPath("/jobs")).toBe(false);
    expect(isRoleAppPath("/employees")).toBe(false);
  });
});
