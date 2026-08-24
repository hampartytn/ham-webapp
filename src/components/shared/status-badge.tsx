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

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
      {status}
    </span>
  );
}

export function formatPaise(paise: number | null | undefined): string {
  if (paise == null) return "—";
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}
