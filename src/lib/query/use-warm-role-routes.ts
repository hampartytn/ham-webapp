"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

import { scheduleIdle } from "@/lib/query/idle-schedule";

/** Prefetch destination RSC after paint. Does not fetch Nest data. */
export function useWarmRoleRoutes(hrefs: readonly string[]) {
  const router = useRouter();
  const key = hrefs.join("\0");

  useEffect(() => {
    const list = key.split("\0").filter(Boolean);
    const cancel = scheduleIdle(() => {
      for (const href of list) {
        void router.prefetch(href);
      }
    });
    return cancel;
  }, [router, key]);
}
