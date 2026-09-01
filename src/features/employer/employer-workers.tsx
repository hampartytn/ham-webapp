"use client";

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

import { EmployerDetailDrawer } from "@/components/employer/employer-detail-drawer";
import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationControls } from "@/components/shared/pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions, skillsQueryOptions } from "@/lib/query/catalog";
import type { WorkerCard } from "@/types/ham";

const AVAILABILITY = ["", "AVAILABLE", "NOT_AVAILABLE", "AVAILABLE_FROM"] as const;

export function EmployerWorkers() {
  const t = useTranslations("employer");
  const [page, setPage] = useState(1);
  const [districtId, setDistrictId] = useState("");
  const [skillId, setSkillId] = useState("");
  const [availabilityStatus, setAvailabilityStatus] = useState("");
  const [selected, setSelected] = useState<WorkerCard | null>(null);

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const skillsQ = useQuery(skillsQueryOptions);

  const districtName = useMemo(() => {
    const map = new Map<string, string>();
    for (const d of districtsQ.data ?? []) map.set(d.id, d.name);
    return map;
  }, [districtsQ.data]);

  const listQ = useQuery({
    queryKey: ["workers", page, districtId, skillId, availabilityStatus],
    placeholderData: keepPreviousData,
    queryFn: () =>
      bffEnvelope<WorkerCard[], OffsetMeta>(
        proxyPath("employer/workers", {
          page,
          limit: 20,
          ...(districtId ? { districtId } : {}),
          ...(skillId ? { skillId } : {}),
          ...(availabilityStatus ? { availabilityStatus } : {}),
        }),
      ),
  });

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-5">
      <EmployerPageHeader
        title={t("navEmployees")}
        subtitle={t("workersSubtitle")}
      />
      <p className="text-sm text-[var(--emp-muted)]">{t("privacyNote")}</p>

      <div className="grid gap-3 rounded-xl border border-[var(--emp-border)] bg-white p-4 sm:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("district")}</label>
          <select
            className="ham-employer__input"
            value={districtId}
            onChange={(e) => {
              setDistrictId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("filterAll")}</option>
            {(districtsQ.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("skills")}</label>
          <select
            className="ham-employer__input"
            value={skillId}
            onChange={(e) => {
              setSkillId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t("filterAll")}</option>
            {(skillsQ.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">{t("availabilityLabel")}</label>
          <select
            className="ham-employer__input"
            value={availabilityStatus}
            onChange={(e) => {
              setAvailabilityStatus(e.target.value);
              setPage(1);
            }}
          >
            {AVAILABILITY.map((a) => (
              <option key={a || "all"} value={a}>
                {a
                  ? t(`availability.${a}` as "availability.AVAILABLE")
                  : t("filterAll")}
              </option>
            ))}
          </select>
        </div>
      </div>

      {listQ.isPending && !listQ.data ? (
        <LoadingState />
      ) : listQ.error ? (
        <ErrorState onRetry={() => void listQ.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState title={t("noWorkersFound")} description={t("noWorkersHint")} />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                className="ham-employer__card h-full w-full p-5 text-left transition-shadow hover:shadow-md"
                onClick={() => setSelected(w)}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{w.fullName ?? w.id}</p>
                  {w.identityVerified ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-800">
                      {t("identityVerified")}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-[var(--emp-muted)]">
                  {w.districtId
                    ? (districtName.get(w.districtId) ?? w.districtId)
                    : "—"}
                  {w.availabilityStatus
                    ? ` · ${t(`availability.${w.availabilityStatus}` as "availability.AVAILABLE")}`
                    : ""}
                </p>
                <ul className="mt-3 flex flex-wrap gap-1">
                  {w.skills.slice(0, 4).map((s) => (
                    <li
                      key={s.skillId}
                      className="rounded bg-[var(--emp-soft)] px-2 py-0.5 text-xs"
                    >
                      {s.name}
                    </li>
                  ))}
                </ul>
              </button>
            </li>
          ))}
        </ul>
      )}

      {meta && items.length > 0 ? (
        <PaginationControls
          page={page}
          hasPrevious={page > 1}
          hasNext={page < totalPages}
          onPrevious={() => setPage((p) => p - 1)}
          onNext={() => setPage((p) => p + 1)}
        />
      ) : null}

      <EmployerDetailDrawer
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title={selected?.fullName ?? t("workerDetail")}
        description={t("privacyNote")}
      >
        {selected ? (
          <div className="space-y-4 text-sm">
            {selected.identityVerified ? (
              <StatusBadge
                status="VERIFIED"
                label={t("identityVerified")}
              />
            ) : null}
            <p>
              <span className="font-medium">{t("district")}: </span>
              {selected.districtId
                ? (districtName.get(selected.districtId) ?? selected.districtId)
                : "—"}
            </p>
            {selected.availabilityStatus ? (
              <p>
                <span className="font-medium">{t("availabilityLabel")}: </span>
                {t(
                  `availability.${selected.availabilityStatus}` as "availability.AVAILABLE",
                )}
              </p>
            ) : null}
            <div>
              <p className="font-medium">{t("skills")}</p>
              <ul className="mt-1 flex flex-wrap gap-1">
                {selected.skills.map((s) => (
                  <li
                    key={s.skillId}
                    className="rounded bg-[var(--emp-soft)] px-2 py-0.5 text-xs"
                  >
                    {s.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </EmployerDetailDrawer>
    </div>
  );
}
