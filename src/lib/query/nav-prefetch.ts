import type { QueryClient } from "@tanstack/react-query";

import { bffEnvelope, bffJson, type OffsetMeta, proxyPath } from "@/lib/api/bff-client";
import { employerJobsFeedQueryOptions } from "@/lib/query/employer-jobs";
import { employerMembershipQueryOptions } from "@/lib/query/employer-membership";
import {
  cancelNavDataPrefetch,
  scheduleNavDataPrefetch,
} from "@/lib/query/idle-schedule";
import { ME_QUERY_KEY, prefetchMe } from "@/lib/query/session-cache";
import type {
  ApplicationItem,
  EmployeeProfile,
  EmployerJob,
  EmployerOrg,
  MembershipStatus,
  VerificationMe,
} from "@/types/ham";

export { cancelNavDataPrefetch as cancelIdleWork };

/** Hover-only warm-up. Never call from a click handler. */
export function prefetchRoleHrefIdle(queryClient: QueryClient, href: string): void {
  scheduleNavDataPrefetch(() => prefetchRoleHref(queryClient, href));
}

/** Hover-only warm-up. Never call from a click handler. */
export function prefetchRoleHref(queryClient: QueryClient, href: string): void {
  if (!queryClient.getQueryData(ME_QUERY_KEY)) {
    prefetchMe(queryClient);
  }

  if (href === "/employer") {
    void queryClient.prefetchQuery(employerJobsFeedQueryOptions);
    void queryClient.prefetchQuery(employerMembershipQueryOptions);
  }

  if (href === "/employer/applicants") {
    void queryClient.prefetchQuery(employerJobsFeedQueryOptions);
  }

  if (href === "/employer/jobs") {
    void queryClient.prefetchQuery({
      queryKey: ["employer-jobs", 1, ""] as const,
      queryFn: () =>
        bffEnvelope<EmployerJob[], OffsetMeta>(
          proxyPath("employer/jobs", { page: 1, limit: 20 }),
        ),
      staleTime: 30_000,
    });
  }

  if (href === "/employer/organization" || href === "/employer/verification") {
    void queryClient.prefetchQuery({
      queryKey: ["employer-profile"] as const,
      queryFn: () =>
        bffJson<{
          id: string;
          fullName: string | null;
          organization: EmployerOrg | null;
        }>(proxyPath("employer/profile")),
    });
  }

  if (
    href === "/employer/membership" ||
    href === "/employer/verification" ||
    href === "/employer/organization"
  ) {
    void queryClient.prefetchQuery(employerMembershipQueryOptions);
  }

  if (href === "/employee/profile") {
    void queryClient.prefetchQuery({
      queryKey: ["employee-profile"] as const,
      queryFn: () => bffJson<EmployeeProfile>(proxyPath("employee/profile")),
    });
  }

  if (href === "/employee/applications") {
    void queryClient.prefetchQuery({
      queryKey: ["applications", 1] as const,
      queryFn: () =>
        bffEnvelope<ApplicationItem[], OffsetMeta>(
          proxyPath("applications", { page: 1, limit: 20 }),
        ),
    });
  }

  if (href === "/employee/verification") {
    void queryClient.prefetchQuery({
      queryKey: ["verification-me"] as const,
      queryFn: () => bffJson<VerificationMe>(proxyPath("verification/me")),
    });
  }

  if (href === "/employee/membership") {
    void queryClient.prefetchQuery({
      queryKey: ["membership"] as const,
      queryFn: () => bffJson<MembershipStatus>(proxyPath("membership")),
    });
  }

  if (href === "/admin/jobs") {
    void queryClient.prefetchQuery({
      queryKey: ["admin-jobs", 1] as const,
      queryFn: () =>
        bffEnvelope<
          { id: string; title: string; status: string; organization: string }[],
          OffsetMeta
        >(proxyPath("admin/jobs", { page: 1, limit: 20 })),
    });
  }
}
