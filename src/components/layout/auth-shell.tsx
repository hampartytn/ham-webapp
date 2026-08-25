import type { ReactNode } from "react";
import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { LanguageSelector } from "@/components/shared/language-selector";
import { Link } from "@/i18n/navigation";
import { getServerSession } from "@/lib/auth/session";
import { homePathForRole } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";
import "@/styles/auth.css";

export type AuthHeaderMode = "default" | "register" | "login";

type HeaderProps = {
  mode?: AuthHeaderMode;
};

function AuthBackground({ designer }: { designer?: boolean }) {
  return (
    <div
      className={cn("ham-auth__bg", designer && "ham-auth__bg--designer")}
      aria-hidden
    >
      <Image
        src="/images/landing-hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className={cn(
          "ham-auth__bg-image",
          designer && "ham-auth__bg-image--designer",
        )}
        quality={75}
      />
      <div
        className={cn(
          "ham-auth__bg-scrim",
          designer && "ham-auth__bg-scrim--designer",
        )}
      />
      {!designer ? <div className="ham-auth__bg-vignette" /> : null}
    </div>
  );
}

/** Shared public chrome for auth / welfare pages. */
export async function PublicHeader({ mode = "default" }: HeaderProps) {
  const t = await getTranslations("landing");
  const tc = await getTranslations("common");
  const user = await getServerSession();
  const dashboardHref = user ? homePathForRole(user.role) : null;
  const designer = mode === "register" || mode === "login";

  if (!designer) {
    return (
      <header className="border-b border-border/80 bg-background/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3.5 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 text-lg font-semibold tracking-tight"
          >
            <span
              className="inline-flex size-9 items-center justify-center rounded-xl bg-primary text-xs font-bold text-primary-foreground"
              aria-hidden
            >
              H
            </span>
            {tc("appName")}
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            <LanguageSelector />
            {user && dashboardHref ? (
              <Link
                href={dashboardHref}
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
              >
                {t("nav.goToApp")}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {t("login")}
                </Link>
                <Link
                  href="/register"
                  className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="ham-auth__header ham-auth__header--designer">
      <div className="ham-auth__header-inner ham-auth__header-inner--designer">
        <Link href="/" className="ham-auth__brand ham-auth__brand--designer">
          <span
            className="ham-auth__brand-mark ham-auth__brand-mark--designer"
            aria-hidden
          >
            H
          </span>
          {tc("appName")}
        </Link>
        <div className="ham-auth__header-actions gap-3 sm:gap-4">
          <LanguageSelector appearance="auth" />
          {user && dashboardHref ? (
            <Link href={dashboardHref} className="ham-auth__header-cta-btn">
              {t("nav.goToApp")}
            </Link>
          ) : mode === "register" ? (
            <Link href="/login" className="ham-auth__header-cta-btn">
              {t("login")}
            </Link>
          ) : (
            <Link href="/register" className="ham-auth__header-cta-btn">
              {t("register")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

type LayoutProps = {
  children: ReactNode;
  mode?: AuthHeaderMode;
  className?: string;
  /** Wider surface for register role cards */
  wide?: boolean;
  /** Outside-card footer (designer auth layout) */
  footer?: ReactNode;
};

/**
 * Full-screen immersive authentication shell.
 * Background covers the entire viewport; the form is centered as an overlay.
 */
export async function AuthPageLayout({
  children,
  mode = "default",
  className,
  wide = false,
  footer,
}: LayoutProps) {
  const designer = mode === "register" || mode === "login";

  return (
    <div className={cn("ham-auth", designer && "ham-auth--designer")}>
      <AuthBackground designer={designer} />
      <PublicHeader mode={mode} />
      <main
        className={cn(
          "ham-auth__stage",
          designer && "ham-auth__stage--designer",
          className,
        )}
      >
        <div className="ham-auth__stack">
          <div
            className={cn(
              "ham-auth__surface",
              wide && "ham-auth__surface--wide",
              designer && "ham-auth__surface--designer",
            )}
          >
            {children}
          </div>
          {footer ? (
            <div className="ham-auth__card-footer">{footer}</div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

type IntroProps = {
  eyebrow?: string;
  title: string;
  support: string;
  notice?: string;
  /** Centered designer intro + optional blue info notice */
  align?: "start" | "center";
  noticeVariant?: "soft" | "info";
};

export function AuthFormIntro({
  eyebrow,
  title,
  support,
  notice,
  align = "start",
  noticeVariant = "soft",
}: IntroProps) {
  const centered = align === "center";

  return (
    <header className={cn("space-y-2.5", centered && "mb-6 space-y-0 text-center")}>
      {eyebrow ? (
        <p
          className={cn(
            "font-bold tracking-widest text-[#d32f2f] uppercase",
            centered
              ? "mb-1 text-xs"
              : "text-[0.7rem] tracking-[0.16em] text-[var(--auth-primary,#be1b0f)]",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "leading-tight font-bold tracking-tight text-[#1c1b1b]",
          centered
            ? "mb-2 text-2xl md:text-3xl"
            : "text-[1.7rem] font-semibold text-[var(--auth-ink,#1c1412)] sm:text-[1.85rem]",
        )}
      >
        {title}
      </h1>
      <p
        className={cn(
          "leading-relaxed text-[#534341]",
          centered
            ? "px-4 text-sm"
            : "text-[0.95rem] text-[var(--auth-muted,#5f534f)] sm:text-base",
        )}
      >
        {support}
      </p>
      {notice ? (
        noticeVariant === "info" ? (
          <div className="mt-6 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-left text-xs text-blue-800 md:text-sm">
            <InfoIcon />
            <div>{notice}</div>
          </div>
        ) : (
          <p className="mt-1 rounded-[var(--auth-radius-sm,0.85rem)] border border-[var(--auth-border,#e6ddd9)] bg-[var(--auth-surface-soft,#f4ebe7)] px-3.5 py-3 text-sm leading-relaxed text-[var(--auth-ink,#1c1412)]/90">
            {notice}
          </p>
        )
      ) : null}
    </header>
  );
}

function InfoIcon() {
  return (
    <svg
      className="mt-0.5 size-[18px] shrink-0 text-blue-600"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}
