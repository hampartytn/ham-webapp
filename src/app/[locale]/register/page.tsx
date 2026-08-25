import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  AuthFormIntro,
  AuthPageLayout,
} from "@/components/layout/auth-shell";
import { RegisterForm } from "@/features/auth/components/register-form";
import { Link } from "@/i18n/navigation";

type Props = { params: Promise<{ locale: string }> };

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  return (
    <AuthPageLayout
      mode="register"
      footer={
        <p>
          {t("alreadyHaveAccount")}{" "}
          <Link
            href="/login"
            className="font-bold underline transition-colors hover:text-white/80"
          >
            {t("loginTitle")}
          </Link>
        </p>
      }
    >
      <AuthFormIntro
        align="center"
        noticeVariant="info"
        eyebrow={t("registerEyebrow")}
        title={t("registerTitle")}
        support={t("registerSupportShort")}
        notice={t("registerHint")}
      />
      <RegisterForm />
    </AuthPageLayout>
  );
}
