import { cookies } from "next/headers";

export const ACCESS_COOKIE = "ham_access";
export const REFRESH_COOKIE = "ham_refresh";

const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14d — aligns with Nest refresh TTL

function cookieSecure(): boolean {
  return process.env.NODE_ENV === "production";
}

export type TokenCookies = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function readAccessToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function readRefreshToken(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
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
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** For Route Handler Response cookie headers (when cookies() set is insufficient). */
export function authCookieHeaders(tokens: TokenCookies): string[] {
  const secure = cookieSecure() ? "; Secure" : "";
  const accessMaxAge = Math.max(60, tokens.expiresIn || 900);
  return [
    `${ACCESS_COOKIE}=${tokens.accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${accessMaxAge}${secure}`,
    `${REFRESH_COOKIE}=${tokens.refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${REFRESH_MAX_AGE_SECONDS}${secure}`,
  ];
}

export function clearAuthCookieHeaders(): string[] {
  const secure = cookieSecure() ? "; Secure" : "";
  return [
    `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
    `${REFRESH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`,
  ];
}
