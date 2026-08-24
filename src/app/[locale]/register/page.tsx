import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { RegisterForm } from "@/features/auth/components/register-form";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-6 py-12">
        <h1 className="text-2xl font-semibold">{t("registerTitle")}</h1>
        <RegisterForm />
        <p className="text-sm">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="underline">
            {t("loginTitle")}
          </Link>
        </p>
      </main>
    </>
  );
}
