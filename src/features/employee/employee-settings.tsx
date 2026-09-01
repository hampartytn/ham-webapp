"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { LanguagePicker } from "@/components/shared/language-picker";
import { LogoutButton } from "@/components/shared/logout-button";
import { PasswordSetForm } from "@/features/auth/components/password-set-form";
import { Button } from "@/components/ui/button";
import { useBffErrorMessage } from "@/components/shared/status-badge";
import { applyPreferredLanguageCache } from "@/lib/query/session-cache";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { useRouter } from "@/i18n/navigation";

export function EmployeeSettingsPanel() {
  const t = useTranslations("employee");
  const ta = useTranslations("auth");
  const errMsg = useBffErrorMessage();
  const locale = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [lang, setLang] = useState<"ta" | "en" | "hi">(
    locale === "en" || locale === "hi" || locale === "ta" ? locale : "hi",
  );
  const [msg, setMsg] = useState<string | null>(null);

  const saveLang = useMutation({
    mutationFn: () =>
      bffJson(proxyPath("me"), {
        method: "PATCH",
        body: JSON.stringify({ preferredLanguage: lang }),
      }),
    onSuccess: () => {
      setMsg(null);
      applyPreferredLanguageCache(qc, lang);
    },
    onError: (e) => setMsg(errMsg(e)),
  });

  return (
    <div className="mx-auto max-w-lg space-y-10">
      <h1 className="text-2xl font-semibold">{t("settingsLanguage")}</h1>

      <section className="space-y-3">
        <LanguagePicker />
        <div className="space-y-2">
          <label className="text-sm font-medium">{t("settingsLanguage")}</label>
          <select
            className="flex h-10 w-full rounded-md border border-input px-3 text-sm"
            value={lang}
            onChange={(e) => setLang(e.target.value as "ta" | "en" | "hi")}
          >
            <option value="ta">தமிழ்</option>
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
          <Button
            type="button"
            disabled={saveLang.isPending}
            onClick={() => {
              applyPreferredLanguageCache(qc, lang);
              router.replace("/employee/settings", { locale: lang });
              saveLang.mutate();
            }}
          >
            {t("saveLanguage")}
          </Button>
          {msg ? <p className="text-sm text-destructive">{msg}</p> : null}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-medium">{ta("setPasswordTitle")}</h2>
        <PasswordSetForm />
      </section>

      <LogoutButton />
    </div>
  );
}
