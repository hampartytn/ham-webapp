import { describe, expect, it } from "vitest";
import { z } from "zod";

/** Mirrors register form phone + password rules from Nest DTOs. */
const registerSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
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
    expect(registerSchema.safeParse({ phone: "+919900000001" }).success).toBe(
      true,
    );
  });

  it("rejects non-E.164 phone", () => {
    expect(registerSchema.safeParse({ phone: "9900000001" }).success).toBe(
      false,
    );
  });

  it("rejects numeric-only password", () => {
    expect(
      registerSchema.safeParse({
        phone: "+919900000001",
        password: "1234567890",
      }).success,
    ).toBe(false);
  });

  it("accepts strong optional password", () => {
    expect(
      registerSchema.safeParse({
        phone: "+919900000001",
        password: "secure-pass-1",
      }).success,
    ).toBe(true);
  });
});
