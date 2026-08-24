"use client";

import { useTranslations } from "next-intl";

export function LoadingState({ label }: { label?: string }) {
  const t = useTranslations("common");
  return (
    <div
      className="flex items-center justify-center gap-2 py-12 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <span className="size-4 animate-pulse rounded-full bg-muted-foreground/40" />
      <span>{label ?? t("loading")}</span>
    </div>
  );
}
