import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { assertCsrf } from "@/lib/auth/csrf";
import { isNestErrorBody } from "@/lib/api/errors";
import { safeRedirectPath } from "@/lib/auth/redirect";

describe("assertCsrf", () => {
  it("allows localhost origin", () => {
    const req = new NextRequest("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { origin: "http://localhost:3001" },
    });
    expect(assertCsrf(req)).toBeNull();
  });

  it("rejects foreign origin", () => {
    const req = new NextRequest("http://localhost:3001/api/auth/login", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    const res = assertCsrf(req);
    expect(res?.status).toBe(403);
  });

  it("skips GET", () => {
    const req = new NextRequest("http://localhost:3001/api/auth/session", {
      method: "GET",
    });
    expect(assertCsrf(req)).toBeNull();
  });
});

describe("isNestErrorBody", () => {
  it("detects Nest envelope", () => {
    expect(
      isNestErrorBody({
        error: { code: "NOT_ENABLED", message: "nope" },
      }),
    ).toBe(true);
    expect(isNestErrorBody({ data: {} })).toBe(false);
  });
});

describe("safeRedirectPath", () => {
  it("blocks open redirects", () => {
    expect(safeRedirectPath("//x.com")).toBe("/");
    expect(safeRedirectPath("/en/employee/jobs")).toBe("/employee/jobs");
  });
});
