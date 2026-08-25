import { getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function LandingHero() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <section
      aria-labelledby="landing-hero-heading"
      className="relative isolate min-h-[min(88vh,48rem)] overflow-hidden"
    >
      {/* Decorative full-bleed art — SVG kept as <img> (CSP img-src 'self') */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/landing-hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-center"
        decoding="async"
        fetchPriority="high"
      />
      <div
        className="absolute inset-0 bg-[image:var(--landing-hero-scrim)]"
        aria-hidden
      />

      <div className="ham-landing__container relative flex min-h-[min(88vh,48rem)] flex-col justify-end pb-14 pt-24 sm:justify-center sm:pb-20 sm:pt-28">
        <div className="max-w-xl space-y-6 text-white">
          <p className="ham-landing__reveal text-sm font-semibold tracking-[0.2em] uppercase text-white/90">
            <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--landing-primary)] align-middle" />
            {tc("appName")}
          </p>
          <h1
            id="landing-hero-heading"
            className="ham-landing__display ham-landing__reveal ham-landing__reveal--delay-1 text-[2.35rem] font-semibold leading-[1.12] sm:text-5xl lg:text-[3.5rem]"
          >
            {t("hero.headline")}
          </h1>
          <p className="ham-landing__reveal ham-landing__reveal--delay-2 max-w-lg text-lg leading-relaxed text-white/88 sm:text-xl">
            {t("hero.support")}
          </p>
          <div className="ham-landing__reveal ham-landing__reveal--delay-3 flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
            <Button
              asChild
              size="lg"
              className="ham-landing__btn-primary h-12 min-w-[10.5rem] px-7 text-base font-semibold shadow-[0_10px_24px_rgba(190,27,15,0.28)]"
            >
              <Link href="/register">{t("ctaPrimary")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/45 bg-transparent px-7 text-base font-medium text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/login">{t("ctaSecondary")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
