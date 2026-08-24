import { test, expect } from "@playwright/test";

/**
 * Requires running Next on :3001. Skipped by default in CI without servers.
 */
test.describe("public smoke", () => {
  test("landing loads with HAM brand", async ({ page }) => {
    test.skip(
      !process.env.E2E_LIVE,
      "Set E2E_LIVE=1 with npm run dev + Nest",
    );
    await page.goto("/ta");
    await expect(page.getByRole("heading", { name: "HAM" })).toBeVisible();
  });
});
