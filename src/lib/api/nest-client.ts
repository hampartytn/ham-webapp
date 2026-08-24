import { parseNestResponse } from "./errors";
import type { NestData } from "./types";

function apiBaseUrl(): string {
  const base = process.env.HAM_API_BASE_URL ?? "http://localhost:3000/api/v1";
  return base.replace(/\/$/, "");
}

export type NestRequestInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  accessToken?: string | null;
  /** When true, body is sent as-is (FormData / Blob) without JSON.stringify */
  rawBody?: boolean;
};

/**
 * Server-only Nest fetch client. Never import from Client Components.
 */
export async function nestFetch<T>(
  path: string,
  init: NestRequestInit = {},
): Promise<T> {
  const url = `${apiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");

  const { body: rawBody, accessToken: _token, rawBody: isRaw, ...rest } = init;
  void _token;

  if (rawBody !== undefined && !isRaw) {
    headers.set("Content-Type", "application/json");
  }
  if (init.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  let body: BodyInit | undefined;
  if (rawBody === undefined) {
    body = undefined;
  } else if (isRaw) {
    body = rawBody as BodyInit;
  } else {
    body = JSON.stringify(rawBody);
  }

  const response = await fetch(url, {
    ...rest,
    headers,
    body,
    cache: "no-store",
  });

  return parseNestResponse<T>(response);
}

export async function nestFetchData<T>(
  path: string,
  init?: NestRequestInit,
): Promise<T> {
  const wrapped = await nestFetch<NestData<T>>(path, init);
  return wrapped.data;
}

/** Full Nest JSON body (`data` + optional `meta`). */
export async function nestFetchEnvelope<TData, TMeta = unknown>(
  path: string,
  init?: NestRequestInit,
): Promise<{ data: TData; meta?: TMeta }> {
  return nestFetch<{ data: TData; meta?: TMeta }>(path, init);
}

export async function nestHealth(): Promise<{ ok: boolean; status: number }> {
  const base = apiBaseUrl().replace(/\/api\/v1$/, "");
  const response = await fetch(`${base}/health`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  return { ok: response.ok, status: response.status };
}
