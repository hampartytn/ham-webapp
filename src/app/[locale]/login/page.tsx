import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { LoginForm } from "@/features/auth/components/login-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-6 py-12">
        <h1 className="text-2xl font-semibold">{t("loginTitle")}</h1>
        <p className="text-sm font-medium">{t("loginPassword")}</p>
        <LoginForm nextPath={next} />
      </main>
    </>
  );
}
