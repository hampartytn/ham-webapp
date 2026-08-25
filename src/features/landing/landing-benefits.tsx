import {
  ClipboardList,
  Globe2,
  Handshake,
  Scale,
  UserRound,
  Wrench,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { LandingSection, LandingSectionHeading } from "./section";
import { cn } from "@/lib/utils";

const BENEFITS = [
  { key: "jobs", icon: Wrench, soon: false, emphasize: true },
  { key: "apply", icon: ClipboardList, soon: false, emphasize: true },
  { key: "profile", icon: UserRound, soon: false, emphasize: false },
  { key: "employers", icon: Handshake, soon: false, emphasize: false },
  { key: "legal", icon: Scale, soon: false, emphasize: false },
  { key: "welfare", icon: Globe2, soon: true, emphasize: false },
] as const;

export async function LandingBenefits() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <LandingSection id="benefits">
      <LandingSectionHeading
        eyebrow={t("benefits.eyebrow")}
        title={t("benefits.title")}
        description={t("benefits.description")}
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
        {BENEFITS.map((item) => {
          const Icon = item.icon;
          return (
            <li
              key={item.key}
              className={cn(
                "rounded-2xl border p-5 sm:p-6",
                item.emphasize
                  ? "border-[var(--landing-primary)]/20 bg-[var(--landing-surface)] shadow-[0_1px_0_rgba(28,20,18,0.04)]"
                  : "border-transparent bg-transparent sm:border-[var(--landing-border)] sm:bg-[var(--landing-surface)]/70",
              )}
            >
              <span
                className={cn(
                  "mb-4 inline-flex size-11 items-center justify-center rounded-xl",
                  item.emphasize
                    ? "bg-[var(--landing-primary)] text-[var(--landing-primary-fg)]"
                    : "bg-[var(--landing-primary)]/10 text-[var(--landing-primary)]",
                )}
              >
                <Icon className="size-5" aria-hidden />
              </span>
              <div className="space-y-2">
                <h3 className="flex flex-wrap items-center gap-2 text-lg font-semibold text-[var(--landing-ink)]">
                  {t(`benefits.items.${item.key}.title`)}
                  {item.soon ? (
                    <span className="rounded-md bg-[var(--landing-surface-soft)] px-2 py-0.5 text-xs font-medium text-[var(--landing-muted)] ring-1 ring-[var(--landing-border)]">
                      {tc("comingSoon")}
                    </span>
                  ) : null}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
                  {t(`benefits.items.${item.key}.body`)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </LandingSection>
  );
}
