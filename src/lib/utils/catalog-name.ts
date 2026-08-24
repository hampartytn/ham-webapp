import type { AppLocale } from "@/i18n/routing";

/**
 * Nest catalog locale maps: names[locale] ?? names.en ?? firstAvailable ?? fallback
 */
export function resolveCatalogName(
  names: Record<string, string> | null | undefined,
  locale: AppLocale | string,
  fallback = "—",
): string {
  if (!names || typeof names !== "object") {
    return fallback;
  }

  const direct = names[locale];
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct;
  }

  const en = names.en;
  if (typeof en === "string" && en.trim().length > 0) {
    return en;
  }

  for (const value of Object.values(names)) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }

  return fallback;
}
