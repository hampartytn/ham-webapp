# ham-webapp — Web Authentication Strategy

**Project name:** ham-webapp  
**Status:** Planning complete  
**Date:** 2026-08-24

Related: [WEB_SECURITY.md](WEB_SECURITY.md) · [WEB_API_INTEGRATION.md](WEB_API_INTEGRATION.md) · [../../ham-backend/docs/SECURITY.md](../../ham-backend/docs/SECURITY.md)

---

## 1. Backend contract (unchanged)

ham-backend v1:

- Issues **JWT access** + **opaque refresh** in JSON on login / OTP verify / refresh.
- Clients send `Authorization: Bearer <accessToken>`.
- Refresh/logout send `refreshToken` in the JSON body.
- Nest does **not** set auth cookies (`JWT_REFRESH_COOKIE_ENABLED=false` in example).
- SECURITY.md documents HttpOnly cookies as a **future web option**, not implemented on Nest.

Frontend must not require Nest cookie changes in v1.

---

## 2. Decision D5 — Next.js BFF session bridge

### Decision

Browser never holds access or refresh tokens in JavaScript-readable storage.

1. Browser calls **same-origin** Next Route Handlers (e.g. `/api/auth/login`, `/api/auth/otp/verify`).
2. Next server calls Nest `/api/v1/auth/*`.
3. On success, Next sets **HttpOnly** cookies:
   - **Refresh cookie** — long-lived (~14d, matches Nest refresh TTL), `httpOnly`, `secure` in production, `sameSite=lax`, path-scoped.
   - **Access cookie** — short-lived (~15m / Nest `expiresIn`), same flags.
4. For data requests, browser calls Next BFF/proxy or Server Components that read cookies and attach `Authorization: Bearer` to Nest.
5. On Nest `401` for access expiry: Next calls Nest refresh once with the refresh cookie value, rotates cookies, retries once. Prevent infinite loops with a single-flight refresh lock.
6. Logout: Next calls Nest logout with refresh body when present, then clears cookies.

### Why

- Reduces XSS token theft vs `localStorage`.
- Compatible with existing Nest Bearer JSON APIs **without** changing Nest contracts.
- Matches SECURITY.md direction for web (HttpOnly cookies) at the Next edge.

### Alternatives considered

| Alternative | Why rejected |
| --- | --- |
| Store tokens in `localStorage` / `sessionStorage` | XSS can exfiltrate refresh; explicitly banned by product rules |
| Change Nest to issue cookies now | Out of scope for web planning; requires backend phase + CSRF on Nest |
| Opaque Next session store (Redis) holding tokens | Extra infra; not required for v1 monolith web |
| Memory-only access token in JS + HttpOnly refresh | Still exposes access to XSS during its lifetime; full HttpOnly pair preferred |

### Trade-offs

| Benefit | Cost |
| --- | --- |
| Tokens not readable by page JS | Must implement BFF carefully |
| Works with current Nest | Next becomes trusted token custodian |
| Same Site cookies simplify CSRF vs cross-site cookie to Nest | Mutating BFF routes need Origin checks |

### Impact

- W3/W4 implement `lib/auth` cookie helpers and `/api/auth/*`.
- All feature API calls from the browser go through server-mediated paths (BFF proxy or RSC).
- Mobile apps (future) continue to use Bearer JSON directly; they do not use this BFF.

### Security implications

- HttpOnly mitigates script access to tokens; XSS can still act as the user in-browser — keep XSS surface small (WEB_SECURITY.md).
- CSRF: require `Origin`/`Referer` allowlist on cookie-authenticated mutating BFF routes; prefer same-site navigation.
- Do not log cookie values, Authorization headers, or OTP codes.
- `Secure` flag required in production HTTPS.

---

## 3. Auth UX state machine (must match Nest)

```
Anonymous
  → POST /auth/register → PENDING_PHONE (no tokens)
  → POST /auth/otp/request purpose=REGISTER → { expiresIn: 300 }
  → POST /auth/otp/verify purpose=REGISTER → ACTIVE + tokens → BFF sets cookies

PENDING_PHONE + POST /auth/login → 401 INVALID_CREDENTIALS
PENDING_PHONE + register again → 409 CONFLICT (keep first account)

ACTIVE → password login or OTP purpose=LOGIN
ACTIVE → refresh / logout
SUSPENDED / BLOCKED → 403 with those codes after auth
```

UI must explain OTP expiry using `expiresIn` (seconds), support resend, and never claim login succeeded on register alone.

### Development OTP

Nest mock SMS does not return the code in HTTP. With `LOG_LEVEL=debug`, Nest logs `otp.mock`. Document this for developers; never build a “get OTP from API” shortcut into production UI.

---

## 4. Session restoration

On page load / middleware:

1. Read access cookie; if present, optionally call Nest `GET /api/v1/auth/session` (or `/me`) via server.
2. If access missing/expired but refresh present → refresh once → set cookies.
3. If both fail → anonymous; clear cookies.

Role for layout selection comes from session/user payload (`EMPLOYEE` | `EMPLOYER` | `ADMIN` | `SUPER_ADMIN`). Admin permissions still checked by Nest on each admin route; UI may call `GET /admin/permissions/check` for progressive disclosure only.

---

## 5. Route protection (UX only)

| Situation | UX |
| --- | --- |
| No session | Redirect to login with safe `next` redirect allowlist |
| Wrong role | Forbidden page |
| Nest 401 | Clear/refresh session; re-auth if needed |
| Nest 403 | Forbidden / suspended / blocked messaging by `error.code` |

Never treat middleware as a security boundary.

---

## 6. Password and OTP surfaces (planned screens)

- Register (role EMPLOYEE | EMPLOYER, language, optional password)
- OTP verify (REGISTER / LOGIN / PASSWORD_RESET as needed)
- Password login
- Set password (authenticated)
- Reset password (OTP PASSWORD_RESET → resetToken → new password)

Admin login uses the same password login against an existing ADMIN/SUPER_ADMIN account (seeded via backend ops).

---

## 7. Recommended Nest change (optional, not in W0)

If product later wants Nest-native cookies: implement SECURITY.md “Web future” on ham-backend and simplify the BFF. Until then, **do not** silently weaken web security with localStorage.

Document any such request as a separate backend task — do not invent it during web implementation.
