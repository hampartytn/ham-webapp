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
import { BffError, bffJson, proxyPath } from "@/lib/api/bff-client";
import { geoDistrictsQueryOptions, skillsQueryOptions } from "@/lib/query/catalog";
import type { CatalogItem, EmployeeProfile } from "@/types/ham";

export function EmployeeProfileForm() {
  const t = useTranslations("employee");
  const profileQ = useQuery({
    queryKey: ["employee-profile"],
    queryFn: () => bffJson<EmployeeProfile>(proxyPath("employee/profile")),
  });
  useQuery(geoDistrictsQueryOptions);
  useQuery(skillsQueryOptions);

  if (profileQ.isPending && !profileQ.data) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold">{t("editProfile")}</h1>
        <LoadingState />
      </div>
    );
  }
  if (profileQ.error || !profileQ.data) {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <h1 className="text-2xl font-semibold">{t("editProfile")}</h1>
        <ErrorState onRetry={() => void profileQ.refetch()} />
      </div>
    );
  }

  return <EmployeeProfileFormFields key={profileQ.data.id} profile={profileQ.data} />;
}

function EmployeeProfileFormFields({ profile }: { profile: EmployeeProfile }) {
  const t = useTranslations("employee");
  const tc = useTranslations("common");
  const errMsg = useBffErrorMessage();
  const qc = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    profile.dateOfBirth ? profile.dateOfBirth.slice(0, 10) : "",
  );
  const [gender, setGender] = useState(profile.gender ?? "");
  const [districtId, setDistrictId] = useState(profile.districtId ?? "");
  const [cityId, setCityId] = useState(profile.cityId ?? "");
  const [areaId, setAreaId] = useState(profile.areaId ?? "");
  const [availabilityStatus, setAvailabilityStatus] = useState(
    profile.availabilityStatus ?? "AVAILABLE",
  );
  const [availableFrom, setAvailableFrom] = useState(
    profile.availableFrom ? profile.availableFrom.slice(0, 10) : "",
  );
  const [bio, setBio] = useState(profile.bio ?? "");
  const [selectedSkills, setSelectedSkills] = useState(
    profile.skills.map((s) => s.skillId),
  );

  const districtsQ = useQuery(geoDistrictsQueryOptions);
  const skillsQ = useQuery(skillsQueryOptions);
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

  const saveMut = useMutation({
    mutationFn: async () => {
      await bffJson(proxyPath("employee/profile"), {
        method: "PATCH",
        body: JSON.stringify({
          fullName: fullName || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          districtId: districtId || undefined,
          cityId: cityId || undefined,
          areaId: areaId || undefined,
          availabilityStatus,
          availableFrom:
            availabilityStatus === "AVAILABLE_FROM"
              ? availableFrom || undefined
              : undefined,
          bio: bio || undefined,
        }),
      });
      await bffJson(proxyPath("employee/skills"), {
        method: "PUT",
        body: JSON.stringify({
          skills: selectedSkills.map((skillId) => ({ skillId })),
        }),
      });
    },
    onSuccess: async () => {
      setFormError(null);
      await qc.invalidateQueries({ queryKey: ["employee-profile"] });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setFormError(errMsg(e)),
  });

  const uploadMut = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > 2_100_000) {
        throw new BffError({
          status: 400,
          code: "VALIDATION_ERROR",
          message: "File too large",
        });
      }
      const fd = new FormData();
      fd.append("file", file);
      return bffJson(proxyPath("employee/profile/image"), {
        method: "POST",
        body: fd,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["employee-profile"] });
    },
    onError: (e) => setFormError(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold">{t("editProfile")}</h1>

      <div className="space-y-2">
        <Label>{t("uploadImage")}</Label>
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadMut.mutate(f);
          }}
        />
        <p className="text-xs text-muted-foreground">{t("imageHint")}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("fullName")}</Label>
        <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>{t("dateOfBirth")}</Label>
        <Input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>{t("gender")}</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={gender}
          onChange={(e) => setGender(e.target.value)}
        >
          <option value="">—</option>
          <option value="MALE">MALE</option>
          <option value="FEMALE">FEMALE</option>
          <option value="OTHER">OTHER</option>
          <option value="PREFER_NOT_TO_SAY">PREFER_NOT_TO_SAY</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label>{t("district")}</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
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
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={cityId}
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
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={areaId}
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
      <div className="space-y-2">
        <Label>{t("availability")}</Label>
        <select
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          value={availabilityStatus}
          onChange={(e) => setAvailabilityStatus(e.target.value)}
        >
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="NOT_AVAILABLE">NOT_AVAILABLE</option>
          <option value="AVAILABLE_FROM">AVAILABLE_FROM</option>
        </select>
      </div>
      {availabilityStatus === "AVAILABLE_FROM" ? (
        <div className="space-y-2">
          <Label>{t("availableFrom")}</Label>
          <Input
            type="date"
            value={availableFrom}
            onChange={(e) => setAvailableFrom(e.target.value)}
          />
        </div>
      ) : null}
      <div className="space-y-2">
        <Label>{t("bio")}</Label>
        <textarea
          className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t("skills")}</legend>
        <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-3">
          {(skillsQ.data ?? []).map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedSkills.includes(s.id)}
                onChange={(e) => {
                  setSelectedSkills((prev) =>
                    e.target.checked
                      ? [...prev, s.id]
                      : prev.filter((id) => id !== s.id),
                  );
                }}
              />
              {s.name}
            </label>
          ))}
        </div>
      </fieldset>

      {formError ? (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      ) : null}

      <Button
        type="button"
        disabled={saveMut.isPending}
        onClick={() => saveMut.mutate()}
      >
        {saveMut.isPending ? tc("loading") : t("saveProfile")}
      </Button>
    </div>
  );
}
