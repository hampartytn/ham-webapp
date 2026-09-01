import type { Role } from "@/lib/api/types";

const ROLES: readonly Role[] = [
  "EMPLOYEE",
  "EMPLOYER",
  "ADMIN",
  "SUPER_ADMIN",
];

export function parseHamRole(value: string | undefined): Role | undefined {
  if (!value) return undefined;
  return ROLES.includes(value as Role) ? (value as Role) : undefined;
}

/** next-intl pathname has no locale prefix. */
export function isRoleAppPath(pathname: string): boolean {
  return (
    pathname === "/employee" ||
    pathname.startsWith("/employee/") ||
    pathname === "/employer" ||
    pathname.startsWith("/employer/") ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}
