import { BriefcaseBusiness, Building2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { LandingSection, LandingSectionHeading } from "./section";

export async function LandingRolePaths() {
  const t = await getTranslations("landing");

  const roles = [
    {
      key: "worker",
      icon: BriefcaseBusiness,
      href: "/register" as const,
      points: ["point1", "point2", "point3"] as const,
    },
    {
      key: "employer",
      icon: Building2,
      href: "/register" as const,
      points: ["point1", "point2", "point3"] as const,
    },
  ] as const;

  return (
    <LandingSection id="roles" tone="surface">
      <LandingSectionHeading
        eyebrow={t("roles.eyebrow")}
        title={t("roles.title")}
        description={t("roles.description")}
      />
      <div className="grid gap-5 md:grid-cols-2 md:gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <article
              key={role.key}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-[var(--landing-border)] bg-[var(--landing-surface)] p-6 shadow-[0_1px_0_rgba(28,20,18,0.04)] transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[var(--landing-primary)]/35 hover:shadow-[0_12px_28px_rgba(28,20,18,0.08)] sm:p-8"
            >
              <span
                className="absolute inset-y-0 left-0 w-1 bg-[var(--landing-primary)]"
                aria-hidden
              />
              <div className="flex items-start gap-4 pl-1">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-primary)]/10 text-[var(--landing-primary)]">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-[var(--landing-ink)]">
                    {t(`roles.${role.key}.title`)}
                  </h3>
                  <p className="leading-relaxed text-[var(--landing-muted)]">
                    {t(`roles.${role.key}.body`)}
                  </p>
                </div>
              </div>
              <ul className="space-y-2.5 pl-1 text-sm text-[var(--landing-ink)] sm:text-base">
                {role.points.map((point) => (
                  <li key={point} className="flex gap-2.5">
                    <span
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--landing-primary)]"
                      aria-hidden
                    />
                    <span>{t(`roles.${role.key}.${point}`)}</span>
                  </li>
                ))}
              </ul>
              <Button
                asChild
                className="ham-landing__btn-primary mt-auto h-11 w-full sm:w-auto"
              >
                <Link href={role.href}>{t(`roles.${role.key}.cta`)}</Link>
              </Button>
            </article>
          );
        })}
      </div>
    </LandingSection>
  );
}
