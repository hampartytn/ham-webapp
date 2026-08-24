import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { LoginOtpRequestForm } from "@/features/auth/components/login-otp-request-form";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginOtpPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { next } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-6 py-12">
        <h1 className="text-2xl font-semibold">{t("loginOtp")}</h1>
        <LoginOtpRequestForm nextPath={next} />
      </main>
    </>
  );
}
