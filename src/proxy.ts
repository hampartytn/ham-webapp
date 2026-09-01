import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import { nestFetchData } from "@/lib/api/nest-client";
import type { AuthTokenPair } from "@/lib/api/types";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  authCookieHeaders,
  clearAuthCookieHeaders,
} from "@/lib/auth/cookies";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const ROLE_PREFIXES = [
  { prefix: "/employee", roles: ["EMPLOYEE"] },
  { prefix: "/employer", roles: ["EMPLOYER"] },
  { prefix: "/admin", roles: ["ADMIN", "SUPER_ADMIN"] },
] as const;

export default async function proxy(request: NextRequest) {
  const refreshResponse = await maybeRefreshCookies(request);
  const response = intlMiddleware(request);

  if (refreshResponse) {
    for (const cookie of refreshResponse.cookies.getAll()) {
      response.cookies.set(cookie);
    }
    // Also forward raw Set-Cookie from Nest refresh helper if used
    const setCookies = refreshResponse.headers.getSetCookie?.() ?? [];
    for (const header of setCookies) {
      response.headers.append("Set-Cookie", header);
    }
  }

  const { pathname } = request.nextUrl;
  const locale = extractLocale(pathname);
  if (!locale) return response;

  const pathWithoutLocale = stripLocale(pathname, locale);
  const hasSessionCookie = Boolean(
    request.cookies.get(ACCESS_COOKIE)?.value ||
      request.cookies.get(REFRESH_COOKIE)?.value ||
      refreshResponse?.cookies.get(ACCESS_COOKIE)?.value,
  );

  const roleRule = ROLE_PREFIXES.find(
    (r) =>
      pathWithoutLocale === r.prefix ||
      pathWithoutLocale.startsWith(`${r.prefix}/`),
  );

  if (roleRule && !hasSessionCookie) {
    const login = new URL(`/${locale}/login`, request.url);
    login.searchParams.set(
      "next",
      safeRedirectPath(pathname, `/${locale}${roleRule.prefix}`),
    );
    const redirect = NextResponse.redirect(login);
    if (refreshResponse) {
      for (const cookie of refreshResponse.cookies.getAll()) {
        redirect.cookies.set(cookie);
      }
    }
    return redirect;
  }

  return response;
}

function extractLocale(pathname: string): string | null {
  const seg = pathname.split("/").filter(Boolean)[0];
  if (seg && (routing.locales as readonly string[]).includes(seg)) return seg;
  return null;
}

function stripLocale(pathname: string, locale: string): string {
  const rest = pathname.slice(locale.length + 1) || "/";
  return rest.startsWith("/") ? rest : `/${rest}`;
}

async function maybeRefreshCookies(
  request: NextRequest,
): Promise<NextResponse | null> {
  const access = request.cookies.get(ACCESS_COOKIE)?.value;
  const refresh = request.cookies.get(REFRESH_COOKIE)?.value;
  if (access || !refresh) return null;

  try {
    const pair = await nestFetchData<AuthTokenPair>("/auth/refresh", {
      method: "POST",
      body: { refreshToken: refresh },
    });
    const res = NextResponse.next();
    for (const header of authCookieHeaders({
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      expiresIn: pair.expiresIn,
      role: pair.user.role,
    })) {
      res.headers.append("Set-Cookie", header);
    }
    return res;
  } catch {
    const res = NextResponse.next();
    for (const header of clearAuthCookieHeaders()) {
      res.headers.append("Set-Cookie", header);
    }
    return res;
  }
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};
