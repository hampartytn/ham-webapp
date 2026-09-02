"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Label } from "@/components/ui/label";
import { useRouter } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { EmployerMembershipRequiredDialog } from "@/features/employer/employer-membership-required-dialog";
import { isEmployerMembershipRequiredError } from "@/features/employer/employer-membership-view";
import { useEmployerJobCreateGate } from "@/features/employer/employer-job-create-gate";
import { geoDistrictsQueryOptions, skillsQueryOptions } from "@/lib/query/catalog";
import { cn } from "@/lib/utils";
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
  const t = useTranslations("employer");
  const jobQ = useQuery({
    queryKey: ["employer-job", jobId],
    enabled: mode === "edit" && Boolean(jobId),
    queryFn: () => bffJson<EmployerJob>(proxyPath(`employer/jobs/${jobId}`)),
  });
  useQuery(geoDistrictsQueryOptions);
  useQuery(skillsQueryOptions);

  if (mode === "edit" && jobQ.isPending && !jobQ.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <EmployerPageHeader
          title={t("editJob")}
          subtitle={t("jobFormSubtitle")}
        />
        <LoadingState />
      </div>
    );
  }
  if (mode === "edit" && (jobQ.error || !jobQ.data)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <EmployerPageHeader
          title={t("editJob")}
          subtitle={t("jobFormSubtitle")}
        />
        <ErrorState onRetry={() => void jobQ.refetch()} />
      </div>
    );
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
  const tc = useTranslations("common");
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
  const [step, setStep] = useState(0);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const { gate, amountPaise } = useEmployerJobCreateGate();

  const districtsQ = useQuery(geoDistrictsQueryOptions);
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
  const skillsQ = useQuery(skillsQueryOptions);

  function buildBody(status?: "DRAFT" | "PUBLISHED") {
    const wageMinPaise = wageMin
      ? Math.round(Number(wageMin) * 100)
      : undefined;
    const wageMaxPaise = wageMax
      ? Math.round(Number(wageMax) * 100)
      : undefined;
    const facilityLine =
      facilities.length > 0
        ? `${t("facilitiesProvided")}: ${facilities.join(", ")}\n\n`
        : "";
    return {
      title,
      description: `${facilityLine}${description}`,
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
    onError: (e) => {
      if (mode === "create" && isEmployerMembershipRequiredError(e)) {
        setMembershipOpen(true);
        return;
      }
      setMsg(errMsg(e));
    },
  });

  const submitCreate = (status: "DRAFT" | "PUBLISHED") => {
    if (gate === "loading") return;
    if (gate === "blocked") {
      setMembershipOpen(true);
      return;
    }
    saveMut.mutate(status);
  };

  const canSubmit = Boolean(title && description && districtId);
  const createBlocked = mode === "create" && gate !== "allow";
  const STEPS = [
    t("stepJobBasics"),
    t("stepWorkDetails"),
    t("stepLocation"),
    t("stepFacilities"),
    t("stepReview"),
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-[2rem] font-bold leading-10">
          {mode === "create" ? t("postNewJob") : t("editJob")}
        </h1>
        <p className="mt-1 text-base text-[var(--emp-muted)]">
          {t("jobStepHint", { step: step + 1, total: 5, name: STEPS[step] })}
        </p>
      </div>

      <div className="ham-employer__stepper">
        <div className="ham-employer__stepper-line" aria-hidden>
          <span style={{ width: `${(step / 4) * 100}%` }} />
        </div>
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={cn(
              "ham-employer__step",
              i === step && "ham-employer__step--on",
              i < step && "ham-employer__step--done",
            )}
            onClick={() => setStep(i)}
          >
            <span>{i + 1}</span>
            <span className="hidden text-center text-xs font-semibold uppercase tracking-wide sm:block">
              {label}
            </span>
          </button>
        ))}
      </div>

      <section className="ham-employer__card space-y-4 p-6">
        {step === 0 ? (
          <>
            <h2 className="text-lg font-semibold">{t("sectionBasic")}</h2>
            <p className="text-sm text-[var(--emp-muted)]">{t("jobBasicsHelp")}</p>
            <div className="space-y-2">
              <Label htmlFor="job-title">{t("title")} *</Label>
              <input
                id="job-title"
                className="ham-employer__input"
                placeholder={t("jobTitlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="job-type">{t("jobCategory")} *</Label>
                <select
                  id="job-type"
                  className="ham-employer__input"
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
                <Label htmlFor="vacancies">{t("vacancies")} *</Label>
                <input
                  id="vacancies"
                  className="ham-employer__input"
                  type="number"
                  min={1}
                  value={vacancies}
                  onChange={(e) => setVacancies(e.target.value)}
                />
              </div>
            </div>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t("skills")} *</legend>
              <p className="text-xs text-[var(--emp-muted)]">{t("skillsHelp")}</p>
              <div className="flex flex-wrap gap-2">
                {(skillsQ.data ?? []).slice(0, 24).map((s) => {
                  const on = skillIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={cn(
                        "rounded-full border px-3 py-1 text-sm",
                        on
                          ? "border-[var(--emp-primary)] bg-[var(--emp-primary-light)] text-[var(--emp-primary-dark)]"
                          : "border-[var(--emp-border)]",
                      )}
                      onClick={() =>
                        setSkillIds((prev) =>
                          on ? prev.filter((id) => id !== s.id) : [...prev, s.id],
                        )
                      }
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="job-desc">{t("briefSummary")}</Label>
              <textarea
                id="job-desc"
                className="ham-employer__input"
                placeholder={t("briefSummaryPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 className="text-lg font-semibold">{t("sectionCompensation")}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("wageMin")}</Label>
                <input
                  className="ham-employer__input"
                  type="number"
                  min={0}
                  value={wageMin}
                  onChange={(e) => setWageMin(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("wageMax")}</Label>
                <input
                  className="ham-employer__input"
                  type="number"
                  min={0}
                  value={wageMax}
                  onChange={(e) => setWageMax(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("wagePeriod")}</Label>
                <select
                  className="ham-employer__input"
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
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 className="text-lg font-semibold">{t("sectionLocation")}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t("district")} *</Label>
                <select
                  className="ham-employer__input"
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
                  className="ham-employer__input"
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
                  className="ham-employer__input"
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
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2 className="text-lg font-semibold">{t("facilitiesProvided")}</h2>
            <p className="text-sm text-[var(--emp-muted)]">{t("facilitiesHelp")}</p>
            {[t("facilityTransport"), t("facilityFood"), t("facilityMedical")].map(
              (label) => (
                <label key={label} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={facilities.includes(label)}
                    onChange={(e) =>
                      setFacilities((prev) =>
                        e.target.checked
                          ? [...prev, label]
                          : prev.filter((x) => x !== label),
                      )
                    }
                  />
                  {label}
                </label>
              ),
            )}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2 className="text-lg font-semibold">{t("stepReview")}</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-[var(--emp-muted)]">{t("title")}</dt>
                <dd className="font-semibold">{title || "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--emp-muted)]">{t("jobTypeLabel")}</dt>
                <dd>{t(`jobType.${jobType}` as "jobType.FULL_TIME")}</dd>
              </div>
              <div>
                <dt className="text-[var(--emp-muted)]">{t("vacancies")}</dt>
                <dd>{vacancies}</dd>
              </div>
              <div>
                <dt className="text-[var(--emp-muted)]">{t("description")}</dt>
                <dd className="whitespace-pre-wrap">{description || "—"}</dd>
              </div>
            </dl>
          </>
        ) : null}
      </section>

      {msg ? <p className="text-sm text-[var(--emp-error)]">{msg}</p> : null}

      <EmployerMembershipRequiredDialog
        open={membershipOpen}
        onOpenChange={setMembershipOpen}
        amountPaise={amountPaise}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="ham-employer__btn ham-employer__btn--ghost"
          onClick={() => (step === 0 ? router.push("/employer/jobs") : setStep((s) => s - 1))}
        >
          {step === 0 ? tc("cancel") : tc("back")}
        </button>
        <div className="flex flex-wrap gap-2">
          {mode === "create" ? (
            <button
              type="button"
              className="ham-employer__btn ham-employer__btn--secondary"
              disabled={!canSubmit || saveMut.isPending || createBlocked}
              onClick={() => submitCreate("DRAFT")}
            >
              {saveMut.isPending ? <span className="ham-employer__spinner" /> : null}
              {t("draft")}
            </button>
          ) : null}
          {step < 4 ? (
            <button
              type="button"
              className="ham-employer__btn ham-employer__btn--primary"
              onClick={() => setStep((s) => s + 1)}
            >
              {tc("next")}: {STEPS[step + 1]}
            </button>
          ) : (
            <button
              type="button"
              className="ham-employer__btn ham-employer__btn--primary"
              disabled={
                !canSubmit || saveMut.isPending || (mode === "create" && createBlocked)
              }
              onClick={() =>
                mode === "create"
                  ? submitCreate("PUBLISHED")
                  : saveMut.mutate(undefined)
              }
            >
              {saveMut.isPending ? <span className="ham-employer__spinner" /> : null}
              {mode === "create" ? t("publish") : t("saveChanges")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
