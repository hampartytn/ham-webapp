import { NextRequest } from "next/server";

import {
  handleAuthMutation,
  restoreSessionInRouteHandler,
} from "../_shared";

export async function GET(request: NextRequest) {
  // GET session — CSRF not required; still Origin-safe for cookies
  void request;
  try {
    const user = await restoreSessionInRouteHandler();
    if (!user) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }
    return Response.json({ data: { user } });
  } catch (error) {
    const { nestErrorToResponse } = await import("@/lib/api/session-fetch");
    return nestErrorToResponse(error);
  }
}

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const user = await restoreSessionInRouteHandler();
    if (!user) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 },
      );
    }
    return Response.json({ data: { user } });
  });
}
