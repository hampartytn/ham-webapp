import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { EmployerMembership } from "@/types/ham";

export const EMPLOYER_MEMBERSHIP_QUERY_KEY = ["employer-membership"] as const;

export const employerMembershipQueryOptions = {
  queryKey: EMPLOYER_MEMBERSHIP_QUERY_KEY,
  queryFn: () =>
    bffJson<EmployerMembership>(proxyPath("employer/membership")),
  staleTime: 30_000,
};
