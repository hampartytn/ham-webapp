import {
  authCookieHeaders,
  clearAuthCookieHeaders,
  readAccessToken,
  readRefreshToken,
} from "@/lib/auth/cookies";
import { nestFetch, nestFetchData, nestFetchEnvelope } from "@/lib/api/nest-client";
import { NestApiError } from "@/lib/api/types";
import type { AuthTokenPair, NestData } from "@/lib/api/types";

type SessionInit = {
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  rawBody?: boolean;
};

/**
 * Cookie → Bearer Nest call with one refresh retry on 401.
 * Returns full Nest envelope (`data` + optional `meta`).
 */
export async function nestFetchWithSessionRefresh<TData, TMeta = unknown>(
  path: string,
  init: SessionInit = {},
): Promise<{ data: TData; meta?: TMeta; setCookies?: string[] }> {
  const access = await readAccessToken();
  const refresh = await readRefreshToken();

  const call = async (token: string) =>
    nestFetchEnvelope<TData, TMeta>(path, {
      method: init.method ?? "GET",
      body: init.body,
      headers: init.headers,
      accessToken: token,
      rawBody: init.rawBody,
    });

  if (!access && refresh) {
    const refreshed = await tryRefresh(refresh);
    if (!refreshed) {
      throw new NestApiError({
        status: 401,
        code: "UNAUTHORIZED",
        message: "Unauthorized",
      });
    }
    const envelope = await call(refreshed.pair.accessToken);
    return { ...envelope, setCookies: refreshed.setCookies };
  }

  if (!access) {
    throw new NestApiError({
      status: 401,
      code: "UNAUTHORIZED",
      message: "Unauthorized",
    });
  }

  try {
    return await call(access);
  } catch (error) {
    if (error instanceof NestApiError && error.status === 401 && refresh) {
      const refreshed = await tryRefresh(refresh);
      if (!refreshed) throw error;
      const envelope = await call(refreshed.pair.accessToken);
      return { ...envelope, setCookies: refreshed.setCookies };
    }
    throw error;
  }
}

async function tryRefresh(
  refreshToken: string,
): Promise<{ pair: AuthTokenPair; setCookies: string[] } | null> {
  try {
    const pair = await nestFetchData<AuthTokenPair>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    return {
      pair,
      setCookies: authCookieHeaders({
        accessToken: pair.accessToken,
        refreshToken: pair.refreshToken,
        expiresIn: pair.expiresIn,
      }),
    };
  } catch {
    return null;
  }
}

export function nestErrorToResponse(
  error: unknown,
  extraCookies?: string[],
): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  if (extraCookies) {
    for (const c of extraCookies) headers.append("Set-Cookie", c);
  }

  if (error instanceof NestApiError) {
    if (error.status === 401) {
      for (const c of clearAuthCookieHeaders()) {
        headers.append("Set-Cookie", c);
      }
    }
    return Response.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: error.requestId,
        },
      },
      { status: error.status, headers },
    );
  }

  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "Unexpected error" } },
    { status: 500, headers },
  );
}

export async function applyTokenCookies(
  pair: AuthTokenPair,
): Promise<string[]> {
  return authCookieHeaders({
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    expiresIn: pair.expiresIn,
  });
}

export async function nestRaw(
  path: string,
  init?: Parameters<typeof nestFetch>[1],
): Promise<NestData<unknown>> {
  return nestFetch(path, init);
}
