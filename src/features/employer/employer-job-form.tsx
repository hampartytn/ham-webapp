"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { CatalogItem, EmployerJob } from "@/types/ham";

const JOB_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "DAILY_WAGE",
  "OTHER",
] as const;

const WAGE_PERIODS = ["DAY", "MONTH", "PIECE"] as const;

type Props = {
  mode: "create" | "edit";
  jobId?: string;
};

type FormSeed = {
  title: string;
  description: string;
  jobType: string;
  districtId: string;
  cityId: string;
  areaId: string;
  vacancies: string;
  skillIds: string[];
  wageMin: string;
  wageMax: string;
  wagePeriod: string;
};

const EMPTY_SEED: FormSeed = {
  title: "",
  description: "",
  jobType: "FULL_TIME",
  districtId: "",
  cityId: "",
  areaId: "",
  vacancies: "1",
  skillIds: [],
  wageMin: "",
  wageMax: "",
  wagePeriod: "",
};

function seedFromJob(job: EmployerJob): FormSeed {
  return {
    title: job.title,
    description: job.description,
    jobType: job.jobType,
    districtId: job.districtId,
    cityId: job.cityId ?? "",
    areaId: job.areaId ?? "",
    vacancies: String(job.vacancies),
    skillIds: job.skills.map((s) => s.skillId),
    wageMin:
      job.wageMinPaise != null ? String(Math.round(job.wageMinPaise / 100)) : "",
    wageMax:
      job.wageMaxPaise != null ? String(Math.round(job.wageMaxPaise / 100)) : "",
    wagePeriod: job.wagePeriod ?? "",
  };
}

export function EmployerJobForm({ mode, jobId }: Props) {
  const jobQ = useQuery({
    queryKey: ["employer-job", jobId],
    enabled: mode === "edit" && Boolean(jobId),
    queryFn: () => bffJson<EmployerJob>(proxyPath(`employer/jobs/${jobId}`)),
  });

  if (mode === "edit" && jobQ.isLoading) return <LoadingState />;
  if (mode === "edit" && (jobQ.error || !jobQ.data)) {
    return <ErrorState onRetry={() => void jobQ.refetch()} />;
  }

  const seed = mode === "edit" && jobQ.data ? seedFromJob(jobQ.data) : EMPTY_SEED;
  const formKey =
    mode === "edit" && jobQ.data
      ? `${jobQ.data.id}:${jobQ.data.updatedAt}`
      : "create";

  return (
    <JobFormFields
      key={formKey}
      mode={mode}
      jobId={jobId}
      seed={seed}
    />
  );
}

