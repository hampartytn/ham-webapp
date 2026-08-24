import { NextRequest } from "next/server";

import { nestFetch, nestFetchData } from "@/lib/api/nest-client";
import { nestErrorToResponse } from "@/lib/api/session-fetch";
import type { AuthTokenPair, NestData } from "@/lib/api/types";
import { NestApiError } from "@/lib/api/types";
import {
  clearAuthCookieHeaders,
  clearAuthCookies,
  setAuthCookies,
} from "@/lib/auth/cookies";
import { assertCsrf } from "@/lib/auth/csrf";
import { restoreSessionInRouteHandler } from "@/lib/auth/session";

export function jsonWithCookies(
  body: unknown,
  status: number,
  setCookies: string[] = [],
): Response {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const c of setCookies) headers.append("Set-Cookie", c);
  return Response.json(body, { status, headers });
}

export async function handleAuthMutation(
  request: NextRequest,
  run: () => Promise<Response>,
): Promise<Response> {
  const csrf = assertCsrf(request);
  if (csrf) return csrf;
  try {
    return await run();
  } catch (error) {
    return nestErrorToResponse(error);
  }
}

export async function issueSessionResponse(
  pair: AuthTokenPair,
): Promise<Response> {
  await setAuthCookies({
    accessToken: pair.accessToken,
    refreshToken: pair.refreshToken,
    expiresIn: pair.expiresIn,
  });
  return Response.json({
    data: {
      user: pair.user,
      expiresIn: pair.expiresIn,
      tokenType: pair.tokenType,
    },
  });
}

export {
  nestFetch,
  nestFetchData,
  NestApiError,
  clearAuthCookies,
  clearAuthCookieHeaders,
  restoreSessionInRouteHandler,
};
export type { AuthTokenPair, NestData };
