import { cookies } from "next/headers";

import type { Role } from "@/lib/api/types";
import { parseHamRole } from "@/lib/auth/role";

export const ACCESS_COOKIE = "ham_access";
export const REFRESH_COOKIE = "ham_refresh";
export const ROLE_COOKIE = "ham_role";

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14d — aligns with Nest refresh TTL

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export { parseHamRole } from "@/lib/auth/role";

export type TokenCookies = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  role?: Role;
};

export async function readAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function readRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export async function readRoleCookie(): Promise<Role | undefined> {
  const jar = await cookies();
  return parseHamRole(jar.get(ROLE_COOKIE)?.value);
}

export async function hasSessionCookies(): Promise<boolean> {
  const jar = await cookies();
  return Boolean(
    jar.get(ACCESS_COOKIE)?.value || jar.get(REFRESH_COOKIE)?.value,
  );
}

export async function setAuthCookies(tokens: TokenCookies): Promise<void> {
  const jar = await cookies();
  const secure = cookieSecure();
  const accessMaxAge = Math.max(60, tokens.expiresIn || 900);

  jar.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });

  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_MAX_AGE_SECONDS,
  });

  if (tokens.role) {
    jar.set(ROLE_COOKIE, tokens.role, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE_SECONDS,
    });
  }
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
  jar.delete(ROLE_COOKIE);
}

function cookieAttrs(maxAge: number): string {
  const secure = cookieSecure() ? "; Secure" : "";
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

/** For Route Handler Response cookie headers (when cookies() set is insufficient). */
export function authCookieHeaders(tokens: TokenCookies): string[] {
  const accessMaxAge = Math.max(60, tokens.expiresIn || 900);
  const headers = [
    `${ACCESS_COOKIE}=${tokens.accessToken}; ${cookieAttrs(accessMaxAge)}`,
    `${REFRESH_COOKIE}=${tokens.refreshToken}; ${cookieAttrs(REFRESH_MAX_AGE_SECONDS)}`,
  ];
  if (tokens.role) {
    headers.push(
      `${ROLE_COOKIE}=${tokens.role}; ${cookieAttrs(REFRESH_MAX_AGE_SECONDS)}`,
    );
  }
  return headers;
}

export function clearAuthCookieHeaders(): string[] {
  const secure = cookieSecure() ? "; Secure" : "";
  const clear = `Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
  return [
    `${ACCESS_COOKIE}=; ${clear}`,
    `${REFRESH_COOKIE}=; ${clear}`,
    `${ROLE_COOKIE}=; ${clear}`,
  ];
}
