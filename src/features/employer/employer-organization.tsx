"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { EmployerPageHeader } from "@/components/employer/employer-page-header";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { CatalogItem, EmployerOrg } from "@/types/ham";

export function EmployerOrganizationForm() {
  const profileQ = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () =>
      bffJson<{
        id: string;
        fullName: string | null;
        organization: EmployerOrg | null;
      }>(proxyPath("employer/profile")),
  });

  if (profileQ.isLoading) return <LoadingState />;
  if (profileQ.error) {
    return <ErrorState onRetry={() => void profileQ.refetch()} />;
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

      <section className="ham-employer__panel space-y-3">
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
            {t("verificationState")}: {organization.verificationState} ·{" "}
            {t("activationStatus")}: {organization.activationStatus}
          </p>
        ) : null}
      </section>

      <section className="ham-employer__panel space-y-4">
        <h2 className="text-base font-semibold">{t("sectionCompany")}</h2>
        <div className="space-y-2">
          <Label>{t("employerFullName")}</Label>
          <Input
            value={employerFullName}
            onChange={(e) => setEmployerFullName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("orgName")}</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>{t("orgDescription")}</Label>
          <textarea
            className="min-h-20 w-full rounded-md border border-input px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("contactPhone")}</Label>
            <Input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("contactEmail")}</Label>
            <Input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="ham-employer__panel space-y-4">
        <h2 className="text-base font-semibold">{t("sectionLocation")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("district")}</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
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
              className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
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
      <Button
        type="button"
        disabled={saveMut.isPending || !name}
        onClick={() => saveMut.mutate()}
      >
        {t("saveOrg")}
      </Button>
    </div>
  );
}
