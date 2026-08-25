import { getTranslations } from "next-intl/server";

import { LandingSection, LandingSectionHeading } from "./section";

export async function LandingTrust() {
  const t = await getTranslations("landing");
  const items = ["privacy", "clarity", "languages"] as const;

  return (
    <LandingSection id="trust">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-end">
        <LandingSectionHeading
          eyebrow={t("trust.eyebrow")}
          title={t("trust.title")}
          description={t("trust.description")}
        />
        <ul className="space-y-5 border-t border-[var(--landing-border)] pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          {items.map((item) => (
            <li key={item} className="space-y-1">
              <h3 className="text-base font-semibold text-[var(--landing-ink)]">
                {t(`trust.items.${item}.title`)}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
                {t(`trust.items.${item}.body`)}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </LandingSection>
  );
}
