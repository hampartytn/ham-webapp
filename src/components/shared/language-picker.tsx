"use client";

import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type AppLocale } from "@/i18n/routing";
import { Button } from "@/components/ui/button";

const LABELS: Record<AppLocale, string> = {
  ta: "தமிழ்",
  en: "English",
  hi: "हिन्दी",
};

export function LanguagePicker({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      className={
        compact
          ? "flex flex-wrap gap-2"
          : "flex flex-col gap-3 sm:flex-row sm:items-center"
      }
      role="group"
      aria-label={t("language")}
    >
      {!compact ? (
        <span className="text-sm font-medium text-muted-foreground">
          {t("language")}
        </span>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {locales.map((code) => (
          <Button
            key={code}
            type="button"
            size={compact ? "sm" : "default"}
            variant={locale === code ? "default" : "outline"}
            onClick={() => {
              router.replace(pathname, { locale: code });
            }}
          >
            {LABELS[code]}
          </Button>
        ))}
      </div>
    </div>
  );
}
