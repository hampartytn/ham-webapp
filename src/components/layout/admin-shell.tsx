"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import { LanguagePicker } from "@/components/shared/language-picker";
import { LogoutButton } from "@/components/shared/logout-button";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { prefetchRoleHref } from "@/lib/query/nav-prefetch";
import { usePrefetchCatalogs } from "@/lib/query/use-prefetch-catalogs";
import { useQueryClient } from "@tanstack/react-query";

const ITEMS = [
  { href: "/admin", key: "dashboard" as const },
  { href: "/admin/users", key: "users" as const },
  { href: "/admin/jobs", key: "jobs" as const },
  { href: "/admin/legal", key: "legal" as const },
  { href: "/admin/metrics", key: "metrics" as const },
  { href: "/admin/audit", key: "audit" as const },
  { href: "/admin/admins", key: "admins" as const },
];

/**
 * Admin nav is UX-only. Nest remains authoritative.
 * Progressive disclosure via /admin/permissions/check is planned for W8;
 * SUPER_ADMIN / ADMIN both see the full stub menu here.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const queryClient = useQueryClient();
  usePrefetchCatalogs();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="w-full shrink-0 border-b border-border bg-muted/30 p-4 md:w-56 md:border-b-0 md:border-r">
        <Link href="/admin" className="mb-4 block text-lg font-semibold">
          HAM Admin
        </Link>
        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col" aria-label="Admin">
          {ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
                onMouseEnter={() => prefetchRoleHref(queryClient, item.href)}
              >
                {t(item.key)}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <LanguagePicker compact />
          <LogoutButton />
        </div>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
