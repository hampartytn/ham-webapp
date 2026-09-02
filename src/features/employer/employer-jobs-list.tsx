"use client";

import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Check,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Plus,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import {
  EmployerBadge,
  jobBadgeTone,
} from "@/components/employer/employer-badge";
import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PaginationControls } from "@/components/shared/pagination";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Link, useRouter } from "@/i18n/navigation";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import {
  EmployerPostJobButton,
  useEmployerJobCreateGate,
} from "@/features/employer/employer-job-create-gate";
import { EmployerMembershipRequiredDialog } from "@/features/employer/employer-membership-required-dialog";
import { isEmployerMembershipRequiredError } from "@/features/employer/employer-membership-view";
import { EmployerJobsSelect } from "@/features/employer/employer-jobs-select";
import {
  filterJobsByTitle,
  formatJobCompensation,
  jobCanClose,
  jobCanEdit,
  jobCanPublish,
  jobLocationLine,
  jobShowsPause,
  newApplicantCount,
  newApplicantSharePercent,
  sortEmployerJobs,
  sumApplicantTotals,
  uniqueJobsById,
  type JobListSort,
  type JobListStatusFilter,
} from "@/features/employer/employer-jobs-view";
import { geoDistrictsQueryOptions } from "@/lib/query/catalog";
import { employerJobsFeedQueryOptions } from "@/lib/query/employer-jobs";
import type { ApplicantItem, EmployerJob } from "@/types/ham";

const TABS = ["", "PUBLISHED", "DRAFT", "UNPUBLISHED", "CLOSED"] as const;

