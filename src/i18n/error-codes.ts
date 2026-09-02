export const KNOWN_ERROR_CODES = [
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "INVALID_CREDENTIALS",
  "INVALID_OR_EXPIRED_CODE",
  "FORBIDDEN",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_BLOCKED",
  "NOT_FOUND",
  "CONFLICT",
  "NOT_ENABLED",
  "MEMBERSHIP_REQUIRED",
  "RATE_LIMITED",
  "PROVIDER_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const;

export type NestErrorCode = (typeof KNOWN_ERROR_CODES)[number];

export function nestErrorMessageKey(code: string | undefined | null): string {
  if (code && (KNOWN_ERROR_CODES as readonly string[]).includes(code)) {
    return `errors.${code}`;
  }
  if (process.env.NODE_ENV === "development" && code) {
    console.warn("[ham-webapp] unmapped Nest error code:", code);
  }
  return "errors.UNKNOWN";
}
