import { NextRequest } from "next/server";

import {
  handleAuthMutation,
  issueSessionResponse,
  nestFetchData,
} from "../_shared";
import type { AuthTokenPair } from "@/lib/api/types";

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const body = (await request.json()) as Record<string, unknown>;
    const data = await nestFetchData<AuthTokenPair>("/auth/login", {
      method: "POST",
      body,
    });
    return issueSessionResponse(data);
  });
}
