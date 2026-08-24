/**
 * Only allow same-app relative paths for post-login redirects.
 * Paths are locale-unprefixed (next-intl navigation adds locale).
 */
export function safeRedirectPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next || typeof next !== "string") return fallback;
  let trimmed = next.trim();
  if (!trimmed.startsWith("/")) return fallback;
  if (trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  if (trimmed.includes("\\")) return fallback;

  // Strip locale prefix if present: /ta/employee → /employee
  const parts = trimmed.split("/").filter(Boolean);
  if (parts[0] && ["ta", "en", "hi"].includes(parts[0])) {
    trimmed = `/${parts.slice(1).join("/")}` || "/";
  }

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function homePathForRole(role: string): string {
  switch (role) {
    case "EMPLOYEE":
      return "/employee";
    case "EMPLOYER":
      return "/employer";
    case "ADMIN":
    case "SUPER_ADMIN":
      return "/admin";
    default:
      return "/";
  }
}
