import { NextRequest } from "next/server";

import { handleAuthMutation, nestFetchData } from "../../_shared";

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const data = await nestFetchData<{ expiresIn: number }>("/auth/otp/request", {
      method: "POST",
      body,
    });
    return Response.json({ data });
  });
}
