import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function ForbiddenPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shell");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-lg space-y-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">{t("forbiddenTitle")}</h1>
        <p className="text-muted-foreground">{t("forbiddenBody")}</p>
        <Link href="/" className="underline">
          {t("home")}
        </Link>
      </main>
    </>
  );
}
