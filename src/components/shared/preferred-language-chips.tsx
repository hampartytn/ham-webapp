"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";

import { LOCALE_LABELS } from "@/components/shared/language-selector";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Visual order matching the register design mock. */
const REGISTER_LOCALE_CHIPS: readonly AppLocale[] = ["en", "hi", "ta"];

type Props = {
  disabled?: boolean;
};

/**
 * Preferred-language chips for register — switches UI locale and preferredLanguage.
 */
export function PreferredLanguageChips({ disabled }: Props) {
  const t = useTranslations("auth");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function selectLocale(code: AppLocale) {
    if (code === locale || disabled || pending) return;

    startTransition(() => {
      router.replace(pathname, { locale: code });
    });
  }

  return (
    <fieldset className="space-y-2" disabled={disabled || pending}>
      <legend className="text-sm font-semibold text-[#1c1b1b]">
        {t("preferredLanguage")}
      </legend>
      <div
        className="grid grid-cols-3 gap-2"
        role="radiogroup"
        aria-label={t("preferredLanguage")}
      >
        {REGISTER_LOCALE_CHIPS.map((code) => {
          const selected = code === locale;
          return (
            <button
              key={code}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled || pending}
              onClick={() => {
                void selectLocale(code);
              }}
              className={cn(
                "rounded-lg border py-2 text-center text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d32f2f] focus-visible:ring-offset-2",
                selected
                  ? "border-[#d32f2f] bg-[#d32f2f]/5 text-[#d32f2f]"
                  : "border-[#d8c2bf]/60 text-[#534341] hover:bg-[#f5f3f1]/50",
              )}
            >
              {LOCALE_LABELS[code]}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
