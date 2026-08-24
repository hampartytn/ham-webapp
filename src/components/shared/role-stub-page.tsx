import { getTranslations, setRequestLocale } from "next-intl/server";

export async function RoleStubPage({
  params,
  titleKey,
}: {
  params: Promise<{ locale: string }>;
  titleKey: string;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("shell");
  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-semibold">
        {t(titleKey as "dashboard")}
      </h1>
      <p className="text-sm text-muted-foreground">{t("featuresLater")}</p>
    </div>
  );
}
