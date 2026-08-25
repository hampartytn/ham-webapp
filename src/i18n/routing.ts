import { defineRouting } from "next-intl/routing";

export const locales = ["ta", "en", "hi"] as const;
export type AppLocale = (typeof locales)[number];

/** Display / selector order — Hindi first as the intentional product default. */
export const localeDisplayOrder: readonly AppLocale[] = ["hi", "ta", "en"];

export const DEFAULT_LOCALE: AppLocale = "hi";

export function isAppLocale(value: string): value is AppLocale {
  return (locales as readonly string[]).includes(value);
}

export function resolveAppLocale(
  value: string | null | undefined,
): AppLocale {
  return value && isAppLocale(value) ? value : DEFAULT_LOCALE;
}

export const routing = defineRouting({
  locales,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "always",
  // Do not prefer browser Accept-Language over the intentional Hindi default.
  localeDetection: false,
});
