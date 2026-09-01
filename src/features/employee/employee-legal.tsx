"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationControls } from "@/components/shared/pagination";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions } from "@/lib/query/catalog";
import type { CatalogItem, LegalProvider } from "@/types/ham";

export function EmployeeLegalDirectory() {
  const t = useTranslations("employee");
  const [districtId, setDistrictId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const catsQ = useQuery({
    queryKey: ["legal-categories"],
    queryFn: () =>
      bffJson<CatalogItem[]>(proxyPath("legal-support/categories")),
  });

  const listQ = useQuery({
    queryKey: ["legal-providers", districtId, categoryId, page],
    enabled: Boolean(districtId),
    placeholderData: keepPreviousData,
    queryFn: () =>
      bffEnvelope<LegalProvider[], OffsetMeta>(
        proxyPath("legal-support/providers", {
          districtId,
          categoryId: categoryId || undefined,
          page,
          limit: 20,
        }),
      ),
  });

  const detailQ = useQuery({
    queryKey: ["legal-provider", selected],
    enabled: Boolean(selected),
    queryFn: () =>
      bffJson<LegalProvider & { coverages?: unknown[] }>(
        proxyPath(`legal-support/providers/${selected}`),
      ),
  });

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("legalTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("legalHint")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          className="h-10 rounded-md border border-input px-3 text-sm"
          value={districtId}
          onChange={(e) => {
            setDistrictId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("district")}</option>
          {(districtsQ.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <select
          className="h-10 rounded-md border border-input px-3 text-sm"
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
        >
          <option value="">{t("category")}</option>
          {(catsQ.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {!districtId ? (
        <p className="text-sm text-muted-foreground">{t("searchProviders")}</p>
      ) : null}
      {listQ.isPending && !listQ.data ? <LoadingState /> : null}
      {listQ.error ? (
        <ErrorState onRetry={() => void listQ.refetch()} />
      ) : null}
      {districtId && !listQ.isPending && items.length === 0 ? (
        <EmptyState />
      ) : null}

      <ul className="space-y-3">
        {items.map((p) => (
          <li key={p.id} className="border-b border-border pb-3">
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-0 text-left font-medium"
              onClick={() => setSelected(p.id)}
            >
              {p.name}
            </Button>
            <p className="text-sm text-muted-foreground">{p.category.name}</p>
            <p className="text-xs">{t("trustLevel", { level: p.trustLevel })}</p>
          </li>
        ))}
      </ul>

      {meta ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}

      {detailQ.data ? (
        <div className="rounded-md border border-border p-4 text-sm space-y-1">
          <h2 className="text-lg font-medium">{detailQ.data.name}</h2>
          <p>{detailQ.data.description}</p>
          <p>
            {t("contact")}: {detailQ.data.phone ?? "—"} /{" "}
            {detailQ.data.email ?? "—"}
          </p>
          <p>{detailQ.data.addressText}</p>
        </div>
      ) : null}
    </div>
  );
}
