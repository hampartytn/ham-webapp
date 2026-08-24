import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { LanguagePicker } from "@/components/shared/language-picker";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function LanguagePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-lg space-y-6 px-6 py-16">
        <h1 className="text-2xl font-semibold">{t("chooseLanguage")}</h1>
        <LanguagePicker />
        <Link href="/" className="text-sm underline">
          {t("title")}
        </Link>
      </main>
    </>
  );
}
