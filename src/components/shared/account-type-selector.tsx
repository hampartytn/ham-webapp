"use client";

import { BriefcaseBusiness, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

export type AccountRole = "EMPLOYEE" | "EMPLOYER";

type Props = {
  value: AccountRole;
  onChange: (role: AccountRole) => void;
  disabled?: boolean;
};

const OPTIONS: {
  role: AccountRole;
  icon: typeof BriefcaseBusiness;
  titleKey: "roleEmployee" | "roleEmployer";
  hintKey: "roleEmployeeHint" | "roleEmployerHint";
}[] = [
  {
    role: "EMPLOYEE",
    icon: BriefcaseBusiness,
    titleKey: "roleEmployee",
    hintKey: "roleEmployeeHint",
  },
  {
    role: "EMPLOYER",
    icon: Building2,
    titleKey: "roleEmployer",
    hintKey: "roleEmployerHint",
  },
];

export function AccountTypeSelector({ value, onChange, disabled }: Props) {
  const t = useTranslations("auth");

  return (
    <fieldset className="space-y-3" disabled={disabled}>
      <legend className="text-sm font-semibold text-[var(--auth-ink,#1c1412)]">
        {t("role")}
      </legend>
      <div
        className="grid gap-3 sm:grid-cols-2"
        role="radiogroup"
        aria-label={t("role")}
      >
        {OPTIONS.map((option) => {
          const selected = value === option.role;
          const Icon = option.icon;
          return (
            <button
              key={option.role}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={disabled}
              onClick={() => onChange(option.role)}
              className={cn(
                "ham-auth-role focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--auth-focus,#be1b0f)] focus-visible:ring-offset-2",
                selected && "ham-auth-role--selected",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl transition-colors",
                  selected
                    ? "bg-[var(--auth-primary,#be1b0f)] text-[var(--auth-primary-fg,#fffaf8)]"
                    : "bg-[var(--auth-surface-soft,#f4ebe7)] text-[var(--auth-ink,#1c1412)]",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="space-y-1 pe-5">
                <span className="block text-[0.95rem] font-semibold text-[var(--auth-ink,#1c1412)]">
                  {t(option.titleKey)}
                </span>
                <span className="block text-sm leading-snug text-[var(--auth-muted,#5f534f)]">
                  {t(option.hintKey)}
                </span>
              </span>
              <span
                className={cn(
                  "absolute top-3 end-3 flex size-5 items-center justify-center rounded-full border-2",
                  selected
                    ? "border-[var(--auth-primary,#be1b0f)] bg-[var(--auth-primary,#be1b0f)] text-[var(--auth-primary-fg,#fffaf8)]"
                    : "border-[var(--auth-muted,#5f534f)]/40 bg-transparent",
                )}
                aria-hidden
              >
                {selected ? (
                  <span className="size-2 rounded-full bg-[var(--auth-primary-fg,#fffaf8)]" />
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
