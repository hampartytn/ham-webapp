import { keepPreviousData } from "@tanstack/react-query";

import { bffEnvelope, type OffsetMeta, proxyPath } from "@/lib/api/bff-client";
import type { EmployerJob } from "@/types/ham";

/** Shared first-page job feed (dashboard, applicants hub, hover warm-up). */
export const EMPLOYER_JOBS_FEED_LIMIT = 50;

export const employerJobsFeedQueryKey = ["employer-jobs", 1, 50, ""] as const;

export const employerJobsFeedQueryOptions = {
  queryKey: employerJobsFeedQueryKey,
  queryFn: () =>
    bffEnvelope<EmployerJob[], OffsetMeta>(
      proxyPath("employer/jobs", { page: 1, limit: EMPLOYER_JOBS_FEED_LIMIT }),
    ),
  staleTime: 30_000,
  placeholderData: keepPreviousData,
};
