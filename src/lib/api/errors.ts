import { NestApiError, type NestErrorBody } from "./types";

export function isNestErrorBody(value: unknown): value is NestErrorBody {
  if (!value || typeof value !== "object") return false;
  const error = (value as NestErrorBody).error;
  return (
    !!error &&
    typeof error === "object" &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  );
}

export async function parseNestResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      throw new NestApiError({
        status: response.status,
        code: "INTERNAL_ERROR",
        message: "Invalid JSON from API",
      });
    }
  }

  if (!response.ok) {
    if (isNestErrorBody(json)) {
      throw new NestApiError({
        status: response.status,
        code: json.error.code,
        message: json.error.message,
        details: json.error.details,
        requestId: json.error.requestId,
      });
    }
    throw new NestApiError({
      status: response.status,
      code: "UNKNOWN",
      message: response.statusText || "Request failed",
    });
  }

  return json as T;
}
