/**
 * Authenticated Nest calls from the browser go through same-origin BFF:
 *
 *   browser → POST/GET /api/proxy/<nest-path> (cookies)
 *          → Next attaches Authorization: Bearer <access>
 *          → Nest /api/v1/<nest-path>
 *
 * On Nest 401: BFF refreshes once via refresh cookie, rotates cookies, retries once.
 * Tokens are never returned to client JS.
 *
 * Auth-specific mutations use /api/auth/* instead of the generic proxy.
 */
export const PROXY_PATTERN = "/api/proxy/*";