function JobFormFields({
  mode,
  jobId,
  seed,
}: {
  mode: "create" | "edit";
  jobId?: string;
  seed: FormSeed;
}) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const router = useRouter();

  const [title, setTitle] = useState(seed.title);
  const [description, setDescription] = useState(seed.description);
  const [jobType, setJobType] = useState(seed.jobType);
  const [districtId, setDistrictId] = useState(seed.districtId);
  const [cityId, setCityId] = useState(seed.cityId);
  const [areaId, setAreaId] = useState(seed.areaId);
  const [vacancies, setVacancies] = useState(seed.vacancies);
  const [skillIds, setSkillIds] = useState(seed.skillIds);
  const [wageMin, setWageMin] = useState(seed.wageMin);
  const [wageMax, setWageMax] = useState(seed.wageMax);
  const [wagePeriod, setWagePeriod] = useState(seed.wagePeriod);
  const [msg, setMsg] = useState<string | null>(null);

  const districtsQ = useQuery({
    queryKey: ["geo-districts"],
    queryFn: () => bffJson<CatalogItem[]>(proxyPath("geo/districts")),
  });
  const citiesQ = useQuery({
    queryKey: ["geo-cities", districtId],
    enabled: Boolean(districtId),
    queryFn: () =>
      bffJson<CatalogItem[]>(proxyPath(`geo/districts/${districtId}/cities`)),
  });
  const areasQ = useQuery({
    queryKey: ["geo-areas", cityId],
    enabled: Boolean(cityId),
    queryFn: () =>
      bffJson<CatalogItem[]>(proxyPath(`geo/cities/${cityId}/areas`)),
  });
  const skillsQ = useQuery({
    queryKey: ["skills"],
    queryFn: () => bffJson<CatalogItem[]>(proxyPath("skills")),
  });

  function buildBody(status?: "DRAFT" | "PUBLISHED") {
    const wageMinPaise = wageMin
      ? Math.round(Number(wageMin) * 100)
      : undefined;
    const wageMaxPaise = wageMax
      ? Math.round(Number(wageMax) * 100)
      : undefined;
    return {
      title,
      description,
      jobType,
      districtId,
      cityId: cityId || undefined,
      areaId: areaId || undefined,
      vacancies: Number(vacancies) || 1,
      skillIds,
      wageMinPaise,
      wageMaxPaise,
      wagePeriod:
        wageMinPaise != null || wageMaxPaise != null
          ? wagePeriod || "DAY"
          : undefined,
      ...(status ? { status } : {}),
    };
  }

  const saveMut = useMutation({
    mutationFn: async (status?: "DRAFT" | "PUBLISHED") => {
      if (mode === "create") {
        return bffJson<EmployerJob>(proxyPath("employer/jobs"), {
          method: "POST",
          body: JSON.stringify(buildBody(status ?? "DRAFT")),
        });
      }
      return bffJson<EmployerJob>(proxyPath(`employer/jobs/${jobId}`), {
        method: "PATCH",
        body: JSON.stringify(buildBody()),
      });
    },
    onSuccess: (job) => {
      router.push(`/employer/jobs/${job.id}`);
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  const canSubmit = Boolean(title && description && districtId);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <EmployerPageHeader
        title={mode === "create" ? t("createJob") : t("editJob")}
        subtitle={t("jobFormSubtitle")}
      />
      <p className="text-sm text-[var(--emp-muted)]">{t("paymentsNote")}</p>

      <section className="ham-employer__panel space-y-4">
        <h2 className="text-base font-semibold">{t("sectionBasic")}</h2>
        <div className="space-y-2">
          <Label htmlFor="job-title">{t("title")}</Label>
          <Input
            id="job-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-desc">{t("description")}</Label>
          <textarea
            id="job-desc"
            className="min-h-28 w-full rounded-md border border-input px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-type">{t("jobTypeLabel")}</Label>
            <select
              id="job-type"
              className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
            >
              {JOB_TYPES.map((v) => (
                <option key={v} value={v}>
                  {t(`jobType.${v}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vacancies">{t("vacancies")}</Label>
            <Input
              id="vacancies"
              type="number"
              min={1}
              value={vacancies}
              onChange={(e) => setVacancies(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="ham-employer__panel space-y-4">
        <h2 className="text-base font-semibold">{t("sectionRequirements")}</h2>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("skills")}</legend>
          <div className="max-h-44 overflow-y-auto rounded-md border p-2">
            {(skillsQ.data ?? []).map((s) => (
              <label key={s.id} className="flex items-center gap-2 py-1 text-sm">
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
      </section>

      <section className="ham-employer__panel space-y-4">
        <h2 className="text-base font-semibold">{t("sectionLocation")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("district")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value);
                setCityId("");
                setAreaId("");
              }}
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
            <Label>{t("city")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
              value={cityId}
              disabled={!districtId}
              onChange={(e) => {
                setCityId(e.target.value);
                setAreaId("");
              }}
            >
              <option value="">—</option>
              {(citiesQ.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>{t("area")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
              value={areaId}
              disabled={!cityId}
              onChange={(e) => setAreaId(e.target.value)}
            >
              <option value="">—</option>
              {(areasQ.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="ham-employer__panel space-y-4">
        <h2 className="text-base font-semibold">{t("sectionCompensation")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("wageMin")}</Label>
            <Input
              type="number"
              min={0}
              value={wageMin}
              onChange={(e) => setWageMin(e.target.value)}
              placeholder="₹"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("wageMax")}</Label>
            <Input
              type="number"
              min={0}
              value={wageMax}
              onChange={(e) => setWageMax(e.target.value)}
              placeholder="₹"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("wagePeriod")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
              value={wagePeriod}
              onChange={(e) => setWagePeriod(e.target.value)}
            >
              <option value="">—</option>
              {WAGE_PERIODS.map((p) => (
                <option key={p} value={p}>
                  {t(`wagePeriodLabel.${p}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}

      <div className="flex flex-wrap gap-2">
        {mode === "create" ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={!canSubmit || saveMut.isPending}
              onClick={() => saveMut.mutate("DRAFT")}
            >
              {t("draft")}
            </Button>
            <Button
              type="button"
              disabled={!canSubmit || saveMut.isPending}
              onClick={() => saveMut.mutate("PUBLISHED")}
            >
              {t("publish")}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            disabled={!canSubmit || saveMut.isPending}
            onClick={() => saveMut.mutate(undefined)}
          >
            {t("saveChanges")}
          </Button>
        )}
      </div>
    </div>
  );
}
