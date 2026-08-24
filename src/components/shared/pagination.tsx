"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

export function PaginationControls({
  page,
  hasNext,
  hasPrevious,
  onPrevious,
  onNext,
}: {
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <Button
        type="button"
        variant="outline"
        disabled={!hasPrevious}
        onClick={onPrevious}
      >
        {t("previous")}
      </Button>
      <span className="text-sm text-muted-foreground">
        {t("page", { page })}
      </span>
      <Button
        type="button"
        variant="outline"
        disabled={!hasNext}
        onClick={onNext}
      >
        {t("next")}
      </Button>
    </div>
  );
}
