import type { QueryClient } from "@tanstack/react-query";

import { bffEnvelope, bffJson, type OffsetMeta, proxyPath } from "@/lib/api/bff-client";
import { prefetchMe } from "@/lib/query/session-cache";
import type {
  ApplicationItem,
  EmployeeProfile,
  EmployerJob,
  EmployerOrg,
  MembershipStatus,
  VerificationMe,
} from "@/types/ham";

/** Hover-only warm-up. Never call from a click handler. */
export function prefetchRoleHref(queryClient: QueryClient, href: string): void {
  prefetchMe(queryClient);

  if (href === "/employer" || href === "/employer/jobs") {
    const dashboard = href === "/employer";
    void queryClient.prefetchQuery({
      queryKey: dashboard
        ? (["employer-jobs", "dashboard"] as const)
        : (["employer-jobs", 1, ""] as const),
      queryFn: () =>
        bffEnvelope<EmployerJob[], OffsetMeta>(
          proxyPath("employer/jobs", {
            page: 1,
            limit: dashboard ? 50 : 20,
          }),
        ),
      staleTime: 30_000,
    });
  }

  if (href === "/employer/applicants") {
    void queryClient.prefetchQuery({
      queryKey: ["employer-jobs", "applicants-hub"] as const,
      queryFn: () =>
        bffEnvelope<EmployerJob[], OffsetMeta>(
          proxyPath("employer/jobs", { page: 1, limit: 50 }),
        ),
      staleTime: 30_000,
    });
  }

  if (href === "/employer/organization") {
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
