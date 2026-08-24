import { NextRequest } from "next/server";

function allowedOrigins(): Set<string> {
  const set = new Set<string>([
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ]);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      set.add(new URL(appUrl).origin);
    } catch {
      /* ignore invalid */
    }
  }
  return set;
}

/**
 * CSRF check for cookie-authenticated mutating BFF routes.
 * Same-site fetch should send Origin matching the app.
 */
export function assertCsrf(request: NextRequest): Response | null {
  if (request.method === "GET" || request.method === "HEAD") {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = allowedOrigins();

  if (origin) {
    if (!allowed.has(origin)) {
      return Response.json(
        { error: { code: "CSRF", message: "Origin not allowed" } },
        { status: 403 },
      );
    }
    return null;
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (!allowed.has(refOrigin)) {
        return Response.json(
          { error: { code: "CSRF", message: "Referer not allowed" } },
          { status: 403 },
        );
      }
      return null;
    } catch {
      return Response.json(
        { error: { code: "CSRF", message: "Invalid Referer" } },
        { status: 403 },
      );
    }
  }

  // Non-browser clients / same-origin may omit Origin in some cases.
  // Prefer requiring Origin for mutating cookie routes in production.
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: { code: "CSRF", message: "Missing Origin" } },
      { status: 403 },
    );
  }

  return null;
}
