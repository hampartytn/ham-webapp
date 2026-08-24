import { NextRequest } from "next/server";

import {
  handleAuthMutation,
  issueSessionResponse,
  nestFetchData,
} from "../_shared";
import type { AuthTokenPair } from "@/lib/api/types";
import { readRefreshToken, clearAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const refreshToken =
      ((await request.json().catch(() => ({}))) as { refreshToken?: string })
        .refreshToken ?? (await readRefreshToken());

    if (!refreshToken) {
      await clearAuthCookies();
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "No refresh token" } },
        { status: 401 },
      );
    }

    const data = await nestFetchData<AuthTokenPair>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
    return issueSessionResponse(data);
  });
}
