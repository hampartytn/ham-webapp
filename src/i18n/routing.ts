import { defineRouting } from "next-intl/routing";

export const locales = ["ta", "en", "hi"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "ta",
  localePrefix: "always",
});
