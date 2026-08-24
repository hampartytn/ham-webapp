import { NextRequest } from "next/server";

import { assertCsrf } from "@/lib/auth/csrf";
import {
  nestFetchWithSessionRefresh,
  nestErrorToResponse,
} from "@/lib/api/session-fetch";

type Params = { params: Promise<{ path: string[] }> };

async function proxy(
  request: NextRequest,
  pathParts: string[],
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    const csrf = assertCsrf(request);
    if (csrf) return csrf;
  }

  const nestedPath = `/${pathParts.join("/")}`;
  const search = request.nextUrl.search;
  const path = `${nestedPath}${search}`;

  const contentType = request.headers.get("content-type") ?? "";
  const isMultipart = contentType.includes("multipart/form-data");

  let body: unknown = undefined;
  let rawBody = false;
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (isMultipart) {
      body = await request.formData();
      rawBody = true;
    } else {
      const text = await request.text();
      body = text ? JSON.parse(text) : undefined;
    }
  }

  try {
    const { data, meta, setCookies } = await nestFetchWithSessionRefresh<
      unknown,
      unknown
    >(path, {
      method: request.method,
      body,
      rawBody,
    });
    const headers = new Headers({ "Content-Type": "application/json" });
    if (setCookies) {
      for (const c of setCookies) headers.append("Set-Cookie", c);
    }
    const payload =
      meta === undefined ? { data } : { data, meta };
    return Response.json(payload, { headers });
  } catch (error) {
    return nestErrorToResponse(error);
  }
}

export async function GET(request: NextRequest, ctx: Params) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function POST(request: NextRequest, ctx: Params) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PATCH(request: NextRequest, ctx: Params) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function PUT(request: NextRequest, ctx: Params) {
  const { path } = await ctx.params;
  return proxy(request, path);
}

export async function DELETE(request: NextRequest, ctx: Params) {
  const { path } = await ctx.params;
  return proxy(request, path);
}
