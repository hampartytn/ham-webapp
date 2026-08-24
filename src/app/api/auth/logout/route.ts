import { NextRequest } from "next/server";

import {
  clearAuthCookieHeaders,
  clearAuthCookies,
  handleAuthMutation,
  nestFetchData,
  jsonWithCookies,
} from "../_shared";
import { readAccessToken, readRefreshToken } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const body = (await request.json().catch(() => ({}))) as {
      allDevices?: boolean;
      refreshToken?: string;
    };
    const refreshToken = body.refreshToken ?? (await readRefreshToken());
    const accessToken = await readAccessToken();

    try {
      if (refreshToken || accessToken) {
        await nestFetchData<{ success: true }>("/auth/logout", {
          method: "POST",
          body: {
            refreshToken,
            allDevices: body.allDevices,
          },
          accessToken: accessToken ?? undefined,
        });
      }
    } catch {
      // Always clear local cookies even if Nest logout fails
    }

    await clearAuthCookies();
    return jsonWithCookies(
      { data: { success: true } },
      200,
      clearAuthCookieHeaders(),
    );
  });
}
