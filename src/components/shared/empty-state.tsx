"use client";

import { useTranslations } from "next-intl";

export function EmptyState({
  title,
  description,
}: {
  title?: string;
  description?: string;
}) {
  const t = useTranslations("common");
  return (
    <div className="py-12 text-center">
      <p className="text-base font-medium text-foreground">
        {title ?? t("empty")}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
