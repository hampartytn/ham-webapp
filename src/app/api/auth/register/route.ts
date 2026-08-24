import { NextRequest } from "next/server";

import {
  handleAuthMutation,
  nestFetchData,
} from "../_shared";
import type { RegisterResult } from "@/lib/api/types";

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const data = await nestFetchData<RegisterResult>("/auth/register", {
      method: "POST",
      body,
    });
    // No cookies — PENDING_PHONE
    return Response.json({ data }, { status: 201 });
  });
}
