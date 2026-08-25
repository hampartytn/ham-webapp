import { getTranslations } from "next-intl/server";

import { LandingSection, LandingSectionHeading } from "./section";

export async function LandingHowItWorks() {
  const t = await getTranslations("landing");
  const steps = ["one", "two", "three"] as const;

  return (
    <LandingSection id="how-it-works" tone="surface">
      <LandingSectionHeading
        eyebrow={t("how.eyebrow")}
        title={t("how.title")}
        description={t("how.description")}
      />
      <ol className="relative grid gap-8 md:grid-cols-3 md:gap-6">
        <div
          className="pointer-events-none absolute top-7 right-8 left-8 hidden h-px bg-[var(--landing-border)] md:block"
          aria-hidden
        />
        {steps.map((step, index) => (
          <li key={step} className="relative space-y-3 md:pr-4">
            <p className="relative z-[1] inline-flex size-14 items-center justify-center rounded-full bg-[var(--landing-primary)] text-lg font-semibold text-[var(--landing-primary-fg)] shadow-[0_8px_18px_rgba(190,27,15,0.22)]">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="text-xl font-semibold text-[var(--landing-ink)]">
              {t(`how.steps.${step}.title`)}
            </h3>
            <p className="leading-relaxed text-[var(--landing-muted)]">
              {t(`how.steps.${step}.body`)}
            </p>
          </li>
        ))}
      </ol>
    </LandingSection>
  );
}
