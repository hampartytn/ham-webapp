"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  label: string;
  error?: string | null;
  hint?: string;
  className?: string;
  /** Matches designer auth card inputs (floating label + single light border). */
  variant?: "default" | "designer";
} & Omit<ComponentProps<"input">, "id" | "type" | "className">;

export function PasswordField({
  id: idProp,
  label,
  error,
  hint,
  className,
  disabled,
  variant = "default",
  ...inputProps
}: Props) {
  const t = useTranslations("auth");
  const reactId = useId();
  const id = idProp ?? reactId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);

  const value = typeof inputProps.value === "string" ? inputProps.value : "";
  const floatActive = focused || value.length > 0;

  if (variant === "designer") {
    return (
      <div className={cn(className)}>
        <div
          className={cn(
            "ham-auth-password-designer relative flex items-stretch rounded-lg border bg-white transition-[border-color]",
            error
              ? "border-destructive"
              : focused
                ? "border-[#d8c2bf]"
                : "border-[#ebe4e1]",
          )}
        >
          <div className="relative min-w-0 flex-grow">
            <input
              id={id}
              type={visible ? "text" : "password"}
              disabled={disabled}
              className="ham-auth-password-designer__input block w-full rounded-l-lg border-0 bg-transparent py-3.5 pr-2 pl-3.5 text-sm leading-6 text-[#1c1b1b] shadow-none outline-none ring-0 placeholder:text-transparent"
              aria-invalid={Boolean(error) || undefined}
              aria-describedby={
                [hint ? hintId : null, error ? errorId : null]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              {...inputProps}
              placeholder={label}
              onFocus={(event) => {
                setFocused(true);
                inputProps.onFocus?.(event);
              }}
              onBlur={(event) => {
                setFocused(false);
                inputProps.onBlur?.(event);
              }}
            />
            <label
              htmlFor={id}
              className={cn(
                "pointer-events-none absolute left-3.5 bg-white px-1 font-medium transition-all",
                floatActive
                  ? "-top-2.5 text-xs text-[#d32f2f]"
                  : "top-3.5 text-sm text-[#857371]",
              )}
            >
              {label}
            </label>
          </div>
          <button
            type="button"
            className="inline-flex min-w-11 shrink-0 items-center justify-center px-3 text-[#534341] transition-colors hover:text-[#1c1b1b]"
            aria-pressed={visible}
            aria-label={visible ? t("hidePassword") : t("showPassword")}
            disabled={disabled}
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? (
              <EyeOff className="size-5" aria-hidden />
            ) : (
              <Eye className="size-5" aria-hidden />
            )}
          </button>
        </div>
        {hint && !error ? (
          <p id={hintId} className="mt-1.5 ml-1 text-[11px] text-[#534341]/80">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p
            id={errorId}
            className="mt-1.5 ml-1 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div
        className={cn(
          "ham-auth-input-shell flex h-12 overflow-hidden rounded-[var(--auth-radius-sm,0.85rem)] border bg-[var(--auth-input-bg,#fff)] transition-[border-color,box-shadow]",
          error
            ? "ham-auth-input-shell--error border-destructive"
            : "border-[var(--auth-border-strong,rgba(28,20,18,0.18))] focus-within:border-[color-mix(in_srgb,var(--auth-primary,#be1b0f)_55%,transparent)] focus-within:shadow-[0_0_0_3px_rgba(190,27,15,0.18)]",
        )}
      >
        <input
          id={id}
          type={visible ? "text" : "password"}
          disabled={disabled}
          className="min-w-0 flex-1 bg-transparent px-3.5 text-base text-[var(--auth-ink,#1c1412)] outline-none placeholder:text-[var(--auth-muted,#5f534f)]/70 md:text-sm"
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={
            [hint ? hintId : null, error ? errorId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          {...inputProps}
        />
        <button
          type="button"
          className="inline-flex min-w-11 items-center justify-center px-3 text-[var(--auth-muted,#5f534f)] transition-colors hover:text-[var(--auth-ink,#1c1412)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--auth-focus,#be1b0f)]"
          aria-pressed={visible}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          disabled={disabled}
          onClick={() => setVisible((value) => !value)}
        >
          {visible ? (
            <EyeOff className="size-5" aria-hidden />
          ) : (
            <Eye className="size-5" aria-hidden />
          )}
        </button>
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
