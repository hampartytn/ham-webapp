"use client";

import { useTranslations } from "next-intl";

import { BffError } from "@/lib/api/bff-client";

export function useBffErrorMessage() {
  const te = useTranslations("errors");
  return (error: unknown) => {
    if (error instanceof BffError) {
      try {
        return te(error.code as "UNKNOWN");
      } catch {
        return te("UNKNOWN");
      }
    }
    return te("UNKNOWN");
  };
}

const TONE_CLASS: Record<string, string> = {
  neutral: "bg-secondary text-secondary-foreground",
  info: "bg-sky-50 text-sky-900",
  success: "bg-emerald-50 text-emerald-900",
  warning: "bg-amber-50 text-amber-950",
  danger: "bg-red-50 text-red-900",
  muted: "bg-[var(--emp-soft,#f7f3f1)] text-[var(--emp-muted,#6b5e5a)]",
};

export function StatusBadge({
  status,
  label,
  tone = "neutral",
}: {
  status: string;
  label?: string;
  /** Visual tone — always keep text label; never color-only. */
  tone?: keyof typeof TONE_CLASS;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${TONE_CLASS[tone] ?? TONE_CLASS.neutral}`}
    >
      <span
        className="size-1.5 shrink-0 rounded-full bg-current opacity-70"
        aria-hidden
      />
      <span>{label ?? status}</span>
    </span>
  );
}

export function formatPaise(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
