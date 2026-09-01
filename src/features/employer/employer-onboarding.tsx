"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Building2, Mail, Smartphone, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { ErrorState } from "@/components/shared/error-state";
import { LoadingState } from "@/components/shared/loading-state";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { Link, useRouter } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { ME_QUERY_KEY } from "@/lib/query/session-cache";
import type { EmployerOrg, MeResponse } from "@/types/ham";

export function EmployerOnboarding() {
  const t = useTranslations("employer");
  const tc = useTranslations("common");
  const errMsg = useBffErrorMessage();
  const router = useRouter();
  const qc = useQueryClient();
  const meQ = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
  });
  const profileQ = useQuery({
    queryKey: ["employer-profile"],
    queryFn: () =>
      bffJson<{
        id: string;
        fullName: string | null;
        organization: EmployerOrg | null;
      }>(proxyPath("employer/profile")),
  });

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!profileQ.data) return;
    setFullName(profileQ.data.fullName ?? "");
    setEmail(profileQ.data.organization?.contactEmail ?? meQ.data?.email ?? "");
  }, [profileQ.data, meQ.data?.email]);

  const saveMut = useMutation({
    mutationFn: async () => {
      await bffJson(proxyPath("employer/profile"), {
        method: "PATCH",
        body: JSON.stringify({ fullName: fullName.trim() || undefined }),
      });
      const org = profileQ.data?.organization;
      if (org?.name && email.trim()) {
        await bffJson(proxyPath("employer/organization"), {
          method: "PUT",
          body: JSON.stringify({
            name: org.name,
            contactEmail: email.trim(),
            description: org.description || undefined,
            contactPhone: org.contactPhone || undefined,
            districtId: org.districtId || undefined,
            cityId: org.cityId || undefined,
          }),
        });
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["employer-profile"] });
      await qc.invalidateQueries({ queryKey: ME_QUERY_KEY });
      router.push("/employer/organization");
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  if (profileQ.isPending && !profileQ.data) {
    return (
      <div className="mx-auto max-w-[640px]">
        <LoadingState />
      </div>
    );
  }
  if (profileQ.error) {
    return <ErrorState onRetry={() => void profileQ.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="ham-employer__card space-y-10 overflow-hidden border-t-4 border-t-[var(--emp-primary)] p-10">
        <div className="flex items-center justify-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-md bg-[var(--emp-primary-light)] text-[var(--emp-primary)]">
            <Building2 className="size-5" />
          </span>
          <span className="text-2xl font-semibold">{t("brandName")}</span>
        </div>
        <div>
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--emp-muted)]">
            <span>{t("stepOf", { current: 4, total: 8 })}</span>
            <span>{t("profileSetup")}</span>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="h-1.5 flex-1 rounded-full"
                style={{
                  background: i < 4 ? "var(--emp-primary)" : "var(--emp-border)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-[2rem] font-bold leading-10">{t("basicInfoTitle")}</h1>
          <p className="mt-2 text-base text-[var(--emp-muted)]">{t("basicInfoHelp")}</p>
        </div>
        <div className="space-y-6">
          <label className="block space-y-2 text-lg font-semibold">
            {t("employerFullName")}
            <span className="relative block">
              <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--emp-muted)]" />
              <input
                className="ham-employer__input pl-10 font-normal"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t("fullNamePlaceholder")}
              />
            </span>
          </label>
          <label className="block space-y-2 text-lg font-semibold">
            {t("contactEmail")}
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--emp-muted)]" />
              <input
                className="ham-employer__input pl-10 font-normal"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
              />
            </span>
          </label>
          <label className="block space-y-2 text-lg font-semibold">
            <span className="flex items-center justify-between">
              {t("accountPhone")}
              <span className="text-xs font-normal text-[var(--emp-muted)]">
                {t("phoneLockedHint")}
              </span>
            </span>
            <span className="relative block">
              <Smartphone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--emp-muted)]" />
              <input
                className="ham-employer__input bg-[var(--emp-soft)] pl-10 pr-28 font-normal"
                value={meQ.data?.phone ?? ""}
                readOnly
                disabled
              />
              <span className="ham-employer__pill ham-employer__pill--success absolute right-2 top-1/2 -translate-y-1/2">
                {t("phoneVerifiedBadge")}
              </span>
            </span>
          </label>
        </div>
        {msg ? <p className="text-sm text-[var(--emp-error)]">{msg}</p> : null}
        <div className="flex items-center justify-between border-t border-[var(--emp-border)] pt-6">
          <Link href="/employer/welcome" className="ham-employer__btn ham-employer__btn--ghost">
            <ArrowLeft className="size-4" />
            {tc("back")}
          </Link>
          <button
            type="button"
            className="ham-employer__btn ham-employer__btn--primary"
            disabled={saveMut.isPending || !fullName.trim()}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? <span className="ham-employer__spinner" /> : null}
            {tc("continue")}
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
