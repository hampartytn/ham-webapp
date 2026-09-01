"use client";

import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { BffError, bffJson, proxyPath } from "@/lib/api/bff-client";
import { ME_QUERY_KEY, ME_STALE_MS } from "@/lib/query/session-cache";
import type { MeResponse } from "@/types/ham";

/**
 * Live account status after chrome is already painted. Does not block children.
 * Nest APIs remain the authority (401/403 on data).
 */
export function AccountStatusGate({ children }: { children: ReactNode }) {
  const meQ = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: ME_STALE_MS,
    retry: false,
  });

  const code =
    meQ.error instanceof BffError
      ? meQ.error.code
      : meQ.data?.accountStatus === "SUSPENDED"
        ? "ACCOUNT_SUSPENDED"
        : meQ.data?.accountStatus === "BLOCKED"
          ? "ACCOUNT_BLOCKED"
          : undefined;

  if (code === "ACCOUNT_SUSPENDED" || code === "ACCOUNT_BLOCKED") {
    return <ErrorState code={code} />;
  }

  return children;
}
