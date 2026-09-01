"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import {
  isAppLocale,
  resolveAppLocale,
  type AppLocale,
} from "@/i18n/routing";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { AuthUserView } from "@/lib/api/types";
import { isRoleAppPath } from "@/lib/auth/role";
import {
  AUTH_SESSION_QUERY_KEY,
  ME_QUERY_KEY,
  ME_STALE_MS,
} from "@/lib/query/session-cache";
import type { MeResponse } from "@/types/ham";

/**
 * For authenticated users, UI locale follows backend preferredLanguage.
 * Guests keep next-intl routing (default Hindi). Does not call /api/auth/session
 * on public pages.
 */
export function PreferredLocaleSync() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const syncedFor = useRef<string | null>(null);
  const onRoleRoute = isRoleAppPath(pathname);

  const meQ = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: ME_STALE_MS,
    enabled: onRoleRoute,
    retry: false,
  });

  useEffect(() => {
    if (!onRoleRoute) return;
    const seeded = queryClient.getQueryData<AuthUserView>(
      AUTH_SESSION_QUERY_KEY,
    );
    const preferredLanguage =
      meQ.data?.preferredLanguage ?? seeded?.preferredLanguage;
    const userId = meQ.data?.id ?? seeded?.id;
    if (!preferredLanguage || !userId) return;

    const preferred = resolveAppLocale(preferredLanguage);
    const key = `${userId}:${preferred}`;
    if (syncedFor.current === key) return;
    if (preferred === locale || !isAppLocale(preferred)) {
      syncedFor.current = key;
      return;
    }
    syncedFor.current = key;
    router.replace(pathname, { locale: preferred as AppLocale });
  }, [onRoleRoute, meQ.data, locale, pathname, router, queryClient]);

  return null;
}
