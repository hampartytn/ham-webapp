"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef } from "react";

import { usePathname, useRouter } from "@/i18n/navigation";
import {
  isAppLocale,
  resolveAppLocale,
  type AppLocale,
} from "@/i18n/routing";
import { bffJson } from "@/lib/api/bff-client";
import type { AuthUserView } from "@/lib/api/types";

/**
 * For authenticated users, UI locale follows backend preferredLanguage
 * (source of truth). Guests keep next-intl routing (default Hindi).
 */
export function PreferredLocaleSync() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const syncedFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      try {
        const data = await bffJson<{ user: AuthUserView }>(
          "/api/auth/session",
          { method: "GET" },
        );
        if (cancelled) return;
        const preferred = resolveAppLocale(data.user.preferredLanguage);
        const key = `${data.user.id}:${preferred}`;
        if (syncedFor.current === key) return;
        if (preferred === locale || !isAppLocale(preferred)) {
          syncedFor.current = key;
          return;
        }
        syncedFor.current = key;
        router.replace(pathname, { locale: preferred as AppLocale });
      } catch {
        // Unauthenticated — leave default / current locale alone.
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [locale, pathname, router]);

  return null;
}
