import { type AppLocale, resolveAppLocale } from "@/i18n/routing";

export type DialCountry = {
  iso: string;
  dialCode: string;
  /** National significant number length (digits only). */
  nationalLength: number;
};

/** Extensible catalog — India first for HAM (Tamil Nadu). */
export const PHONE_COUNTRIES: readonly DialCountry[] = [
  { iso: "IN", dialCode: "+91", nationalLength: 10 },
] as const;

export const DEFAULT_PHONE_COUNTRY = PHONE_COUNTRIES[0]!;

const E164 = /^\+[1-9]\d{7,14}$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatNationalDisplay(digits: string): string {
  const d = digitsOnly(digits).slice(0, 15);
  if (d.length <= 5) return d;
  if (d.length <= 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 5)} ${d.slice(5, 10)} ${d.slice(10)}`;
}

export function toE164(dialCode: string, nationalDigits: string): string {
  const dial = dialCode.startsWith("+") ? dialCode : `+${dialCode}`;
  return `${dial}${digitsOnly(nationalDigits)}`;
}

export function isValidE164(phone: string): boolean {
  return E164.test(phone);
}

/** Split an E.164 value into dial + national when it matches a known country. */
export function splitE164(phone: string): {
  country: DialCountry;
  nationalDigits: string;
} {
  const trimmed = phone.trim();
  for (const country of PHONE_COUNTRIES) {
    if (trimmed.startsWith(country.dialCode)) {
      return {
        country,
        nationalDigits: digitsOnly(trimmed.slice(country.dialCode.length)),
      };
    }
  }
  if (trimmed.startsWith("+")) {
    return {
      country: DEFAULT_PHONE_COUNTRY,
      nationalDigits: digitsOnly(trimmed.slice(1)),
    };
  }
  return {
    country: DEFAULT_PHONE_COUNTRY,
    nationalDigits: digitsOnly(trimmed),
  };
}

export function defaultPreferredLanguage(locale: string): AppLocale {
  return resolveAppLocale(locale);
}
