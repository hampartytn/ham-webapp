"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Crown, Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Label } from "@/components/ui/label";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions } from "@/lib/query/catalog";
import { cn } from "@/lib/utils";
import type { CatalogItem, EmployerOrg } from "@/types/ham";

import {
  companyProfileChecklist,
  companyProfileCompletionPercent,
  isOrganizationVerified,
  isPremiumMembership,
  organizationVerificationBadgeKey,
} from "./employer-organization-view";

const CHECKLIST_LABEL: Record<
  "name" | "location" | "contact",
  "checklistName" | "checklistLocation" | "checklistContact"
> = {
  name: "checklistName",
  location: "checklistLocation",
  contact: "checklistContact",
};

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
      <div className="ham-employer-org">
        <h1 className="ham-employer-org__title">{t("orgTitle")}</h1>
        <LoadingState />
      </div>
    );
  }
  if (profileQ.error) {
    return (
      <div className="ham-employer-org">
        <h1 className="ham-employer-org__title">{t("orgTitle")}</h1>
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

function FieldLabel({ children }: { children: string }) {
  return (
    <Label className="text-xs font-medium text-[var(--emp-muted)]">
      {children}
    </Label>
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

  const fields = {
    fullName: employerFullName,
    name,
    description,
    contactEmail,
    contactPhone,
    districtId,
    cityId,
  };
  const percent = companyProfileCompletionPercent(fields);
  const checklist = companyProfileChecklist(fields);
  const verified = isOrganizationVerified(organization?.verificationState);
  const premium = isPremiumMembership(organization?.membershipStatus);
  const verificationKey = organizationVerificationBadgeKey(
    organization?.verificationState,
  );

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
      await qc.invalidateQueries({ queryKey: ["employer-membership"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => {
      setSaved(false);
      setMsg(errMsg(e));
    },
  });

  return (
    <div className="ham-employer-org">
      <header className="ham-employer-org__header">
        <h1 className="ham-employer-org__title">{t("orgTitle")}</h1>
        <p className="ham-employer-org__completion">
          {t("orgProfileCompletion", { percent })}
        </p>
        <div
          className="ham-employer-org__bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          aria-label={t("orgProfileCompletion", { percent })}
        >
          <span style={{ width: `${percent}%` }} />
        </div>
      </header>

      <section className="ham-employer__card ham-employer-org__status">
        <div className="ham-employer-org__badges">
          <span
            className={cn(
              "ham-employer-org__badge",
              verified
                ? "ham-employer-org__badge--verified"
                : organization?.verificationState === "REJECTED"
                  ? "ham-employer-org__badge--danger"
                  : organization?.verificationState === "PENDING"
                    ? "ham-employer-org__badge--warn"
                    : "ham-employer-org__badge--muted",
            )}
          >
            <span className="ham-employer-org__badge-icon" aria-hidden>
              {verified ? (
                <Check className="size-3.5" strokeWidth={2.5} />
              ) : (
                <Shield className="size-3.5" strokeWidth={2.25} />
              )}
            </span>
            {t(verificationKey)}
          </span>
          <span
            className={cn(
              "ham-employer-org__badge",
              premium
                ? "ham-employer-org__badge--premium"
                : "ham-employer-org__badge--muted",
            )}
          >
            <span className="ham-employer-org__badge-icon" aria-hidden>
              <Crown className="size-3.5" strokeWidth={2.25} />
            </span>
            {premium
              ? t("orgPremiumMembership")
              : t("orgMembershipInactive")}
          </span>
        </div>
        <ul className="ham-employer-org__checks">
          {checklist.map((item) => (
            <li key={item.key} className="ham-employer-org__check">
              <span
                className={
                  item.ok
                    ? "ham-employer-org__check-mark"
                    : "ham-employer-org__check-empty"
                }
                aria-hidden
              >
                {item.ok ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </span>
              {t(CHECKLIST_LABEL[item.key])}
            </li>
          ))}
        </ul>
      </section>

      <section className="ham-employer__card ham-employer-org__card">
        <h2 className="ham-employer-org__card-title">
          {t("orgGeneralInformation")}
        </h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <FieldLabel>{t("employerFullName")}</FieldLabel>
            <input
              className="ham-employer__input"
              value={employerFullName}
              onChange={(e) => setEmployerFullName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{t("orgFieldName")}</FieldLabel>
            <input
              className="ham-employer__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{t("orgFieldDescription")}</FieldLabel>
            <textarea
              className="ham-employer__input ham-employer-org__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="ham-employer__card ham-employer-org__card">
        <h2 className="ham-employer-org__card-title">{t("orgContactDetails")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>{t("orgFieldEmail")}</FieldLabel>
            <input
              className="ham-employer__input"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel>{t("orgFieldPhone")}</FieldLabel>
            <input
              className="ham-employer__input"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="ham-employer__card ham-employer-org__card">
        <h2 className="ham-employer-org__card-title">{t("location")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <FieldLabel>{t("district")}</FieldLabel>
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
          <div className="space-y-1.5">
            <FieldLabel>{t("city")}</FieldLabel>
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

      {msg ? (
        <p className="text-center text-sm text-destructive">{msg}</p>
      ) : null}
      {saved ? (
        <p className="text-center text-sm text-emerald-700">{t("saveSuccess")}</p>
      ) : null}

      <div className="flex justify-center">
        <button
          type="button"
          className="ham-employer__btn ham-employer__btn--lg ham-employer__btn--primary ham-employer-org__save"
          disabled={saveMut.isPending || !name.trim()}
          onClick={() => saveMut.mutate()}
        >
          {saveMut.isPending ? <span className="ham-employer__spinner" /> : null}
          {t("orgSaveChanges")}
        </button>
      </div>
    </div>
  );
}
