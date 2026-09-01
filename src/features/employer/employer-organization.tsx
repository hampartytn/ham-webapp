"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions } from "@/lib/query/catalog";
import type { CatalogItem, EmployerOrg } from "@/types/ham";

export function EmployerOrganizationForm() {
  const t = useTranslations("employer");
  const profileQ = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () =>
      bffJson<{
        id: string;
        fullName: string | null;
        organization: EmployerOrg | null;
      }>(proxyPath("employer/profile")),
  });
  useQuery(geoDistrictsQueryOptions);

  if (profileQ.isPending && !profileQ.data) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <EmployerPageHeader title={t("orgTitle")} subtitle={t("orgSubtitle")} />
        <LoadingState />
      </div>
    );
  }
  if (profileQ.error) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <EmployerPageHeader title={t("orgTitle")} subtitle={t("orgSubtitle")} />
        <ErrorState onRetry={() => void profileQ.refetch()} />
      </div>
    );
  }

  return (
    <EmployerOrganizationFields
      key={profileQ.data?.organization?.id ?? "new-org"}
      organization={profileQ.data?.organization ?? null}
      fullName={profileQ.data?.fullName ?? null}
    />
  );
}

function EmployerOrganizationFields({
  organization,
  fullName,
}: {
  organization: EmployerOrg | null;
  fullName: string | null;
}) {
  const t = useTranslations("employer");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [name, setName] = useState(organization?.name ?? "");
  const [description, setDescription] = useState(
    organization?.description ?? "",
  );
  const [contactPhone, setContactPhone] = useState(
    organization?.contactPhone ?? "",
  );
  const [contactEmail, setContactEmail] = useState(
    organization?.contactEmail ?? "",
  );
  const [districtId, setDistrictId] = useState(organization?.districtId ?? "");
  const [cityId, setCityId] = useState(organization?.cityId ?? "");
  const [employerFullName, setEmployerFullName] = useState(fullName ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const citiesQ = useQuery({
    queryKey: ["geo-cities", districtId],
    enabled: Boolean(districtId),
    queryFn: () =>
      bffJson<CatalogItem[]>(proxyPath(`geo/districts/${districtId}/cities`)),
  });

  const checklist = [
    { ok: Boolean(name.trim()), label: t("checklistName") },
    { ok: Boolean(districtId), label: t("checklistLocation") },
    { ok: Boolean(contactPhone || contactEmail), label: t("checklistContact") },
  ];

  const saveMut = useMutation({
    mutationFn: async () => {
      if (employerFullName.trim()) {
        await bffJson(proxyPath("employer/profile"), {
          method: "PATCH",
          body: JSON.stringify({ fullName: employerFullName.trim() }),
        });
      }
      return bffJson(proxyPath("employer/organization"), {
        method: "PUT",
        body: JSON.stringify({
          name,
          description: description || undefined,
          contactPhone: contactPhone || undefined,
          contactEmail: contactEmail || undefined,
          districtId: districtId || undefined,
          cityId: cityId || undefined,
        }),
      });
    },
    onSuccess: async () => {
      setMsg(null);
      setSaved(true);
      await qc.invalidateQueries({ queryKey: ["employer-profile"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => {
      setSaved(false);
      setMsg(errMsg(e));
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <EmployerPageHeader
        title={t("orgTitle")}
        subtitle={t("orgSubtitle")}
      />

      <section className="ham-employer__card space-y-3 p-6">
        <h2 className="text-base font-semibold">{t("profileChecklist")}</h2>
        <ul className="space-y-1 text-sm">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-2">
              <span
                className={
                  item.ok
                    ? "text-emerald-700"
                    : "text-[var(--emp-muted)]"
                }
                aria-hidden
              >
                {item.ok ? "✓" : "○"}
              </span>
              {item.label}
            </li>
          ))}
        </ul>
        {organization ? (
          <p className="text-xs text-[var(--emp-muted)]">
            {t("verificationState")}:{" "}
            {t(
              `orgVerification.${organization.verificationState}` as "orgVerification.UNVERIFIED",
            )}{" "}
            · {t("activationStatus")}: {organization.activationStatus}
          </p>
        ) : null}
        <Link
          href="/employer/verification"
          className="inline-block text-sm font-semibold text-[var(--emp-primary)] hover:underline"
        >
          {t("accountVerification")}
        </Link>
      </section>

      <section className="ham-employer__card space-y-4 p-6">
        <h2 className="text-base font-semibold">{t("sectionCompany")}</h2>
        <div className="space-y-2">
          <Label>{t("employerFullName")}</Label>
          <input
            className="ham-employer__input"
            value={employerFullName}
            onChange={(e) => setEmployerFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("orgName")}</Label>
          <input
            className="ham-employer__input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("orgDescription")}</Label>
          <textarea
            className="ham-employer__input min-h-20"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("contactPhone")}</Label>
            <input
              className="ham-employer__input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("contactEmail")}</Label>
            <input
              className="ham-employer__input"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="ham-employer__card space-y-4 p-6">
        <h2 className="text-base font-semibold">{t("sectionLocation")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("district")}</Label>
            <select
              className="ham-employer__input"
              value={districtId}
              onChange={(e) => {
                setDistrictId(e.target.value);
                setCityId("");
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
              onChange={(e) => setCityId(e.target.value)}
            >
              <option value="">—</option>
              {(citiesQ.data ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
      {saved ? (
        <p className="text-sm text-emerald-700">{t("saveSuccess")}</p>
      ) : null}
      <button
        type="button"
        className="ham-employer__btn ham-employer__btn--primary"
        disabled={saveMut.isPending || !name}
        onClick={() => saveMut.mutate()}
      >
        {saveMut.isPending ? <span className="ham-employer__spinner" /> : null}
        {t("saveOrg")}
      </button>
    </div>
  );
}
