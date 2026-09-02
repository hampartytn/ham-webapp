import { describe, expect, it } from "vitest";

import type { EmployerJob } from "@/types/ham";

import {
  applicantProgressPercent,
  applicantStatusCounts,
  filterJobsByTitle,
  formatJobCompensation,
  jobCanClose,
  jobCanPublish,
  jobHasText,
  jobPostedAt,
  jobLocationLine,
  newApplicantCount,
  newApplicantSharePercent,
  sortEmployerJobs,
  sumApplicantTotals,
} from "./employer-jobs-view";

const job = (
  over: Partial<EmployerJob> & { title: string; createdAt: string },
): EmployerJob =>
  ({
    id: over.title,
    jobType: "FULL_TIME",
    status: "PUBLISHED",
    districtId: "d1",
    cityId: null,
    areaId: null,
    vacancies: 1,
    wageMinPaise: 20000,
    wageMaxPaise: null,
    wagePeriod: "DAY",
    publishedAt: null,
    organization: { id: "o1", name: "Org" },
    skills: [],
    description: "",
    createdByUserId: "u1",
    closedAt: null,
    updatedAt: over.createdAt,
    ...over,
  }) as EmployerJob;

describe("filterJobsByTitle", () => {
  it("filters by case-insensitive title", () => {
    const jobs = [
      job({ title: "Macanic", createdAt: "2024-01-01" }),
      job({ title: "Electrician", createdAt: "2024-01-02" }),
    ];
    expect(filterJobsByTitle(jobs, "mac").map((j) => j.title)).toEqual([
      "Macanic",
    ]);
    expect(filterJobsByTitle(jobs, "  ").length).toBe(2);
  });
});

describe("sortEmployerJobs", () => {
  it("sorts by posted date and title", () => {
    const jobs = [
      job({ title: "B", createdAt: "2024-01-01", publishedAt: "2024-01-01" }),
      job({ title: "A", createdAt: "2024-02-01", publishedAt: "2024-02-01" }),
    ];
    expect(sortEmployerJobs(jobs, "newest").map((j) => j.title)).toEqual([
      "A",
      "B",
    ]);
    expect(sortEmployerJobs(jobs, "oldest").map((j) => j.title)).toEqual([
      "B",
      "A",
    ]);
    expect(sortEmployerJobs(jobs, "title").map((j) => j.title)).toEqual([
      "A",
      "B",
    ]);
  });
});

describe("applicant helpers", () => {
  it("counts submitted as new and progress against vacancies", () => {
    expect(
      newApplicantCount([
        { status: "SUBMITTED" },
        { status: "VIEWED" },
        { status: "SUBMITTED" },
      ]),
    ).toBe(2);
    expect(
      applicantStatusCounts([
        { status: "SHORTLISTED" },
        { status: "HIRED" },
        { status: "SUBMITTED" },
      ]),
    ).toEqual({ total: 3, shortlisted: 1, hired: 1, submitted: 1 });
    expect(applicantProgressPercent(0, 4)).toBe(0);
    expect(applicantProgressPercent(2, 4)).toBe(50);
    expect(applicantProgressPercent(8, 4)).toBe(100);
    expect(newApplicantSharePercent(5, 24)).toBe(21);
    expect(newApplicantSharePercent(0, 0)).toBe(0);
    expect(sumApplicantTotals([24, undefined, 10, null])).toBe(34);
  });
});

describe("jobLocationLine", () => {
  it("joins location and type when both exist", () => {
    expect(jobLocationLine("Coimbatore", "Full time")).toBe(
      "Coimbatore • Full time",
    );
    expect(jobLocationLine("  ", "Full time")).toBe("Full time");
    expect(jobLocationLine("Coimbatore", "")).toBe("Coimbatore");
  });
});

describe("job field helpers", () => {
  it("formats compensation only when a wage exists", () => {
    expect(formatJobCompensation(null, null, "Per day")).toBeNull();
    expect(formatJobCompensation(20000, null, "Per day")).toBe(
      "₹200 / Per day",
    );
    expect(formatJobCompensation(20000, 40000, "Per day")).toBe(
      "₹200 – ₹400 / Per day",
    );
    expect(
      jobPostedAt({ publishedAt: "2024-08-26", createdAt: "2024-01-01" }),
    ).toBe("2024-08-26");
    expect(jobCanPublish("DRAFT")).toBe(true);
    expect(jobCanPublish("PUBLISHED")).toBe(false);
    expect(jobCanClose("CLOSED")).toBe(false);
    expect(jobHasText("  hello ")).toBe(true);
    expect(jobHasText("   ")).toBe(false);
  });
});
