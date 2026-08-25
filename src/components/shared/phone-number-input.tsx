"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import {
  DEFAULT_PHONE_COUNTRY,
  formatNationalDisplay,
  digitsOnly,
  splitE164,
  toE164,
  type DialCountry,
} from "@/lib/auth/phone";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (e164: string) => void;
  onBlur?: () => void;
  error?: string | null;
  hint?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Floating label composite field matching register design. */
  variant?: "default" | "floating";
};

/**
 * Friendly phone field (India-first). Stores/emits backend E.164.
 */
export function PhoneNumberInput({
  id: idProp,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  disabled,
  autoFocus,
  variant = "default",
}: Props) {
  const t = useTranslations("auth");
  const reactId = useId();
  const id = idProp ?? reactId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const initial = splitE164(value || "");
  const [country, setCountry] = useState<DialCountry>(initial.country);
  const [national, setNational] = useState(
    formatNationalDisplay(initial.nationalDigits),
  );
  const [focused, setFocused] = useState(false);

  function emit(nextCountry: DialCountry, displayNational: string) {
    const digits = digitsOnly(displayNational).slice(
      0,
      nextCountry.nationalLength,
    );
    onChange(digits.length === 0 ? "" : toE164(nextCountry.dialCode, digits));
  }

  const digits = digitsOnly(national);
  const floatActive = focused || digits.length > 0;

  if (variant === "floating") {
    const india = DEFAULT_PHONE_COUNTRY;

    return (
      <div>
        <div
          className={cn(
            "ham-auth-phone-floating flex items-stretch rounded-lg border bg-white transition-[border-color]",
            error
              ? "border-destructive"
              : focused
                ? "border-[#d8c2bf]"
                : "border-[#ebe4e1]",
          )}
        >
          <span className="flex shrink-0 items-center gap-2 py-3.5 pr-2 pl-3 text-sm font-medium text-[#534341]">
            <span>{t("phoneCountryIndia")}</span>
            <span className="text-[#d8c2bf]" aria-hidden>
              |
            </span>
            <span aria-hidden>{india.dialCode}</span>
          </span>
          <div className="relative min-w-0 flex-grow">
            <input
              id={id}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              autoFocus={autoFocus}
              disabled={disabled}
              placeholder={label}
              className="ham-auth-phone-floating__input block w-full rounded-r-lg border-0 bg-transparent py-3.5 pr-3 pl-2 text-sm leading-6 text-[#1c1b1b] shadow-none outline-none ring-0 placeholder:text-transparent"
              value={national}
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={
                [hint ? hintId : null, error ? errorId : null]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              onChange={(event) => {
                const raw = event.target.value;
                const nextDigits = digitsOnly(raw).slice(
                  0,
                  india.nationalLength,
                );
                const display = formatNationalDisplay(nextDigits);
                setNational(display);
                emit(india, display);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false);
                onBlur?.();
              }}
            />
            <label
              htmlFor={id}
              className={cn(
                "pointer-events-none absolute left-2 bg-white px-1 font-medium transition-all",
                floatActive
                  ? "-top-2.5 text-xs text-[#d32f2f]"
                  : "top-3.5 text-sm text-[#857371]",
              )}
            >
              {label}
            </label>
          </div>
        </div>
        {hint && !error ? (
          <p
            id={hintId}
            className="mt-1.5 ml-1 text-[11px] text-[#534341]/80"
          >
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="mt-1.5 ml-1 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "ham-auth-input-shell flex h-12 overflow-hidden rounded-[var(--auth-radius-sm,0.85rem)] border bg-[var(--auth-input-bg,#fff)] transition-[border-color,box-shadow]",
          error
            ? "ham-auth-input-shell--error border-destructive"
            : "border-[var(--auth-border-strong,rgba(28,20,18,0.18))] focus-within:border-[color-mix(in_srgb,var(--auth-primary,#be1b0f)_55%,transparent)] focus-within:shadow-[0_0_0_3px_rgba(190,27,15,0.18)]",
        )}
      >
        <label className="sr-only" htmlFor={`${id}-country`}>
          {t("phoneCountry")}
        </label>
        <select
          id={`${id}-country`}
          className="shrink-0 border-r border-[var(--auth-border,rgba(28,20,18,0.12))] bg-[var(--auth-surface-soft,#f4ebe7)] px-3 text-sm font-medium text-[var(--auth-ink,#1c1412)] outline-none"
          value={country.iso}
          disabled={disabled}
          onChange={() => {
            setCountry(DEFAULT_PHONE_COUNTRY);
            emit(DEFAULT_PHONE_COUNTRY, national);
          }}
        >
          <option value="IN">{t("phoneCountryIndia")}</option>
        </select>
        <span
          className="flex items-center bg-[var(--auth-surface-soft,#f4ebe7)]/70 px-2.5 text-sm font-medium text-[var(--auth-muted,#5f534f)]"
          aria-hidden
        >
          {country.dialCode}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={t("phonePlaceholder")}
          className="min-w-0 flex-1 bg-transparent px-3 text-base text-[var(--auth-ink,#1c1412)] outline-none placeholder:text-[var(--auth-muted,#5f534f)]/70 md:text-sm"
          value={national}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={
            [hint ? hintId : null, error ? errorId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          onChange={(event) => {
            const raw = event.target.value;
            const nextDigits = digitsOnly(raw).slice(0, country.nationalLength);
            const display = formatNationalDisplay(nextDigits);
            setNational(display);
            emit(country, display);
          }}
          onBlur={onBlur}
        />
      </div>
      {hint && !error ? (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
