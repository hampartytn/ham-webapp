"use client";

import { useQueries, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BriefcaseBusiness,
  ClipboardList,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ErrorState } from "@/components/shared/error-state";
import { Link } from "@/i18n/navigation";
import { EmployerDashboardSkeleton } from "@/features/employer/employer-dashboard-skeleton";
import {
  EmployerActiveJobsPremium,
  EmployerHiringQueuePremium,
} from "@/features/employer/employer-hiring-queue";
import { EmployerJobDonut } from "@/features/employer/employer-job-donut";
import {
  dashboardDisplayName,
  jobStatusCounts,
  pickJobsForPulse,
  type DashboardApplicantRow,
} from "@/features/employer/dashboard-utils";
import {
  bffEnvelope,
  bffJson,
  type OffsetMeta,
  proxyPath,
} from "@/lib/api/bff-client";
import type {
  ApplicantItem,
  CatalogItem,
  EmployerJob,
  MeResponse,
} from "@/types/ham";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export function EmployerDashboard() {
  const t = useTranslations("employer");
  const ts = useTranslations("shell");

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: 60_000,
  });

  const jobsQ = useQuery({
    queryKey: ["employer-jobs", "dashboard"],
    queryFn: () =>
      bffEnvelope<EmployerJob[], OffsetMeta>(
        proxyPath("employer/jobs", { page: 1, limit: 50 }),
      ),
    staleTime: 30_000,
  });

  const districtsQ = useQuery({
    queryKey: ["geo-districts"],
    queryFn: () => bffJson<CatalogItem[]>(proxyPath("geo/districts")),
    staleTime: 5 * 60_000,
  });

  const jobs = jobsQ.data?.data ?? [];
  const publishedJobs = jobs.filter((j) => j.status === "PUBLISHED");
  const draftJobs = jobs.filter((j) => j.status === "DRAFT");
  const pulseJobs = pickJobsForPulse(jobs, 5);
  const statusCounts = jobStatusCounts(jobs);
  const fetchJobs = publishedJobs.slice(0, 5);

  const applicantQueries = useQueries({
    queries: fetchJobs.map((job) => ({
      queryKey: ["applicants", job.id, 1, "dashboard"],
      queryFn: () =>
        bffEnvelope<ApplicantItem[], OffsetMeta>(
          proxyPath(`employer/jobs/${job.id}/applications`, {
            page: 1,
            limit: 10,
          }),
        ),
      enabled: fetchJobs.length > 0,
      staleTime: 20_000,
    })),
  });

  const applicantsLoading = applicantQueries.some((q) => q.isLoading);
  const applicationCounts = new Map<string, number>();
  const recentApplicants: DashboardApplicantRow[] = [];

  applicantQueries.forEach((q, index) => {
    const job = fetchJobs[index];
    if (!job || !q.data?.data) return;
    applicationCounts.set(job.id, q.data.data.length);
    for (const application of q.data.data) {
      recentApplicants.push({
        application,
        jobTitle: job.title,
        jobId: job.id,
      });
    }
  });

  recentApplicants.sort(
    (a, b) =>
      new Date(b.application.createdAt).getTime() -
      new Date(a.application.createdAt).getTime(),
  );
  const queueRows = recentApplicants.slice(0, 6);
  const submittedCount = recentApplicants.filter(
    (r) => r.application.status === "SUBMITTED",
  ).length;

  const districtName = new Map<string, string>();
  for (const d of districtsQ.data ?? []) districtName.set(d.id, d.name);

  if (meQ.isLoading || jobsQ.isLoading) {
    return <EmployerDashboardSkeleton />;
  }
  if (meQ.error || !meQ.data) {
    return <ErrorState onRetry={() => void meQ.refetch()} />;
  }
  if (jobsQ.error) {
    return <ErrorState onRetry={() => void jobsQ.refetch()} />;
  }

  const { welcomeName } = dashboardDisplayName(meQ.data);

  const situation =
    submittedCount > 0
      ? t("situationNeedsReview", { count: submittedCount })
      : draftJobs.length > 0
        ? t("situationDrafts", { count: draftJobs.length })
        : publishedJobs.length === 0
          ? t("situationNoJobs")
          : t("situationCaughtUp");

  const metrics = [
    {
      label: t("statPublishedLabel"),
      value: publishedJobs.length,
      href: "/employer/jobs",
      icon: BriefcaseBusiness,
      iconBg: "bg-[#fde8e4] text-[var(--emp-primary)]",
      blob: "bg-[#fde8e4]",
    },
    {
      label: t("statNeedsReviewLabel"),
      value: applicantsLoading ? "…" : submittedCount,
      href: "/employer/applicants",
      icon: ClipboardList,
      iconBg: "bg-[#ffedd5] text-[#c2410c]",
      blob: "bg-[#ffedd5]",
    },
    {
      label: t("statDraftsLabel"),
      value: draftJobs.length,
      href: "/employer/jobs",
      icon: FileText,
      iconBg: "bg-[#e0e7ff] text-[#4338ca]",
      blob: "bg-[#e0e7ff]",
    },
  ] as const;

  return (
    <motion.div
      className="space-y-5 md:space-y-6"
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.06 } },
      }}
    >
      <motion.section
        variants={fadeUp}
        transition={{ duration: 0.35 }}
        className="ham-employer__welcome"
      >
        <div className="relative z-[1] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[1.75rem]">
              {t("welcomeBack")}{" "}
              <span className="text-[var(--emp-primary)]">{welcomeName}</span>
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-[var(--emp-muted)]">
              {situation}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/employer/workers"
              className="inline-flex items-center gap-2 rounded-2xl border border-[var(--emp-ink)]/15 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:-translate-y-0.5 hover:shadow"
            >
              <Search className="size-4" aria-hidden />
              {ts("findWorkers")}
            </Link>
            <Link
              href="/employer/jobs/new"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--emp-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(190,27,15,0.28)] transition hover:-translate-y-0.5 hover:bg-[var(--emp-primary-deep)]"
            >
              <Plus className="size-4" aria-hidden />
              {t("postJob")}
            </Link>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.7fr)]">
        <div className="grid gap-4 sm:grid-cols-3">
          {metrics.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.div
                key={m.label}
                variants={fadeUp}
                transition={{ duration: 0.35, delay: i * 0.04 }}
              >
                <Link href={m.href} className="ham-employer__stat-card">
                  <span className={`ham-employer__stat-blob ${m.blob}`} />
                  <span className={`ham-employer__stat-icon ${m.iconBg}`}>
                    <Icon className="size-4" strokeWidth={2} />
                  </span>
                  <p className="ham-employer__stat-value">{m.value}</p>
                  <p className="ham-employer__stat-label">{m.label}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <EmployerJobDonut counts={statusCounts} />
        </motion.div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(16rem,0.85fr)]">
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <EmployerHiringQueuePremium
            rows={queueRows}
            empty={!applicantsLoading && queueRows.length === 0}
          />
        </motion.div>
        <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
          <EmployerActiveJobsPremium
            jobs={pulseJobs}
            districtName={districtName}
            applicationCounts={applicationCounts}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
