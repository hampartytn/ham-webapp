import { cache } from "react";

import { nestFetchData } from "@/lib/api/nest-client";
import { NestApiError } from "@/lib/api/types";
import type { AuthTokenPair, AuthUserView } from "@/lib/api/types";

import {
  clearAuthCookies,
  readAccessToken,
  readRefreshToken,
  setAuthCookies,
} from "./cookies";

/**
 * Read-only session for Server Components / layouts.
 * Does not refresh or mutate cookies (Next forbids Set-Cookie during RSC render).
 * React.cache dedupes within a single RSC request (layout + header).
 */
export const getServerSession = cache(async (): Promise<AuthUserView | null> => {
  const access = await readAccessToken();
  if (!access) return null;

  try {
    return await nestFetchData<AuthUserView>("/auth/session", {
      method: "GET",
      accessToken: access,
    });
  } catch (error) {
    if (
      error instanceof NestApiError &&
      (error.code === "ACCOUNT_SUSPENDED" || error.code === "ACCOUNT_BLOCKED")
    ) {
      return null;
    }
    return null;
  }
});

/**
 * Full restore for Route Handlers only — may refresh and set cookies.
 */
export async function restoreSessionInRouteHandler(): Promise<AuthUserView | null> {
  let access = await readAccessToken();
  const refresh = await readRefreshToken();

  if (!access && refresh) {
    const pair = await refreshTokens(refresh);
    if (!pair) return null;
    access = pair.accessToken;
    return pair.user;
  }

  if (!access) return null;

  try {
    return await nestFetchData<AuthUserView>("/auth/session", {
      method: "GET",
      accessToken: access,
    });
  } catch (error) {
    if (error instanceof NestApiError && error.status === 401 && refresh) {
      const pair = await refreshTokens(refresh);
      if (!pair) return null;
      try {
        return await nestFetchData<AuthUserView>("/auth/session", {
          method: "GET",
          accessToken: pair.accessToken,
        });
      } catch {
        await clearAuthCookies();
        return null;
      }
    }
    if (error instanceof NestApiError && error.status === 401) {
      await clearAuthCookies();
    }
    return null;
  }
}

async function refreshTokens(
  refreshToken: string,
): Promise<AuthTokenPair | null> {
  try {
    const pair = await nestFetchData<AuthTokenPair>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    await setAuthCookies({
      accessToken: pair.accessToken,
      refreshToken: pair.refreshToken,
      expiresIn: pair.expiresIn,
      role: pair.user.role,
    });
    return pair;
  } catch {
    await clearAuthCookies();
    return null;
  }
}

export async function requireServerSession(
  roles?: AuthUserView["role"][],
): Promise<AuthUserView | null> {
  const session = await getServerSession();
  if (!session) return null;
  if (roles && !roles.includes(session.role)) return null;
  return session;
}
