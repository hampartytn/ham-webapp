import { describe, expect, it } from "vitest";

import { nestErrorMessageKey } from "@/i18n/error-codes";
import { homePathForRole, safeRedirectPath } from "@/lib/auth/redirect";
import { resolveCatalogName } from "@/lib/utils/catalog-name";

describe("resolveCatalogName", () => {
  it("prefers active locale then en then first", () => {
    expect(
      resolveCatalogName({ ta: "தமிழ்", en: "English" }, "ta"),
    ).toBe("தமிழ்");
    expect(resolveCatalogName({ en: "English", hi: "हिंदी" }, "ta")).toBe(
      "English",
    );
    expect(resolveCatalogName({ hi: "हिंदी" }, "ta")).toBe("हिंदी");
    expect(resolveCatalogName({}, "en")).toBe("—");
  });
});

describe("nestErrorMessageKey", () => {
  it("maps known codes and falls back", () => {
    expect(nestErrorMessageKey("INVALID_CREDENTIALS")).toBe(
      "errors.INVALID_CREDENTIALS",
    );
    expect(nestErrorMessageKey("NOPE")).toBe("errors.UNKNOWN");
  });
});

describe("redirect helpers", () => {
  it("rejects open redirects", () => {
    expect(safeRedirectPath("//evil.com")).toBe("/");
    expect(safeRedirectPath("https://evil.com")).toBe("/");
    expect(safeRedirectPath("/ta/employee")).toBe("/employee");
    expect(homePathForRole("EMPLOYER")).toBe("/employer");
  });
});
