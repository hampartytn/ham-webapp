import { describe, expect, it } from "vitest";
import { z } from "zod";

import { isValidE164 } from "@/lib/auth/phone";

/** Mirrors simplified register form + Nest DTO phone rules. */
const registerSchema = z.object({
  phone: z.string().refine(isValidE164),
  role: z.enum(["EMPLOYEE", "EMPLOYER"]),
  password: z
    .string()
    .optional()
    .refine(
      (v) => !v || (/^(?!\d+$).{10,}$/.test(v) && v.length >= 10),
      "password rules",
    ),
});

describe("auth form validation (Nest-aligned)", () => {
  it("accepts E.164 phone", () => {
    expect(
      registerSchema.safeParse({
        phone: "+919900000001",
        role: "EMPLOYEE",
      }).success,
    ).toBe(true);
  });

  it("rejects non-E.164 phone", () => {
    expect(
      registerSchema.safeParse({
        phone: "9900000001",
        role: "EMPLOYEE",
      }).success,
    ).toBe(false);
  });

  it("rejects numeric-only password when provided", () => {
    expect(
      registerSchema.safeParse({
        phone: "+919900000001",
        role: "EMPLOYER",
        password: "1234567890",
      }).success,
    ).toBe(false);
  });

  it("accepts strong optional password", () => {
    expect(
      registerSchema.safeParse({
        phone: "+919900000001",
        role: "EMPLOYEE",
        password: "secure-pass-1",
      }).success,
    ).toBe(true);
  });
});
