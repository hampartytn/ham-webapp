import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";

import { PasswordSetForm } from "@/features/auth/components/password-set-form";
import { getServerSession } from "@/lib/auth/session";

type Props = { params: Promise<{ locale: string }> };

export default async function PasswordSetPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await getServerSession();
  if (!session) {
    redirect(`/${locale}/login?next=/${locale}/password/set`);
  }
  const t = await getTranslations("auth");

  return (
    <main className="mx-auto w-full max-w-md space-y-6 px-6 py-12">
      <h1 className="text-2xl font-semibold">{t("setPasswordTitle")}</h1>
      <PasswordSetForm />
    </main>
  );
}
