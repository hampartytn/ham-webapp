# ham-webapp — Web Security

**Project name:** ham-webapp  
**Status:** Planning complete  
**Date:** 2026-08-24

Related: [WEB_AUTH_STRATEGY.md](WEB_AUTH_STRATEGY.md) · [../../ham-backend/docs/SECURITY.md](../../ham-backend/docs/SECURITY.md)

---

## 1. Threat model (web)

| Threat | Mitigation |
| --- | --- |
| XSS token theft | No tokens in `localStorage` / `sessionStorage` / URLs; HttpOnly cookies via BFF |
| XSS session abuse | Minimize `dangerouslySetInnerHTML`; sanitize any rich text; CSP in W9 |
| CSRF on cookie BFF | Origin/Referer allowlist on mutating `/api/*`; SameSite=Lax |
| Open redirects | Allowlist `next` / return URLs (same origin paths only) |
| Credential stuffing | Rely on Nest rate limits; clear UX; no client-side rate-limit bypass |
| Sensitive data in logs | Never log tokens, cookies, OTP, Aadhaar, passwords |
| Supply chain | Pin deps; audit before release (W11); avoid unnecessary packages |
| Confused deputy | Next server attaches Bearer only from its own cookies; no client-supplied Bearer override |

---

## 2. Decision D7 — Defense in depth with Nest

- **Decision:** Treat Nest as the security boundary; Next middleware and UI guards are UX only.
- **Why:** Spec and SECURITY.md: API enforces authn/authz.
- **Alternatives:** Trusting role cookies alone for admin actions.
- **Trade-offs:** Extra 401/403 handling in UI.
- **Impact:** Every mutating feature still hits Nest with real JWT.

---

## 3. Cookie and token rules

1. Access + refresh only in HttpOnly cookies set by Next.
2. Cookie flags: `HttpOnly`; `Secure` in production; `SameSite=Lax`; restrictive `Path`.
3. Never put tokens in query strings, hashes, or analytics.
4. Clear cookies on logout and on unrecoverable refresh failure.
5. Do not mirror tokens into React state beyond “authenticated / role” session shell.

---

## 4. CSRF

Mutating BFF routes (`POST`/`PUT`/`PATCH`/`DELETE`):

- Require `Origin` (or `Referer`) matching allowlist derived from `NEXT_PUBLIC_APP_URL` and known local origins.
- Reject missing/mismatched Origin for cookie-authenticated mutations.
- Prefer same-origin `fetch` with `credentials: 'include'`.

Get/navigation alone is not sufficient protection for state-changing actions.

---

## 5. XSS and content

- Prefer React text escaping by default.
- Job descriptions and user-generated text: render as text or sanitized HTML only if Nest later defines a safe HTML policy (not assumed in W0).
- No third-party scripts without review.
- Avoid evaluating dynamic code from API payloads.

---

## 6. PII and privacy UI

- Never display full Aadhaar; never store Aadhaar in client storage.
- Worker/applicant views show only fields Nest returns.
- Do not log profile payloads containing phone to browser consoles in production builds.
- Verification UI follows Nest states; success does not imply membership.

---

## 7. Uploads

- Client MIME/size checks are UX only.
- Malware scanning and final accept/reject remain Nest / future M14.
- Do not accept executable types in the file picker UX even if Nest would reject.

---

## 8. Redirect allowlist

Login and deep-link `next` parameters:

- Allow only relative paths on this app (e.g. `/en/employee/...`).
- Reject `//evil`, `https://`, and protocol-relative URLs.

---

## 9. Dependency and secrets hygiene

- No secrets in `NEXT_PUBLIC_*`.
- Nest API URL server-only.
- `.env*` not committed with real secrets.
- Run `npm audit` before release; document accepted exceptions like backend practice.

---

## 10. Admin surfaces

- Permission-gated menus via Nest checks are UX; Nest still 403s.
- High-impact actions use confirmation dialogs.
- Super Admin admin-creation flows must not be exposed as “open registration.”

---

## 11. Phase W9 hardening checklist (preview)

- CSP headers (Next config / middleware)
- Security headers (Referrer-Policy, X-Content-Type-Options, frame denial)
- Cookie Secure verification in staging
- CSRF regression tests
- Dependency audit
- Redirect allowlist tests

W0 records intent only; no header implementation yet.
