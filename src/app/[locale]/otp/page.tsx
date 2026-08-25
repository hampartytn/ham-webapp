import { getTranslations, setRequestLocale } from "next-intl/server";

import {
  AuthFormIntro,
  AuthPageLayout,
  type AuthHeaderMode,
} from "@/components/layout/auth-shell";
import { OtpForm } from "@/features/auth/components/otp-form";
import { Link } from "@/i18n/navigation";
import type { OtpPurpose } from "@/lib/api/types";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    phone?: string;
    purpose?: string;
    expiresIn?: string;
    next?: string;
  }>;
};

function authModeForPurpose(purpose: OtpPurpose): AuthHeaderMode {
  return purpose === "REGISTER" ? "register" : "login";
}

export default async function OtpPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const phone = sp.phone ?? "";
  const purpose = (sp.purpose ?? "REGISTER") as OtpPurpose;
  const expiresIn = Number(sp.expiresIn ?? "300") || 300;
  const mode = authModeForPurpose(purpose);

  return (
    <AuthPageLayout
      mode={mode}
      footer={
        mode === "register" ? (
          <p>
            {t("alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              className="font-bold underline transition-colors hover:text-white/80"
            >
              {t("loginTitle")}
            </Link>
          </p>
        ) : (
          <p>
            {t("needAccount")}{" "}
            <Link
              href="/register"
              className="font-bold underline transition-colors hover:text-white/80"
            >
              {t("createAccountLink")}
            </Link>
          </p>
        )
      }
    >
      <AuthFormIntro
        align="center"
        eyebrow={t("otpEyebrow")}
        title={t("otpTitle")}
        support={t("otpSupport")}
      />
      {phone ? (
        <OtpForm
          phone={phone}
          purpose={purpose}
          initialExpiresIn={expiresIn}
          nextPath={sp.next}
        />
      ) : (
        <p className="text-center text-sm text-[#534341]">{t("otpHint")}</p>
      )}
    </AuthPageLayout>
  );
}
