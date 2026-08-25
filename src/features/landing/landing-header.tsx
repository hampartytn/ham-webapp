"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { LanguageSelector } from "@/components/shared/language-selector";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import type { AuthUserView } from "@/lib/api/types";
import { homePathForRole } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils";

type NavItem =
  | { key: string; href: string; hash: true; label: string }
  | { key: string; href: "/welfare"; hash: false; label: string };

type Props = {
  user?: AuthUserView | null;
};

export function LandingHeader({ user = null }: Props) {
  const t = useTranslations("landing");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links: NavItem[] = [
    { key: "roles", href: "#roles", hash: true, label: t("nav.roles") },
    { key: "how", href: "#how-it-works", hash: true, label: t("nav.how") },
    {
      key: "welfare",
      href: "/welfare",
      hash: false,
      label: t("nav.welfare"),
    },
  ];

  const dashboardHref = user ? homePathForRole(user.role) : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200",
        "border-b",
        scrolled
          ? "border-[var(--landing-border)]/90 bg-[color-mix(in_srgb,var(--landing-surface)_92%,transparent)] shadow-[0_8px_30px_rgba(28,20,18,0.06)] backdrop-blur-md"
          : "border-transparent bg-[color-mix(in_srgb,var(--landing-surface)_78%,transparent)] backdrop-blur-sm",
      )}
    >
      <div className="ham-landing__container grid h-16 grid-cols-[1fr_auto] items-center gap-3 md:h-[4.25rem] lg:grid-cols-[1fr_auto_1fr]">
        <BrandMark appName={tc("appName")} tagline={tc("tagline")} />

        <nav
          className="hidden items-center justify-center gap-1 lg:flex"
          aria-label={t("nav.label")}
        >
          {links.map((item) => (
            <DesktopNavLink
              key={item.key}
              item={item}
              active={!item.hash && pathname === item.href}
            />
          ))}
        </nav>

        <div className="flex items-center justify-end gap-1 sm:gap-2">
          <div className="hidden sm:block">
            <LanguageSelector appearance="landing" />
          </div>

          <div className="hidden items-center gap-1 md:flex">
            <AccountActions
              user={user}
              dashboardHref={dashboardHref}
              loginLabel={t("login")}
              ctaLabel={t("nav.goToApp")}
              registerLabel={t("ctaPrimary")}
            />
          </div>

          <Dialog.Root open={mobileOpen} onOpenChange={setMobileOpen}>
            <Dialog.Trigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 text-[var(--landing-ink)] hover:bg-[var(--landing-surface-soft)] lg:hidden"
                aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
              >
                {mobileOpen ? <X aria-hidden /> : <Menu aria-hidden />}
              </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--landing-ink)]/40" />
              <Dialog.Content
                className="fixed inset-y-0 end-0 z-50 flex w-[min(100%,22rem)] flex-col bg-[var(--landing-surface)] shadow-[0_16px_48px_rgba(28,20,18,0.18)] outline-none"
                aria-describedby={undefined}
              >
                <div className="flex items-center justify-between border-b border-[var(--landing-border)] px-5 py-4">
                  <Dialog.Title className="ham-landing__display text-lg font-semibold text-[var(--landing-ink)]">
                    {tc("appName")}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="min-h-11 min-w-11"
                      aria-label={t("nav.closeMenu")}
                    >
                      <X aria-hidden />
                    </Button>
                  </Dialog.Close>
                </div>

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
                  <nav
                    className="flex flex-col gap-1"
                    aria-label={t("nav.label")}
                  >
                    {links.map((item) =>
                      item.hash ? (
                        <Dialog.Close asChild key={item.key}>
                          <a
                            href={item.href}
                            className="rounded-xl px-3 py-3.5 text-base font-medium text-[var(--landing-ink)] hover:bg-[var(--landing-surface-soft)]"
                          >
                            {item.label}
                          </a>
                        </Dialog.Close>
                      ) : (
                        <Dialog.Close asChild key={item.key}>
                          <Link
                            href={item.href}
                            className={cn(
                              "rounded-xl px-3 py-3.5 text-base font-medium hover:bg-[var(--landing-surface-soft)]",
                              pathname === item.href
                                ? "bg-[var(--landing-primary)]/8 text-[var(--landing-primary)]"
                                : "text-[var(--landing-ink)]",
                            )}
                          >
                            {item.label}
                          </Link>
                        </Dialog.Close>
                      ),
                    )}
                  </nav>

                  <div className="space-y-2 border-t border-[var(--landing-border)] pt-5">
                    <p className="px-1 text-xs font-semibold tracking-wide text-[var(--landing-muted)] uppercase">
                      {t("footer.language")}
                    </p>
                    <LanguageSelector appearance="landing" />
                  </div>

                  <div className="mt-auto flex flex-col gap-2 border-t border-[var(--landing-border)] pt-5">
                    {user && dashboardHref ? (
                      <Dialog.Close asChild>
                        <Button
                          asChild
                          className="ham-landing__btn-primary h-12 justify-center"
                        >
                          <Link href={dashboardHref}>{t("nav.goToApp")}</Link>
                        </Button>
                      </Dialog.Close>
                    ) : (
                      <>
                        <Dialog.Close asChild>
                          <Button
                            asChild
                            variant="ghost"
                            className="h-12 justify-center text-[var(--landing-ink)]"
                          >
                            <Link href="/login">{t("login")}</Link>
                          </Button>
                        </Dialog.Close>
                        <Dialog.Close asChild>
                          <Button
                            asChild
                            className="ham-landing__btn-primary h-12 justify-center"
                          >
                            <Link href="/register">{t("ctaPrimary")}</Link>
                          </Button>
                        </Dialog.Close>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}

function BrandMark({ appName, tagline }: { appName: string; tagline: string }) {
  return (
    <Link
      href="/"
      className="group inline-flex min-w-0 items-center gap-2.5 text-[var(--landing-ink)]"
    >
      <span
        className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-[var(--landing-primary)] text-[0.8rem] font-bold tracking-tight text-[var(--landing-primary-fg)] shadow-[0_6px_16px_rgba(190,27,15,0.28)] transition-transform group-hover:scale-[1.03]"
        aria-hidden
      >
        H
      </span>
      <span className="ham-landing__display truncate text-xl font-semibold tracking-tight">
        {appName}
      </span>
      <span className="sr-only"> — {tagline}</span>
    </Link>
  );
}

function DesktopNavLink({
  item,
  active,
}: {
  item: NavItem;
  active: boolean;
}) {
  const className = cn(
    "relative rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
    "after:absolute after:inset-x-3 after:bottom-1 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-[var(--landing-primary)] after:transition-transform",
    "hover:text-[var(--landing-ink)] hover:after:scale-x-100",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-focus)] focus-visible:ring-offset-2",
    active
      ? "text-[var(--landing-ink)] after:scale-x-100"
      : "text-[var(--landing-muted)]",
  );

  if (item.hash) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} aria-current={active ? "page" : undefined}>
      {item.label}
    </Link>
  );
}

function AccountActions({
  user,
  dashboardHref,
  loginLabel,
  ctaLabel,
  registerLabel,
}: {
  user: AuthUserView | null;
  dashboardHref: string | null;
  loginLabel: string;
  ctaLabel: string;
  registerLabel: string;
}) {
  if (user && dashboardHref) {
    return (
      <Button asChild className="ham-landing__btn-primary h-10 px-4">
        <Link href={dashboardHref}>{ctaLabel}</Link>
      </Button>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--landing-ink)] transition-colors hover:bg-[var(--landing-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--landing-focus)] focus-visible:ring-offset-2"
      >
        {loginLabel}
      </Link>
      <Button asChild className="ham-landing__btn-primary h-10 px-4 shadow-[0_8px_18px_rgba(190,27,15,0.22)]">
        <Link href="/register">{registerLabel}</Link>
      </Button>
    </>
  );
}
