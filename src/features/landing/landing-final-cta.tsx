import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { LandingSection } from "./section";

export async function LandingFinalCta() {
  const t = await getTranslations("landing");

  return (
    <LandingSection tone="ink" className="!py-16 sm:!py-20">
      <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 text-left sm:items-center sm:text-center">
        <h2 className="ham-landing__display text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("finalCta.title")}
        </h2>
        <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
          {t("finalCta.body")}
        </p>
        <Button
          asChild
          size="lg"
          className="ham-landing__btn-primary h-12 px-8 text-base font-semibold shadow-[0_10px_24px_rgba(190,27,15,0.35)]"
        >
          <Link href="/register">{t("finalCta.action")}</Link>
        </Button>
      </div>
    </LandingSection>
  );
}
