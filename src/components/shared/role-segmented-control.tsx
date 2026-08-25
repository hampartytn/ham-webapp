"use client";

import { Building2, HardHat } from "lucide-react";
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
  icon: typeof HardHat;
  labelKey: "roleWorkerShort" | "roleEmployerShort";
}[] = [
  { role: "EMPLOYEE", icon: HardHat, labelKey: "roleWorkerShort" },
  { role: "EMPLOYER", icon: Building2, labelKey: "roleEmployerShort" },
];

/**
 * Designer register role control — segmented Worker / Employer.
 * Maps to backend EMPLOYEE / EMPLOYER.
 */
export function RoleSegmentedControl({ value, onChange, disabled }: Props) {
  const t = useTranslations("auth");

  return (
    <fieldset className="space-y-2" disabled={disabled}>
      <legend className="text-sm font-semibold text-[#1c1b1b]">
        {t("roleJoiningAs")}
      </legend>
      <div
        className="grid grid-cols-2 gap-3 rounded-xl bg-[#f5f3f1]/50 p-1"
        role="radiogroup"
        aria-label={t("roleJoiningAs")}
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
                "flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d32f2f] focus-visible:ring-offset-2",
                selected
                  ? "bg-white text-[#d32f2f] shadow-sm ring-1 ring-[#d32f2f]/20"
                  : "text-[#534341] hover:bg-white",
              )}
            >
              <Icon className="size-[18px] shrink-0" aria-hidden />
              {t(option.labelKey)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
