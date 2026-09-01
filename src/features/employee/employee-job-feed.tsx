"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { formatPaise } from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import {
  bffEnvelope,
  type CursorMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import type { PublicJob } from "@/types/ham";

export function EmployeeJobFeed() {
  const t = useTranslations("employee");
  const [districtId, setDistrictId] = useState("");

  const feed = useInfiniteQuery({
    queryKey: ["jobs-feed", districtId],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      return bffEnvelope<PublicJob[], CursorMeta>(
        proxyPath("jobs", {
          cursor: pageParam,
          limit: 20,
          districtId: districtId || undefined,
        }),
      );
    },
    getNextPageParam: (last) => last.meta?.nextCursor ?? undefined,
  });

  const jobs = feed.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{t("findJobs")}</h1>
      <div className="flex flex-wrap gap-2">
        <input
          className="h-10 rounded-md border border-input px-3 text-sm"
          placeholder="districtId (optional)"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
        />
      </div>

      {feed.isPending && !feed.data ? <LoadingState /> : null}
      {feed.error ? (
        <ErrorState onRetry={() => void feed.refetch()} />
      ) : null}
      {!feed.isPending && jobs.length === 0 ? <EmptyState /> : null}

      <ul className="space-y-4">
        {jobs.map((job) => (
          <li key={job.id} className="border-b border-border pb-4">
            <Link
              href={`/employee/jobs/${job.id}`}
              className="text-lg font-medium underline-offset-4 hover:underline"
            >
              {job.title}
            </Link>
            <p className="text-sm text-muted-foreground">
              {job.organization.name} · {job.jobType}
            </p>
            <p className="text-sm">
              {t("wage")}: {formatPaise(job.wageMinPaise)}
              {job.wageMaxPaise != null
                ? ` – ${formatPaise(job.wageMaxPaise)}`
                : ""}
              {job.wagePeriod ? ` / ${job.wagePeriod}` : ""}
            </p>
          </li>
        ))}
      </ul>

      {feed.hasNextPage ? (
        <Button
          type="button"
          variant="outline"
          disabled={feed.isFetchingNextPage}
          onClick={() => void feed.fetchNextPage()}
        >
          {t("loadMore")}
        </Button>
      ) : null}
    </div>
  );
}
