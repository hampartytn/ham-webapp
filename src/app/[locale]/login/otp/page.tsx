import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  AuthFormIntro,
  AuthPageLayout,
} from "@/components/layout/auth-shell";
import { LoginOtpRequestForm } from "@/features/auth/components/login-otp-request-form";
import { Link } from "@/i18n/navigation";

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
    <AuthPageLayout
      mode="login"
      footer={
        <p>
          {t("needAccount")}{" "}
          <Link
            href="/register"
            className="font-bold underline transition-colors hover:text-white/80"
          >
            {t("createAccountLink")}
          </Link>
        </p>
      }
    >
      <AuthFormIntro
        align="center"
        eyebrow={t("loginEyebrow")}
        title={t("loginOtp")}
        support={t("otpLoginSupport")}
      />
      <LoginOtpRequestForm nextPath={next} />
    </AuthPageLayout>
  );
}
