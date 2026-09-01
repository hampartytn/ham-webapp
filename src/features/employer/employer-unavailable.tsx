"use client";

import { useTranslations } from "next-intl";

export function EmployerUnavailable({
  titleKey,
  bodyKey,
}: {
  titleKey: string;
  bodyKey: string;
}) {
  const t = useTranslations("employer");
  return (
    <div className="mx-auto max-w-lg">
      <div className="ham-employer__card space-y-3 p-8 text-center">
        <h1 className="text-2xl font-bold">{t(titleKey as "navMessages")}</h1>
        <p className="text-base text-[var(--emp-muted)]">{t(bodyKey as "messagesUnavailable")}</p>
      </div>
    </div>
  );
}
