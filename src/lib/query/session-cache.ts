import type { QueryClient } from "@tanstack/react-query";

import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { AuthUserView, PreferredLanguage } from "@/lib/api/types";
import type { MeResponse } from "@/types/ham";

export const AUTH_SESSION_QUERY_KEY = ["auth-session"] as const;
export const ME_QUERY_KEY = ["me"] as const;

export const ME_STALE_MS = 60_000;
export const AUTH_SESSION_STALE_MS = 60_000;

export function seedAuthSession(queryClient: QueryClient, user: AuthUserView) {
  queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, user);
}

export function prefetchMe(queryClient: QueryClient): void {
  void queryClient.prefetchQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: ME_STALE_MS,
  });
}

export function applyPreferredLanguageCache(
  queryClient: QueryClient,
  preferredLanguage: PreferredLanguage,
): void {
  queryClient.setQueryData<MeResponse>(ME_QUERY_KEY, (prev) =>
    prev ? { ...prev, preferredLanguage } : prev,
  );
  queryClient.setQueryData<AuthUserView>(AUTH_SESSION_QUERY_KEY, (prev) =>
    prev ? { ...prev, preferredLanguage } : prev,
  );
}

/** Update cache immediately; persist PATCH in the background. */
export function persistPreferredLanguage(
  queryClient: QueryClient,
  preferredLanguage: PreferredLanguage,
): void {
  applyPreferredLanguageCache(queryClient, preferredLanguage);
  void bffJson(proxyPath("me"), {
    method: "PATCH",
    body: JSON.stringify({ preferredLanguage }),
  }).catch(() => {
    /* guest or transient — UI locale already switched */
  });
}
