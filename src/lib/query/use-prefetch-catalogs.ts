"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import {
  geoDistrictsQueryOptions,
  skillsQueryOptions,
} from "@/lib/query/catalog";
import { scheduleIdle } from "@/lib/query/idle-schedule";

/** Warm catalogs after the shell paints. Never call this before login navigation. */
export function usePrefetchCatalogs() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const cancel = scheduleIdle(() => {
      void queryClient.prefetchQuery(geoDistrictsQueryOptions);
      void queryClient.prefetchQuery(skillsQueryOptions);
    });
    return cancel;
  }, [queryClient]);
}
