"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { nestErrorMessageKey } from "@/i18n/error-codes";

export function ErrorState({
  code,
  message,
  onRetry,
}: {
  code?: string;
  message?: string;
  onRetry?: () => void;
}) {
  const t = useTranslations();
  const key = nestErrorMessageKey(code);
  const text = message ?? t(key as "errors.UNKNOWN");

  return (
    <div className="space-y-4 py-12 text-center" role="alert">
      <p className="text-base text-foreground">{text}</p>
      {onRetry ? (
        <Button type="button" variant="outline" onClick={onRetry}>
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
