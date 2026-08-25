import { getTranslations } from "next-intl/server";

import { LanguagePicker } from "@/components/shared/language-picker";
import { Link } from "@/i18n/navigation";

export async function LandingFooter() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--landing-border)] bg-[var(--landing-surface)]">
      <div className="ham-landing__container grid gap-10 py-12 md:grid-cols-[1.2fr_1fr_1fr]">
        <div className="space-y-3">
          <p className="ham-landing__display text-xl font-semibold text-[var(--landing-ink)]">
            {tc("appName")}
          </p>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--landing-muted)]">
            {tc("tagline")}
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--landing-ink)]">
            {t("footer.explore")}
          </p>
          <ul className="space-y-2 text-sm text-[var(--landing-muted)]">
            <li>
              <Link href="/register" className="hover:text-[var(--landing-ink)]">
                {t("register")}
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-[var(--landing-ink)]">
                {t("login")}
              </Link>
            </li>
            <li>
              <Link href="/welfare" className="hover:text-[var(--landing-ink)]">
                {t("welfare")}
              </Link>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-[var(--landing-ink)]">
                {t("nav.how")}
              </a>
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[var(--landing-ink)]">
            {t("footer.language")}
          </p>
          <LanguagePicker appearance="landing" />
        </div>
      </div>

      <div className="border-t border-[var(--landing-border)]">
        <div className="ham-landing__container flex flex-col gap-2 py-5 text-sm text-[var(--landing-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {tc("appName")}. {t("footer.rights")}
          </p>
          <p>{t("footer.note")}</p>
        </div>
      </div>
    </footer>
  );
}
