"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { PasswordSetForm } from "@/features/auth/components/password-set-form";
import { LogoutButton } from "@/components/shared/logout-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { PaginationControls } from "@/components/shared/pagination";
import {
  StatusBadge,
  useBffErrorMessage,
} from "@/components/shared/status-badge";
import { Link, useRouter } from "@/i18n/navigation";
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
  WorkerCard,
} from "@/types/ham";

export function EmployerJobsList() {
  const t = useTranslations("employer");
  const listQ = useQuery({
    queryKey: ["employer-jobs"],
    queryFn: () =>
      bffEnvelope<EmployerJob[], OffsetMeta>(
        proxyPath("employer/jobs", { page: 1, limit: 50 }),
      ),
  });

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) return <ErrorState onRetry={() => void listQ.refetch()} />;
  const jobs = listQ.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("jobsTitle")}</h1>
        <Link
          href="/employer/jobs/new"
          className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
        >
          {t("createJob")}
        </Link>
      </div>
      {jobs.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-3">
        {jobs.map((j) => (
          <li key={j.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
            <div>
              <Link href={`/employer/jobs/${j.id}`} className="font-medium underline">
                {j.title}
              </Link>
              <div className="mt-1">
                <StatusBadge status={j.status} />
              </div>
            </div>
            <Link
              href={`/employer/jobs/${j.id}/applicants`}
              className="text-sm underline"
            >
              {t("applicants")}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmployerJobCreateForm() {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState("FULL_TIME");
  const [districtId, setDistrictId] = useState("");
  const [vacancies, setVacancies] = useState("1");
  const [skillIds, setSkillIds] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const districtsQ = useQuery({
    queryKey: ["geo-districts"],
    queryFn: () => bffJson<CatalogItem[]>(proxyPath("geo/districts")),
  });
  const skillsQ = useQuery({
    queryKey: ["skills"],
    queryFn: () => bffJson<CatalogItem[]>(proxyPath("skills")),
  });

  const createMut = useMutation({
    mutationFn: (status: "DRAFT" | "PUBLISHED") =>
      bffJson<EmployerJob>(proxyPath("employer/jobs"), {
        method: "POST",
        body: JSON.stringify({
          title,
          description,
          jobType,
          districtId,
          vacancies: Number(vacancies) || 1,
          skillIds,
          status,
        }),
      }),
    onSuccess: (job) => {
      router.push(`/employer/jobs/${job.id}`);
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">{t("createJob")}</h1>
      <p className="text-sm text-muted-foreground">{t("paymentsNote")}</p>
      <div className="space-y-2">
        <Label>{t("title")}</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("description")}</Label>
        <textarea
          className="min-h-28 w-full rounded-md border border-input px-3 py-2 text-sm"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("jobType")}</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
          value={jobType}
          onChange={(e) => setJobType(e.target.value)}
        >
          {["FULL_TIME", "PART_TIME", "CONTRACT", "DAILY_WAGE", "OTHER"].map(
            (v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ),
          )}
        </select>
      </div>
      <div className="space-y-2">
        <Label>District</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
          value={districtId}
          onChange={(e) => setDistrictId(e.target.value)}
        >
          <option value="">—</option>
          {(districtsQ.data ?? []).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Vacancies</Label>
        <Input
          type="number"
          min={1}
          value={vacancies}
          onChange={(e) => setVacancies(e.target.value)}
        />
      </div>
      <fieldset className="space-y-1">
        <legend className="text-sm font-medium">Skills</legend>
        <div className="max-h-40 overflow-y-auto rounded-md border p-2">
          {(skillsQ.data ?? []).map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={skillIds.includes(s.id)}
                onChange={(e) =>
                  setSkillIds((prev) =>
                    e.target.checked
                      ? [...prev, s.id]
                      : prev.filter((id) => id !== s.id),
                  )
                }
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={!title || !description || !districtId}
          onClick={() => createMut.mutate("DRAFT")}
        >
          {t("draft")}
        </Button>
        <Button
          type="button"
          disabled={!title || !description || !districtId}
          onClick={() => createMut.mutate("PUBLISHED")}
        >
          {t("publish")}
        </Button>
      </div>
    </div>
  );
}

export function EmployerJobDetail({ jobId }: { jobId: string }) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [closeOpen, setCloseOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const jobQ = useQuery({
    queryKey: ["employer-job", jobId],
    queryFn: () => bffJson<EmployerJob>(proxyPath(`employer/jobs/${jobId}`)),
  });

  const publishMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${jobId}/publish`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["employer-job", jobId] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  const closeMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath(`employer/jobs/${jobId}/close`), {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      setCloseOpen(false);
      await qc.invalidateQueries({ queryKey: ["employer-job", jobId] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  if (jobQ.isLoading) return <LoadingState />;
  if (jobQ.error || !jobQ.data) {
    return <ErrorState onRetry={() => void jobQ.refetch()} />;
  }
  const job = jobQ.data;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{job.title}</h1>
      <StatusBadge status={job.status} />
      <p className="whitespace-pre-wrap text-sm">{job.description}</p>
      <div className="flex flex-wrap gap-2">
        {job.status === "DRAFT" || job.status === "UNPUBLISHED" ? (
          <Button type="button" onClick={() => publishMut.mutate()}>
            {t("publish")}
          </Button>
        ) : null}
        {job.status !== "CLOSED" ? (
          <Button type="button" variant="destructive" onClick={() => setCloseOpen(true)}>
            {t("close")}
          </Button>
        ) : null}
        <Link href={`/employer/jobs/${jobId}/applicants`} className="text-sm underline self-center">
          {t("applicants")}
        </Link>
      </div>
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title={t("confirmClose")}
        pending={closeMut.isPending}
        onConfirm={() => closeMut.mutate()}
      />
    </div>
  );
}

export function EmployerApplicants({ jobId }: { jobId: string }) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);

  const listQ = useQuery({
    queryKey: ["applicants", jobId, page],
    queryFn: () =>
      bffEnvelope<ApplicantItem[], OffsetMeta>(
        proxyPath(`employer/jobs/${jobId}/applications`, {
          page,
          limit: 20,
        }),
      ),
  });

  const statusMut = useMutation({
    mutationFn: ({
      applicationId,
      status,
    }: {
      applicationId: string;
      status: string;
    }) =>
      bffJson(
        proxyPath(
          `employer/jobs/${jobId}/applications/${applicationId}`,
        ),
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      ),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["applicants", jobId] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) return <ErrorState onRetry={() => void listQ.refetch()} />;

  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("applicants")}</h1>
      <p className="text-sm text-muted-foreground">{t("privacyNote")}</p>
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
      {items.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-4">
        {items.map((a) => (
          <li key={a.id} className="space-y-2 border-b border-border pb-3">
            <p className="font-medium">{a.employee.fullName ?? a.employee.id}</p>
            <StatusBadge status={a.status} />
            <p className="text-sm">{a.coverNote}</p>
            <ul className="flex flex-wrap gap-1 text-xs">
              {a.employee.skills.map((s) => (
                <li key={s.skillId} className="rounded bg-secondary px-2 py-0.5">
                  {s.name}
                </li>
              ))}
            </ul>
            {a.status !== "WITHDRAWN" && a.status !== "HIRED" ? (
              <select
                className="h-9 rounded-md border border-input px-2 text-sm"
                defaultValue=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  statusMut.mutate({
                    applicationId: a.id,
                    status: e.target.value,
                  });
                }}
              >
                <option value="">{t("updateStatus")}</option>
                {["VIEWED", "SHORTLISTED", "REJECTED", "HIRED"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : null}
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
    </div>
  );
}

export function EmployerWorkers() {
  const t = useTranslations("employer");
  const [page, setPage] = useState(1);
  const listQ = useQuery({
    queryKey: ["workers", page],
    queryFn: () =>
      bffEnvelope<WorkerCard[], OffsetMeta>(
        proxyPath("employer/workers", { page, limit: 20 }),
      ),
  });

  if (listQ.isLoading) return <LoadingState />;
  if (listQ.error) return <ErrorState onRetry={() => void listQ.refetch()} />;
  const items = listQ.data?.data ?? [];
  const meta = listQ.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("workersTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("privacyNote")}</p>
      {items.length === 0 ? <EmptyState /> : null}
      <ul className="space-y-3">
        {items.map((w) => (
          <li key={w.id} className="border-b border-border pb-3 text-sm">
            <p className="font-medium">{w.fullName ?? w.id}</p>
            <p>
              {w.availabilityStatus}
              {w.identityVerified ? " · verified" : ""}
            </p>
            <ul className="mt-1 flex flex-wrap gap-1">
              {w.skills.map((s) => (
                <li key={s.skillId} className="rounded bg-secondary px-2 py-0.5 text-xs">
                  {s.name}
                </li>
              ))}
            </ul>
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
    </div>
  );
}

export function EmployerSettingsPanel() {
  const t = useTranslations("employer");
  const ta = useTranslations("auth");
  const errMsg = useBffErrorMessage();
  const [msg, setMsg] = useState<string | null>(null);
  const payMut = useMutation({
    mutationFn: () =>
      bffJson<{ paymentId: string; status: string }>(
        proxyPath("payments/initiate"),
        {
          method: "POST",
          body: JSON.stringify({ purpose: "EMPLOYER_ACTIVATION" }),
        },
      ),
    onSuccess: (d) => setMsg(t("paymentStatus", { status: d.status })),
    onError: (e) => setMsg(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">{t("paymentsNote")}</p>
      <Button type="button" variant="outline" onClick={() => payMut.mutate()}>
        {t("initiatePayment")}
      </Button>
      {msg ? <p className="text-sm">{msg}</p> : null}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">{ta("setPasswordTitle")}</h2>
        <PasswordSetForm />
      </section>
      <LogoutButton />
    </div>
  );
}
