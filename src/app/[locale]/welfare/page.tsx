import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";

type Props = { params: Promise<{ locale: string }> };

export default async function WelfareComingSoonPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("comingSoon");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-lg space-y-4 px-6 py-16">
        <h1 className="text-2xl font-semibold">{t("welfareTitle")}</h1>
        <p className="text-muted-foreground">{t("welfareBody")}</p>
      </main>
    </>
  );
}
