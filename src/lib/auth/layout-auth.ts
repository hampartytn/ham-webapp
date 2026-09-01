import { redirect } from "next/navigation";

import type { Role } from "@/lib/api/types";
import { hasSessionCookies, readRoleCookie } from "@/lib/auth/cookies";

/**
 * Cookie-only gate for role layouts. Does not call Nest, so the shell can paint
 * immediately. Nest still enforces JWT + account status on every API.
 */
export async function assertRoleLayoutAccess(
  locale: string,
  allowed: readonly Role[],
  homePath: string,
): Promise<void> {
  const signedIn = await hasSessionCookies();
  if (!signedIn) {
    redirect(`/${locale}/login?next=/${locale}${homePath}`);
  }

  const role = await readRoleCookie();
  if (role && !allowed.includes(role)) {
    redirect(`/${locale}/forbidden`);
  }
}
