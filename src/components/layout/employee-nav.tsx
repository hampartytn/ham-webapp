"use client";

import { useTranslations } from "next-intl";

import { LanguagePicker } from "@/components/shared/language-picker";
import { LogoutButton } from "@/components/shared/logout-button";
import { RoleNavLink } from "@/components/navigation/role-nav-link";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useWarmRoleRoutes } from "@/lib/query/use-warm-role-routes";

const ITEMS = [
  { href: "/employee", key: "dashboard" as const },
  { href: "/employee/profile", key: "profile" as const },
  { href: "/employee/jobs", key: "jobs" as const },
  { href: "/employee/applications", key: "applications" as const },
  { href: "/employee/legal", key: "legal" as const },
  { href: "/employee/verification", key: "verification" as const },
  { href: "/employee/membership", key: "membership" as const },
  { href: "/employee/settings", key: "settings" as const },
];

const EMPLOYEE_WARM_ROUTES = ITEMS.map((i) => i.href);

export function EmployeeNav() {
  const t = useTranslations("shell");
  const pathname = usePathname();
  useWarmRoleRoutes(EMPLOYEE_WARM_ROUTES);

  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/employee" className="text-lg font-semibold">
          HAM
        </Link>
        <div className="flex items-center gap-2">
          <LanguagePicker compact />
          <LogoutButton />
        </div>
      </div>
      <nav
        className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-2"
        aria-label="Employee"
      >
        {ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/employee" && pathname.startsWith(item.href));
          return (
            <RoleNavLink
              key={item.href}
              href={item.href}
              className={cn(
                "whitespace-nowrap rounded-md px-3 py-3 text-base font-medium",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {t(item.key)}
            </RoleNavLink>
          );
        })}
      </nav>
    </div>
  );
}
