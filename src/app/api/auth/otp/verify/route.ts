import { NextRequest } from "next/server";

import {
  handleAuthMutation,
  issueSessionResponse,
  nestFetchData,
} from "../../_shared";
import type { AuthTokenPair } from "@/lib/api/types";

export async function POST(request: NextRequest) {
  return handleAuthMutation(request, async () => {
    const body = (await request.json()) as {
      phone: string;
      purpose: string;
      code: string;
    };
    const data = await nestFetchData<
      AuthTokenPair | { resetToken: string }
    >("/auth/otp/verify", {
      method: "POST",
      body,
    });

    if ("resetToken" in data && data.resetToken) {
      return Response.json({ data: { resetToken: data.resetToken } });
    }

    return issueSessionResponse(data as AuthTokenPair);
  });
}
