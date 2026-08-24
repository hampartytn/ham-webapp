import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { PasswordResetFlow } from "@/features/auth/components/password-reset-flow";

type Props = { params: Promise<{ locale: string }> };

export default async function PasswordResetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-6 py-12">
        <h1 className="text-2xl font-semibold">{t("resetPasswordTitle")}</h1>
        <PasswordResetFlow />
      </main>
    </>
  );
}
