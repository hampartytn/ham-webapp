import { getTranslations, setRequestLocale } from "next-intl/server";

import { PublicHeader } from "@/components/layout/public-header";
import { OtpForm } from "@/features/auth/components/otp-form";
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

export default async function OtpPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("auth");

  const phone = sp.phone ?? "";
  const purpose = (sp.purpose ?? "REGISTER") as OtpPurpose;
  const expiresIn = Number(sp.expiresIn ?? "300") || 300;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto w-full max-w-md space-y-6 px-6 py-12">
        <h1 className="text-2xl font-semibold">{t("otpTitle")}</h1>
        {phone ? (
          <OtpForm
            phone={phone}
            purpose={purpose}
            initialExpiresIn={expiresIn}
            nextPath={sp.next}
          />
        ) : (
          <p className="text-sm text-muted-foreground">{t("otpHint")}</p>
        )}
      </main>
    </>
  );
}
