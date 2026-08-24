import { Link } from "@/i18n/navigation";
import { LanguagePicker } from "@/components/shared/language-picker";
import { getTranslations } from "next-intl/server";

export async function PublicHeader() {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          {tc("appName")}
        </Link>
        <nav className="flex flex-wrap items-center gap-3">
          <LanguagePicker compact />
          <Link
            href="/login"
            className="text-sm font-medium underline-offset-4 hover:underline"
          >
            {t("login")}
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            {t("register")}
          </Link>
        </nav>
      </div>
    </header>
  );
}
