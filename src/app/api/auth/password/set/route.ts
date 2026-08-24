import { NextRequest } from "next/server";

import { handleAuthMutation } from "../../_shared";
import { nestFetchWithSessionRefresh, nestErrorToResponse } from "@/lib/api/session-fetch";

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const body = (await request.json()) as Record<string, unknown>;
    try {
      const { data, setCookies } = await nestFetchWithSessionRefresh<{
        success: true;
      }>("/auth/password/set", {
        method: "POST",
        body,
      });
      const headers = new Headers({ "Content-Type": "application/json" });
      if (setCookies) {
        for (const c of setCookies) headers.append("Set-Cookie", c);
      }
      return Response.json({ data }, { headers });
    } catch (error) {
      return nestErrorToResponse(error);
    }
  });
}
