"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  CircleHelp,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

import { LanguageSelector } from "@/components/shared/language-selector";
import { RoleNavLink } from "@/components/navigation/role-nav-link";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { cn } from "@/lib/utils";
import { ME_QUERY_KEY, ME_STALE_MS } from "@/lib/query/session-cache";
import { usePrefetchCatalogs } from "@/lib/query/use-prefetch-catalogs";
import { useWarmRoleRoutes } from "@/lib/query/use-warm-role-routes";
import type { MeResponse } from "@/types/ham";
import { dashboardDisplayName, workerInitials } from "@/features/employer/dashboard-utils";
import "@/styles/employer.css";

type NavItem = {
  href: string;
  key:
    | "dashboard"
    | "jobs"
    | "applicants"
    | "employees"
    | "messages"
    | "notifications"
    | "organization"
    | "membership"
    | "settings";
  icon: typeof LayoutDashboard;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/employer", key: "dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", key: "jobs", icon: BriefcaseBusiness },
  { href: "/employer/applicants", key: "applicants", icon: Users },
  { href: "/employer/workers", key: "employees", icon: Users },
  { href: "/employer/messages", key: "messages", icon: MessageSquare },
  { href: "/employer/notifications", key: "notifications", icon: Bell },
];

const SECONDARY_NAV: NavItem[] = [
  { href: "/employer/organization", key: "organization", icon: Building2 },
  { href: "/employer/membership", key: "membership", icon: CreditCard },
  { href: "/employer/settings", key: "settings", icon: Settings },
];