export function EmployerJobsList() {
  const t = useTranslations("employer");
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<JobListStatusFilter>("");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<JobListSort>("newest");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const districtName = districtNameMap(districtsQ.data);

  const listQ = useQuery({
    queryKey: ["employer-jobs", page, status],
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    queryFn: () =>
      bffEnvelope<EmployerJob[], OffsetMeta>(
        proxyPath("employer/jobs", {
          page,
          limit: 20,
          ...(status ? { status } : {}),
        }),
      ),
  });

  const tabCountQueries = useQueries({
    queries: TABS.map((tab) => ({
      queryKey: ["employer-jobs", "tab-count", tab],
      placeholderData: keepPreviousData,
      staleTime: 30_000,
      queryFn: () =>
        bffEnvelope<EmployerJob[], OffsetMeta>(
          proxyPath("employer/jobs", {
            page: 1,
            limit: 1,
            ...(tab ? { status: tab } : {}),
          }),
        ),
    })),
  });

  const feedQ = useQuery(employerJobsFeedQueryOptions);
  const pageJobs = listQ.data?.data ?? [];
  const countJobs = uniqueJobsById([...(feedQ.data?.data ?? []), ...pageJobs]);

  const countQueries = useQueries({
    queries: countJobs.map((job) => ({
      queryKey: ["applicants", job.id, 1, "jobs-stats"],
      queryFn: () =>
        bffEnvelope<ApplicantItem[], OffsetMeta>(
          proxyPath(`employer/jobs/${job.id}/applications`, {
            page: 1,
            limit: 1,
          }),
        ),
      staleTime: 30_000,
    })),
  });

  const filtered = sortEmployerJobs(filterJobsByTitle(pageJobs, q), sort);
  const meta = listQ.data?.meta;
  const totalPages = meta ? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;

  const appQueries = useQueries({
    queries: filtered.map((job) => ({
      queryKey: ["applicants", job.id, 1, "jobs-overview"],
      queryFn: () =>
        bffEnvelope<ApplicantItem[], OffsetMeta>(
          proxyPath(`employer/jobs/${job.id}/applications`, {
            page: 1,
            limit: 50,
          }),
        ),
      staleTime: 30_000,
    })),
  });

  const appsByJob = new Map<string, { total: number; submitted: number }>();
  appQueries.forEach((qItem, i) => {
    const job = filtered[i];
    if (!job || !qItem.data) return;
    appsByJob.set(job.id, {
      total: qItem.data.meta?.total ?? qItem.data.data.length,
      submitted: newApplicantCount(qItem.data.data),
    });
  });

  const tabCount = (value: string) => {
    const idx = TABS.indexOf(value as (typeof TABS)[number]);
    const fromCounts = tabCountQueries[idx]?.data?.meta?.total;
    if (typeof fromCounts === "number") return fromCounts;
    if (value === status && typeof meta?.total === "number") return meta.total;
    return null;
  };

  const totalJobs = tabCount("");
  const activeJobs = tabCount("PUBLISHED");
  const draftJobs = tabCount("DRAFT");
  const applicantsReady =
    !feedQ.isPending &&
    !feedQ.isError &&
    countQueries.every(
      (item) => Boolean(item.data) || Boolean(item.error) || !item.isPending,
    );
  const totalApplicants = applicantsReady
    ? sumApplicantTotals(
        countQueries.map(
          (item) => item.data?.meta?.total ?? item.data?.data.length,
        ),
      )
    : null;

  const listLoading = listQ.isPending && !listQ.data;
  const filtersActive = Boolean(q.trim() || status);
  const showEmptyAll =
    !listLoading && !listQ.error && !filtersActive && meta?.total === 0;
  const showEmptyFilter =
    !listLoading && !listQ.error && !showEmptyAll && filtered.length === 0;
  const showPager =
    Boolean(meta) && !listLoading && !listQ.error && !showEmptyAll;

  const retry = () => {
    void listQ.refetch();
    tabCountQueries.forEach((item) => void item.refetch());
    void feedQ.refetch();
  };

  const periodLabel = (period: string | null) =>
    period ? t(`wagePeriodLabel.${period}` as "wagePeriodLabel.DAY") : null;

  const statusLabel = (jobStatus: string) =>
    jobStatus === "PUBLISHED"
      ? t("statusActive")
      : jobStatus === "UNPUBLISHED"
        ? t("tabPaused")
        : t(`status.${jobStatus}` as "status.DRAFT");

  const pager = (
    <div className="ham-employer-jobs__pager">
      <PaginationControls
        page={page}
        hasPrevious={page > 1}
        hasNext={page < totalPages}
        onPrevious={() => setPage((p) => p - 1)}
        onNext={() => setPage((p) => p + 1)}
      />
    </div>
  );

  return (
    <div className="ham-employer-jobs">
      <EmployerPageHeader
        title={t("jobsTitle")}
        subtitle={t("jobsPageSubtitle")}
        actions={
          <EmployerPostJobButton className="ham-employer__btn ham-employer__btn--primary">
            <Plus className="size-5" aria-hidden />
            {t("postNewJobCta")}
          </EmployerPostJobButton>
        }
      />

      <div className="ham-employer-jobs__stats">
        <StatCard
          label={t("statTotalJobs")}
          value={totalJobs}
          icon={<Briefcase className="size-4" aria-hidden />}
          tone="total"
        />
        <StatCard
          label={t("statActiveJobsShort")}
          value={activeJobs}
          icon={<Check className="size-4" aria-hidden />}
          tone="active"
        />
        <StatCard
          label={t("statDraftJobsShort")}
          value={draftJobs}
          icon={<Pencil className="size-4" aria-hidden />}
          tone="draft"
        />
        <StatCard
          label={t("statTotalApplicants")}
          value={totalApplicants}
          icon={<User className="size-4" aria-hidden />}
          tone="apps"
        />
      </div>

      <div className="ham-employer-jobs__toolbar">
        <div className="ham-employer-jobs__search">
          <Search className="size-4" aria-hidden />
          <input
            className="ham-employer__input"
            placeholder={t("searchJobsPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={t("searchJobsPlaceholder")}
          />
        </div>
        <div className="ham-employer-jobs__filters">
          <EmployerJobsSelect<JobListStatusFilter>
            label={t("filterStatus")}
            value={status}
            onChange={(next) => {
              setStatus(next);
              setPage(1);
            }}
            options={[
              { value: "", label: t("filterStatus") },
              { value: "PUBLISHED", label: t("statusActive") },
              { value: "DRAFT", label: t("status.DRAFT") },
              { value: "UNPUBLISHED", label: t("tabPaused") },
              { value: "CLOSED", label: t("status.CLOSED") },
            ]}
          />
          <EmployerJobsSelect<JobListSort>
            label={t("sortBy")}
            value={sort}
            onChange={setSort}
            options={[
              { value: "newest", label: t("sortNewest") },
              { value: "oldest", label: t("sortOldest") },
              { value: "title", label: t("sortTitle") },
            ]}
          />
          {filtersActive ? (
            <button
              type="button"
              className="ham-employer-jobs__clear"
              onClick={() => {
                setQ("");
                setStatus("");
                setSort("newest");
                setPage(1);
              }}
            >
              {t("clearFilters")}
            </button>
          ) : null}
        </div>
      </div>

      {showPager ? pager : null}

      {listLoading ? (
        <div
          className="ham-employer-jobs__table-wrap"
          aria-busy="true"
          aria-live="polite"
        >
          <span className="sr-only">{t("jobsTitle")}</span>
          <div className="ham-employer-jobs__table-skel">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="ham-employer__skel ham-employer-jobs__skel"
              />
            ))}
          </div>
        </div>
      ) : listQ.error ? (
        <ErrorState onRetry={retry} />
      ) : showEmptyAll ? (
        <div className="ham-employer__card ham-employer-jobs__empty">
          <EmptyState title={t("noJobsYet")} description={t("noJobsHint")} />
          <EmployerPostJobButton className="ham-employer__btn ham-employer__btn--primary mt-4">
            <Plus className="size-5" aria-hidden />
            {t("postNewJobCta")}
          </EmployerPostJobButton>
        </div>
      ) : showEmptyFilter ? (
        <div className="ham-employer__card ham-employer-jobs__empty">
          <EmptyState
            title={t("noMatchingJobs")}
            description={t("noMatchingJobsHint")}
          />
        </div>
      ) : (
        <div className="ham-employer-jobs__table-wrap">
          <table className="ham-employer-jobs__table">
            <thead>
              <tr>
                <th scope="col">{t("colJobDetails")}</th>
                <th scope="col">{t("colHiringProgress")}</th>
                <th scope="col">{t("statusLabel")}</th>
                <th scope="col">
                  <span className="sr-only">{t("actions")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job, index) => {
                const apps = appsByJob.get(job.id);
                const appsPending =
                  appQueries[index]?.isPending && !appQueries[index]?.data;
                const location = districtName.get(job.districtId) ?? null;
                const typeLabel = t(
                  `jobType.${job.jobType}` as "jobType.FULL_TIME",
                );
                const pay = formatJobCompensation(
                  job.wageMinPaise,
                  job.wageMaxPaise,
                  periodLabel(job.wagePeriod),
                );
                const menuOpen = openMenuId === job.id;
                const openJob = () => router.push(`/employer/jobs/${job.id}`);
                return (
                  <tr
                    key={job.id}
                    className={`ham-employer-jobs__row${menuOpen ? " is-menu-open" : ""}`}
                    tabIndex={0}
                    onClick={openJob}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openJob();
                      }
                    }}
                  >
                    <td>
                      <div className="ham-employer-jobs__card-main">
                        <p className="ham-employer-jobs__card-title">
                          {job.title}
                        </p>
                        <p className="ham-employer-jobs__card-meta">
                          {jobLocationLine(location, typeLabel)}
                        </p>
                        {pay ? (
                          <p className="ham-employer-jobs__card-pay">{pay}</p>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div className="ham-employer-jobs__card-apps">
                        {appsPending ? (
                          <span className="ham-employer__skel block h-4 w-36 rounded-md" />
                        ) : (
                          <p>
                            {t("applicantsWithNew", {
                              count: apps?.total ?? 0,
                              newCount: apps?.submitted ?? 0,
                            })}
                          </p>
                        )}
                        <div className="ham-employer-jobs__bar" aria-hidden>
                          <span
                            style={{
                              width: `${newApplicantSharePercent(apps?.submitted ?? 0, apps?.total ?? 0)}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td>
                      <EmployerBadge tone={jobBadgeTone(job.status)} dot>
                        {statusLabel(job.status)}
                      </EmployerBadge>
                    </td>
                    <td
                      className="ham-employer-jobs__actions-cell"
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      <JobRowMenu
                        job={job}
                        open={menuOpen}
                        onOpenChange={(next) =>
                          setOpenMenuId(next ? job.id : null)
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showPager ? pager : null}
    </div>
  );
}

function districtNameMap(
  districts: { id: string; name: string }[] | undefined,
) {
  const map = new Map<string, string>();
  for (const d of districts ?? []) map.set(d.id, d.name);
  return map;
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number | null;
  icon: ReactNode;
  tone: "total" | "active" | "draft" | "apps";
}) {
  return (
    <div className="ham-employer__card ham-employer-jobs__stat">
      <div className="ham-employer-jobs__stat-top">
        <p className="ham-employer-jobs__stat-label">{label}</p>
        <span
          className={`ham-employer-jobs__stat-icon ham-employer-jobs__stat-icon--${tone}`}
          aria-hidden
        >
          {icon}
        </span>
      </div>
      {value == null ? (
        <span className="ham-employer__skel ham-employer-jobs__stat-value block h-8 w-16 rounded-md" />
      ) : (
        <p className="ham-employer-jobs__stat-value">{value}</p>
      )}
    </div>
  );
}

function JobRowMenu({
  job,
  open,
  onOpenChange,
}: {
  job: EmployerJob;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const { gate, amountPaise } = useEmployerJobCreateGate();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  const placeMenu = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const width = panelRef.current?.offsetWidth ?? 220;
    const height = panelRef.current?.offsetHeight ?? 220;
    const gap = 8;
    let left = rect.right - width;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);
    let top = rect.bottom + gap;
    if (top + height > window.innerHeight - 8 && rect.top > height + gap) {
      top = rect.top - height - gap;
    }
    setCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
    const id = requestAnimationFrame(placeMenu);
    return () => cancelAnimationFrame(id);
  }, [open, placeMenu]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    const onReposition = () => placeMenu();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, onOpenChange, placeMenu]);

  const publishMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${job.id}/publish`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["employer-jobs"] });
    },
    onError: (e) => {
      if (isEmployerMembershipRequiredError(e)) {
        onOpenChange(false);
        setMembershipOpen(true);
        return;
      }
      setMsg(errMsg(e));
    },
  });

  const closeMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${job.id}/close`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      setCloseOpen(false);
      onOpenChange(false);
      await qc.invalidateQueries({ queryKey: ["employer-jobs"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  const menu =
    typeof document === "undefined"
      ? null
      : createPortal(
          <AnimatePresence>
            {open ? (
              <div key="jobs-menu-root">
                <div
                  className="ham-employer-jobs__menu-backdrop"
                  onClick={() => onOpenChange(false)}
                />
                <motion.div
                  ref={panelRef}
                  role="menu"
                  className="ham-employer-jobs__menu-panel"
                  style={
                    coords
                      ? { top: coords.top, left: coords.left }
                      : { visibility: "hidden" }
                  }
                  initial={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6, scale: 0.98 }
                  }
                  animate={
                    reduceMotion
                      ? { opacity: 1 }
                      : { opacity: 1, y: 0, scale: 1 }
                  }
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -4, scale: 0.98 }
                  }
                  transition={{
                    duration: reduceMotion ? 0 : 0.16,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <Link
                    href={`/employer/jobs/${job.id}/applicants`}
                    role="menuitem"
                    onClick={() => onOpenChange(false)}
                  >
                    <Users className="size-4" aria-hidden />
                    {t("manageApplicants")}
                  </Link>
                  {jobCanEdit(job.status) ? (
                    <Link
                      href={`/employer/jobs/${job.id}/edit`}
                      role="menuitem"
                      onClick={() => onOpenChange(false)}
                    >
                      <Pencil className="size-4" aria-hidden />
                      {t("editJob")}
                    </Link>
                  ) : null}
                  {jobCanPublish(job.status) ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled={publishMut.isPending || gate === "loading"}
                      onClick={() => {
                        if (gate === "blocked") {
                          onOpenChange(false);
                          setMembershipOpen(true);
                          return;
                        }
                        publishMut.mutate();
                      }}
                    >
                      {publishMut.isPending ? (
                        <span className="ham-employer__spinner" />
                      ) : (
                        <Play className="size-4" aria-hidden />
                      )}
                      {t("publish")}
                    </button>
                  ) : null}
                  {jobShowsPause(job.status) ? (
                    <button
                      type="button"
                      role="menuitem"
                      disabled
                      title={t("pauseHiringUnavailable")}
                    >
                      <Pause className="size-4" aria-hidden />
                      {t("pause")}
                    </button>
                  ) : null}
                  {jobCanClose(job.status) ? (
                    <button
                      type="button"
                      role="menuitem"
                      className="ham-employer-jobs__menu-danger"
                      disabled={closeMut.isPending}
                      onClick={() => {
                        onOpenChange(false);
                        setCloseOpen(true);
                      }}
                    >
                      <XCircle className="size-4" aria-hidden />
                      {t("close")}
                    </button>
                  ) : null}
                  {msg ? (
                    <p className="ham-employer-jobs__menu-error">{msg}</p>
                  ) : null}
                </motion.div>
              </div>
            ) : null}
          </AnimatePresence>,
          document.querySelector(".ham-employer") ?? document.body,
        );

  return (
    <div className="ham-employer-jobs__menu">
      <button
        ref={buttonRef}
        type="button"
        className="ham-employer__btn ham-employer__btn--icon"
        aria-label={t("jobCardMenu")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onOpenChange(!open);
        }}
      >
        <MoreVertical className="size-5" />
      </button>
      {menu}
      <EmployerMembershipRequiredDialog
        open={membershipOpen}
        onOpenChange={setMembershipOpen}
        amountPaise={amountPaise}
      />
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={t("confirmClose")}
        pending={closeMut.isPending}
        onConfirm={() => {
          if (closeMut.isPending) return;
          closeMut.mutate();
        }}
      />
    </div>
  );
}
