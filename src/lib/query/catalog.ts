import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { CatalogItem } from "@/types/ham";

/** Reference catalogs change rarely; do not block login on these. */
export const CATALOG_STALE_MS = 10 * 60 * 1000;

export const geoDistrictsQueryOptions = {
  queryKey: ["geo-districts"] as const,
  queryFn: () => bffJson<CatalogItem[]>(proxyPath("geo/districts")),
  staleTime: CATALOG_STALE_MS,
};

export const skillsQueryOptions = {
  queryKey: ["skills"] as const,
  queryFn: () => bffJson<CatalogItem[]>(proxyPath("skills")),
  staleTime: CATALOG_STALE_MS,
};