const EMPLOYER_WARM_ROUTES = [
  ...PRIMARY_NAV.map((i) => i.href),
  ...SECONDARY_NAV.map((i) => i.href),
  "/employer/help",
  "/employer/support",
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/employer") return pathname === "/employer";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmployerShell({ children }: { children: ReactNode }) {
  const t = useTranslations("shell");
  const te = useTranslations("employer");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  usePrefetchCatalogs();
  useWarmRoleRoutes(EMPLOYER_WARM_ROUTES);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuPath, setMenuPath] = useState(pathname);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuId = useId();

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
    setProfileOpen(false);
  }

  const chromeLess =
    pathname === "/employer/welcome" || pathname === "/employer/onboarding";

  const meQ = useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: ME_STALE_MS,
  });

  const display = meQ.data
    ? dashboardDisplayName(meQ.data)
    : { welcomeName: te("employerRole"), companyLine: null };
  const initials = workerInitials(
    meQ.data?.employerProfile?.fullName ?? display.welcomeName,
  );

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    if (q.includes("applicant") || q.includes("hire") || q.includes("apply")) {
      router.push("/employer/applicants");
      return;
    }
    if (q.includes("org") || q.includes("company") || q.includes("profile")) {
      router.push("/employer/organization");
      return;
    }
    if (q.includes("worker") || q.includes("employee")) {
      router.push("/employer/workers");
      return;
    }
    router.push("/employer/jobs");
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await bffJson("/api/auth/logout", { method: "POST", body: "{}" });
    } catch {
      /* clear UX anyway */
    }
    queryClient.clear();
    router.replace("/login");
  }

  function NavLink({ item }: { item: NavItem }) {
    const active = isActive(pathname, item.href);
    const Icon = item.icon;
    const label =
      item.key === "employees"
        ? te("navEmployees")
        : item.key === "messages"
          ? te("navMessages")
          : item.key === "notifications"
            ? te("notifications")
            : item.key === "membership"
              ? te("navMembership")
              : item.key === "organization"
                ? te("orgTitle")
                : item.key === "applicants"
                  ? te("navApplications")
                  : t(item.key === "settings" ? "settings" : item.key);
    return (
      <RoleNavLink
        href={item.href}
        className={cn(
          "ham-employer__nav-item",
          active && "ham-employer__nav-item--active",
        )}
        aria-current={active ? "page" : undefined}
        onClick={() => setMobileOpen(false)}
      >
        <Icon className="size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        <span>{label}</span>
      </RoleNavLink>
    );
  }

  if (chromeLess) {
    return (
      <div className="ham-employer relative min-h-dvh">
        <div className="absolute end-4 top-4 z-10">
          <LanguageSelector appearance="default" />
        </div>
        <div className="mx-auto max-w-lg px-4 py-10">{children}</div>
      </div>
    );
  }

  return (
    <div className="ham-employer">
      {mobileOpen ? (
        <button
          type="button"
          className="ham-employer__backdrop md:hidden"
          aria-label={t("closeMenu")}
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      <aside
        id={menuId}
        className={cn(
          "ham-employer__sidebar",
          !mobileOpen && "ham-employer__sidebar--mobile-closed",
        )}
      >
        <Link href="/employer" className="ham-employer__brand" onClick={() => setMobileOpen(false)}>
          <span className="ham-employer__brand-mark" aria-hidden>
            <Building2 className="size-5" />
          </span>
          <span>
            <span className="ham-employer__brand-name block">{te("brandName")}</span>
            <span className="ham-employer__brand-sub block">{te("brandSubtitle")}</span>
          </span>
        </Link>

        <nav className="ham-employer__nav" aria-label={t("employerNav")}>
          {PRIMARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
          <div className="ham-employer__nav-split" />
          {SECONDARY_NAV.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        <div className="ham-employer__nav-foot">
          <RoleNavLink
            href="/employer/help"
            className="ham-employer__nav-item"
            onClick={() => setMobileOpen(false)}
          >
            <CircleHelp className="size-5 shrink-0" aria-hidden />
            <span>{te("navHelp")}</span>
          </RoleNavLink>
          <RoleNavLink
            href="/employer/support"
            className="ham-employer__nav-item"
            onClick={() => setMobileOpen(false)}
          >
            <LifeBuoy className="size-5 shrink-0" aria-hidden />
            <span>{te("navSupport")}</span>
          </RoleNavLink>
          <button
            type="button"
            className="ham-employer__nav-item ham-employer__nav-item--danger"
            disabled={loggingOut}
            onClick={() => void logout()}
          >
            <LogOut className="size-5 shrink-0" aria-hidden />
            <span>{tc("logout")}</span>
          </button>
        </div>
      </aside>

      <header className="ham-employer__header">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-[var(--emp-muted)] hover:bg-[var(--emp-soft)] md:hidden"
            aria-label={mobileOpen ? t("closeMenu") : t("openMenu")}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <form className="ham-employer__search hidden md:block" onSubmit={submitSearch}>
            <Search className="ham-employer__search-icon size-4" aria-hidden />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={te("searchPlaceholder")}
              aria-label={te("searchPlaceholder")}
            />
          </form>
        </div>
        <div className="flex items-center gap-3 sm:gap-5">
          <LanguageSelector appearance="default" />
          <Link
            href="/employer/notifications"
            className="relative rounded-full p-2 text-[var(--emp-muted)] transition-colors hover:bg-[var(--emp-soft)] hover:text-[var(--emp-primary)]"
            aria-label={te("notifications")}
          >
            <Bell className="size-5" />
          </Link>
          <Link
            href="/employer/help"
            className="hidden rounded-full p-2 text-[var(--emp-muted)] transition-colors hover:bg-[var(--emp-soft)] hover:text-[var(--emp-primary)] sm:inline-flex"
            aria-label={te("navHelp")}
          >
            <CircleHelp className="size-5" />
          </Link>
          <span className="hidden h-8 w-px bg-[var(--emp-border)] sm:block" aria-hidden />
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((v) => !v)}
            >
              <span className="flex size-8 items-center justify-center rounded-full border border-[var(--emp-border)] bg-[var(--emp-primary-light)] text-xs font-semibold text-[var(--emp-primary-dark)]">
                {initials}
              </span>
            </button>
            {profileOpen ? (
              <div className="absolute end-0 z-30 mt-2 w-52 rounded-xl border border-[var(--emp-border)] bg-white py-1 shadow-[0_10px_15px_-3px_rgba(15,23,42,0.1)]">
                <p className="truncate px-3 py-2 text-sm font-medium">{display.welcomeName}</p>
                <Link
                  href="/employer/settings"
                  className="block px-3 py-2 text-sm hover:bg-[var(--emp-soft)]"
                  onClick={() => setProfileOpen(false)}
                >
                  {t("settings")}
                </Link>
                <button
                  type="button"
                  className="block w-full px-3 py-2 text-left text-sm text-[var(--emp-error)] hover:bg-[var(--emp-soft)]"
                  onClick={() => void logout()}
                >
                  {tc("logout")}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <div className="ham-employer__main">
        <div className="ham-employer__canvas">{children}</div>
      </div>
    </div>
  );
}
