import { describe, expect, it } from "vitest";

import {
  buildAttentionItems,
  displayWorkerName,
  looksLikeId,
  workerInitials,
} from "./dashboard-utils";

describe("displayWorkerName", () => {
  it("returns real names", () => {
    expect(displayWorkerName("Priya Kumar", "Unnamed")).toBe("Priya Kumar");
  });

  it("never returns uuids", () => {
    expect(
      displayWorkerName(
        "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "Unnamed applicant",
      ),
    ).toBe("Unnamed applicant");
  });

  it("treats null as unnamed", () => {
    expect(displayWorkerName(null, "Unnamed applicant")).toBe(
      "Unnamed applicant",
    );
  });
});

describe("looksLikeId", () => {
  it("detects uuid", () => {
    expect(looksLikeId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("allows human names", () => {
    expect(looksLikeId("Sakkeer")).toBe(false);
  });
});

describe("workerInitials", () => {
  it("uses two letters from full name", () => {
    expect(workerInitials("Priya Kumar")).toBe("PK");
  });

  it("uses question mark for missing names", () => {
    expect(workerInitials(null)).toBe("?");
  });
});

describe("buildAttentionItems", () => {
  it("prioritizes missing org", () => {
    const items = buildAttentionItems({
      orgId: null,
      organization: null,
      draftCount: 2,
      submittedCount: 3,
    });
    expect(items[0]?.kind).toBe("org_missing");
  });

  it("includes submitted and drafts when org exists", () => {
    const items = buildAttentionItems({
      orgId: "org-1",
      organization: {
        districtId: "d1",
        contactPhone: "999",
        contactEmail: null,
      },
      draftCount: 1,
      submittedCount: 2,
    });
    expect(items.map((i) => i.kind)).toEqual([
      "submitted_applicants",
      "draft_jobs",
    ]);
  });
});
