import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { Link } from "@/i18n/navigation";
import { LanguagePicker } from "@/components/shared/language-picker";

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-lg text-muted-foreground">{t("subtitle")}</p>
          <p className="text-sm text-muted-foreground">{tc("tagline")}</p>
        </div>
        <LanguagePicker />
        <div className="flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            {t("register")}
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center rounded-md border border-input px-5 text-sm font-medium"
          >
            {t("login")}
          </Link>
          <Link
            href="/welfare"
            className="inline-flex h-11 items-center rounded-md px-5 text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("welfare")}
          </Link>
        </div>
      </main>
    </>
  );
}
