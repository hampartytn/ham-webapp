"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Link } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import type { CatalogItem, EmployerOrg, MeResponse } from "@/types/ham";

export function EmployerDashboard() {
  const t = useTranslations("employer");
  const ts = useTranslations("shell");
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
  });

  if (meQ.isLoading) return <LoadingState />;
  if (meQ.error || !meQ.data) {
    return <ErrorState onRetry={() => void meQ.refetch()} />;
  }

  const orgId = meQ.data.employerProfile?.organizationId;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboardTitle")}</h1>
        <p className="text-muted-foreground">
          {ts("sessionPhone", { phone: meQ.data.phone })}
        </p>
      </div>
      {!orgId ? (
        <p className="text-sm text-destructive">{t("orgRequired")}</p>
      ) : (
        <p className="text-sm">
          {t("orgTitle")}: {meQ.data.employerProfile?.organizationName}
        </p>
      )}
      <p className="text-sm text-muted-foreground">{t("paymentsNote")}</p>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href="/employer/organization">
          {t("orgTitle")}
        </Link>
        <Link className="underline" href="/employer/jobs">
          {t("jobsTitle")}
        </Link>
        <Link className="underline" href="/employer/workers">
          {t("workersTitle")}
        </Link>
      </div>
    </div>
  );
}

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
    />
  );
}

function EmployerOrganizationFields({
  organization,
}: {
  organization: EmployerOrg | null;
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

  const saveMut = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("employer/organization"), {
        method: "PUT",
        body: JSON.stringify({
          name,
          description: description || undefined,
          contactPhone: contactPhone || undefined,
          contactEmail: contactEmail || undefined,
          districtId: districtId || undefined,
          cityId: cityId || undefined,
        }),
      }),
    onSuccess: async () => {
      setMsg(null);
      await qc.invalidateQueries({ queryKey: ["employer-profile"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-2xl font-semibold">{t("orgTitle")}</h1>
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
      <div className="space-y-2">
        <Label>District</Label>
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
        <Label>City</Label>
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
      {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
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
