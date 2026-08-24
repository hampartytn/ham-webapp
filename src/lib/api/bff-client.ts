"use client";

import { nestErrorMessageKey } from "@/i18n/error-codes";
import type { NestErrorDetail } from "@/lib/api/types";

export class BffError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: NestErrorDetail[];
  readonly messageKey: string;

  constructor(args: {
    status: number;
    code: string;
    message: string;
    details?: NestErrorDetail[];
  }) {
    super(args.message);
    this.name = "BffError";
    this.status = args.status;
    this.code = args.code;
    this.details = args.details;
    this.messageKey = nestErrorMessageKey(args.code);
  }
}

export type OffsetMeta = { page: number; limit: number; total: number };
export type CursorMeta = { nextCursor: string | null; limit: number };

export async function bffJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const envelope = await bffEnvelope<T>(path, init);
  return envelope.data;
}

export async function bffEnvelope<T, TMeta = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<{ data: T; meta?: TMeta }> {
  const headers = new Headers(init.headers);
  const isForm =
    typeof FormData !== "undefined" && init.body instanceof FormData;
  if (init.body && !isForm && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new BffError({
      status: 0,
      code: "NETWORK",
      message: "Network error",
    });
  }

  const json = (await response.json().catch(() => null)) as {
    data?: T;
    meta?: TMeta;
    error?: { code: string; message: string; details?: NestErrorDetail[] };
  } | null;

  if (!response.ok) {
    throw new BffError({
      status: response.status,
      code: json?.error?.code ?? (response.status === 403 ? "CSRF" : "UNKNOWN"),
      message: json?.error?.message ?? "Request failed",
      details: json?.error?.details,
    });
  }

  return {
    data: (json?.data ?? json) as T,
    meta: json?.meta,
  };
}

export function proxyPath(nestPath: string, query?: Record<string, string | number | undefined | null>) {
  const clean = nestPath.startsWith("/") ? nestPath.slice(1) : nestPath;
  const url = new URL(`/api/proxy/${clean}`, "http://local");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return `${url.pathname}${url.search}`;
}
