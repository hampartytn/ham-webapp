import { describe, expect, it } from "vitest";

import {
  formatNationalDisplay,
  isValidE164,
  splitE164,
  toE164,
} from "./phone";

describe("phone helpers", () => {
  it("builds India E.164", () => {
    expect(toE164("+91", "9900000001")).toBe("+919900000001");
  });

  it("accepts valid E.164", () => {
    expect(isValidE164("+919900000001")).toBe(true);
  });

  it("rejects bare national numbers as E.164", () => {
    expect(isValidE164("9900000001")).toBe(false);
  });

  it("formats national display", () => {
    expect(formatNationalDisplay("9876543210")).toBe("98765 43210");
  });

  it("splits India E.164", () => {
    expect(splitE164("+919876543210")).toEqual({
      country: expect.objectContaining({ dialCode: "+91" }),
      nationalDigits: "9876543210",
    });
  });
});
