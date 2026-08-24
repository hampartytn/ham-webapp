# Web security notes (Phase W9)

## Headers

Configured in `next.config.ts` for all routes:

- `Content-Security-Policy` (baseline; `'unsafe-inline'`/`'unsafe-eval'` kept for Next/Turbopack DX — tighten further for hardened prod if needed)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy` (camera/mic/geo denied)

`poweredByHeader` is disabled.

## CSRF

Mutating `/api/auth/*` and `/api/proxy/*` routes call `assertCsrf` (`src/lib/auth/csrf.ts`):

- Allowlist: `http://localhost:3001`, `http://127.0.0.1:3001`, plus `NEXT_PUBLIC_APP_URL` origin
- Production requires `Origin` (or valid `Referer`)

## Cookies

Auth cookies `ham_access` / `ham_refresh`:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` when `NODE_ENV=production`
- Never written to `localStorage` / `sessionStorage`

## Redirects

`safeRedirectPath` rejects protocol-relative and absolute external URLs; strips locale prefix for next-intl navigation.

## Logging

Do not log Authorization headers, cookie values, OTP codes, or Aadhaar. BFF and Nest clients must not print token bodies on happy paths.
