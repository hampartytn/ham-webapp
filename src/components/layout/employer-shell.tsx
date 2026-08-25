"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Bell,
  BriefcaseBusiness,
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  UserPlus,
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
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { bffJson, proxyPath } from "@/lib/api/bff-client";
import { cn } from "@/lib/utils";
import type { MeResponse } from "@/types/ham";
import "@/styles/employer.css";

type NavItem = {
  href: string;
  key: "dashboard" | "jobs" | "applicants" | "findWorkers" | "organization";
  icon: typeof LayoutDashboard;
};

const PRIMARY_NAV: NavItem[] = [
  { href: "/employer", key: "dashboard", icon: LayoutDashboard },
  { href: "/employer/jobs", key: "jobs", icon: BriefcaseBusiness },
  { href: "/employer/applicants", key: "applicants", icon: Users },
  { href: "/employer/workers", key: "findWorkers", icon: UserPlus },
  { href: "/employer/organization", key: "organization", icon: Building2 },
];

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [menuPath, setMenuPath] = useState(pathname);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuId = useId();

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => bffJson<MeResponse>(proxyPath("me")),
    staleTime: 60_000,
  });

  const employerName =
    meQ.data?.employerProfile?.fullName ||
    meQ.data?.employerProfile?.organizationName ||
    meQ.data?.phone ||
    "—";

  const hasAttentionHint = Boolean(
    !meQ.data?.employerProfile?.organizationId,
  );

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) {
      router.push("/employer/jobs");
      return;
    }
    if (q.includes("worker") || q.includes("find")) {
      router.push("/employer/workers");
      return;
    }
    if (q.includes("applicant") || q.includes("hire") || q.includes("queue")) {
      router.push("/employer/applicants");
      return;
    }
    if (q.includes("org") || q.includes("company") || q.includes("profile")) {
      router.push("/employer/organization");
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
    router.refresh();
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
        <Link
          href="/employer"
          className="ham-employer__logo"
          aria-label="HAM"
          onClick={() => setMobileOpen(false)}
        >
          H
        </Link>

        <nav className="ham-employer__rail-nav" aria-label={t("employerNav")}>
          {PRIMARY_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            const label =
              item.key === "findWorkers" ? t("findWorkers") : t(item.key);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={label}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "ham-employer__rail-item",
                  active && "ham-employer__rail-item--active",
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="size-[1.15rem]" strokeWidth={1.75} />
              </Link>
            );
          })}
        </nav>

        <div className="ham-employer__rail-foot">
          <Link
            href="/employer/settings"
            title={t("settings")}
            aria-label={t("settings")}
            aria-current={
              isActive(pathname, "/employer/settings") ? "page" : undefined
            }
            className={cn(
              "ham-employer__rail-item",
              isActive(pathname, "/employer/settings") &&
                "ham-employer__rail-item--active",
            )}
            onClick={() => setMobileOpen(false)}
          >
            <Settings className="size-[1.15rem]" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            className="ham-employer__rail-item"
            title={tc("logout")}
            aria-label={tc("logout")}
            disabled={loggingOut}
            onClick={() => void logout()}
          >
            <LogOut className="size-[1.15rem]" strokeWidth={1.75} />
          </button>
        </div>

        <button
          type="button"
          className="mt-2 inline-flex rounded-full p-2 text-[var(--emp-muted)] md:hidden"
          aria-label={t("closeMenu")}
          onClick={() => setMobileOpen(false)}
        >
          <X className="size-4" />
        </button>
      </aside>

      <div className="ham-employer__main-wrap">
        <header className="ham-employer__topbar">
          <button
            type="button"
            className="ham-employer__icon-btn md:hidden"
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            aria-label={t("openMenu")}
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <form className="ham-employer__search" onSubmit={onSearchSubmit}>
            <Search className="size-4 shrink-0" aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={te("searchPlaceholder")}
              aria-label={te("searchPlaceholder")}
            />
          </form>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="relative">
              <button
                type="button"
                className="ham-employer__icon-btn"
                aria-label={te("notifications")}
                aria-expanded={notifOpen}
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
              >
                <Bell className="size-[1.15rem]" strokeWidth={1.75} />
                {hasAttentionHint ? (
                  <span className="ham-employer__notif-dot" aria-hidden />
                ) : null}
              </button>
              {notifOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute end-0 z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--emp-border)] bg-white py-2 shadow-lg"
                  role="dialog"
                  aria-label={te("notifications")}
                >
                  <p className="px-3.5 py-2 text-sm font-semibold">
                    {te("notifications")}
                  </p>
                  <p className="px-3.5 pb-3 text-xs text-[var(--emp-muted)]">
                    {te("notificationsEmpty")}
                  </p>
                  {!meQ.data?.employerProfile?.organizationId ? (
                    <Link
                      href="/employer/organization"
                      className="block px-3.5 py-2 text-sm text-primary hover:bg-[var(--emp-soft)]"
                      onClick={() => setNotifOpen(false)}
                    >
                      {te("completeProfile")}
                    </Link>
                  ) : null}
                </motion.div>
              ) : null}
            </div>

            <LanguageSelector appearance="default" />

            <div className="relative">
              <button
                type="button"
                className="ham-employer__profile-chip"
                aria-expanded={profileOpen}
                aria-haspopup="menu"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
              >
                <span className="ham-employer__avatar-lg" aria-hidden>
                  {(employerName || "E").slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden min-w-0 pe-1 text-start sm:block">
                  <span className="block truncate text-sm font-semibold">
                    {employerName}
                  </span>
                  <span className="block truncate text-[0.7rem] text-[var(--emp-muted)]">
                    {te("employerRole")}
                  </span>
                </span>
              </button>
              {profileOpen ? (
                <div
                  role="menu"
                  className="absolute end-0 z-30 mt-2 w-52 overflow-hidden rounded-2xl border border-[var(--emp-border)] bg-white py-1 shadow-lg"
                >
                  <Link
                    role="menuitem"
                    href="/employer/organization"
                    className="block px-3.5 py-2.5 text-sm hover:bg-[var(--emp-soft)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    {te("orgTitle")}
                  </Link>
                  <Link
                    role="menuitem"
                    href="/employer/settings"
                    className="block px-3.5 py-2.5 text-sm hover:bg-[var(--emp-soft)]"
                    onClick={() => setProfileOpen(false)}
                  >
                    {t("settings")}
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    className="block w-full px-3.5 py-2.5 text-start text-sm hover:bg-[var(--emp-soft)]"
                    disabled={loggingOut}
                    onClick={() => void logout()}
                  >
                    {tc("logout")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="flex-1 px-1 pt-5 sm:px-2 md:pt-6">{children}</main>
      </div>
    </div>
  );
}
