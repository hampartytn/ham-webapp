# ham-webapp — Web Project Plan

**Project name:** ham-webapp  
**Status:** Planning complete (Phase W0)  
**Date:** 2026-08-24

Related: [WEB_ARCHITECTURE.md](WEB_ARCHITECTURE.md) · [WEB_AUTH_STRATEGY.md](WEB_AUTH_STRATEGY.md) · [WEB_API_INTEGRATION.md](WEB_API_INTEGRATION.md) · [WEB_SECURITY.md](WEB_SECURITY.md) · [WEB_I18N.md](WEB_I18N.md) · [WEB_IMPLEMENTATION_CHECKLIST.md](WEB_IMPLEMENTATION_CHECKLIST.md)

Backend: [../../ham-backend/docs/PROJECT_PLAN.md](../../ham-backend/docs/PROJECT_PLAN.md)

---

## 1. Purpose

Build **one** production-minded Next.js web application that serves employees, employers, administrators, and super administrators. All business rules, authn/authz, and sensitive data remain in **ham-backend**. The webapp is a secure, multilingual, accessible UI client.

---

## 2. Product context

HAM is a Tamil Nadu Job & Worker Welfare Platform for migrant and blue-collar workers. Users may have low digital literacy. UX must be simple, clear, mobile-first for employees, and operational for employer/admin.

v1 languages: **Tamil (`ta`)**, **English (`en`)**, **Hindi (`hi`)**.

---

## 3. Environment discovery (2026-08-24)

| Tool | Observed | Requirement |
| --- | --- | --- |
| Node.js | **24.19.0** | Next.js 16 requires Node **≥ 20.9.0** — satisfied |
| npm | **11.17.0** | ≥ 10 |
| Next.js (npm registry) | **16.3.2** | Pin this major line at W1 (`create-next-app` / `npm show next version`) |
| next-intl (npm) | **4.13.7** | Compatible App Router i18n |
| @tanstack/react-query (npm) | **5.102.2** | Client server-state |

ham-backend local default: `http://localhost:3000`.  
ham-webapp local default: **`http://localhost:3001`** (already listed in ham-backend `.env.example` `CORS_ORIGINS`).

---

## 4. Selected stack

| Layer | Choice | Pin / range | Basis |
| --- | --- | --- | --- |
| Runtime | Node.js | **24.19.0** (`.nvmrc`) | Same as ham-backend; ≥ 20.9 for Next 16 |
| Framework | Next.js App Router | **16.3.x** (16.3.2 at planning) | Active LTS mid-2026 |
| UI | React | **19.x** (Next 16 default) | Official Next 16 |
| Language | TypeScript | strict | Align with backend |
| CSS | Tailwind CSS | stable with Next 16 | Utility-first, responsive |
| Components | shadcn/ui-style + Radix primitives | copy-in components | A11y without heavy design system lock-in |
| Forms | React Hook Form + Zod | current stable | UX validation only |
| Server state | TanStack Query | **5.x** | Lists, mutations, cache |
| i18n | next-intl | **4.x** | App Router locales |
| Icons | lucide-react | via shadcn convention | One icon set |
| Package manager | npm | 11.x | Match backend |

### Decision D1 — Next.js 16 App Router

- **Decision:** Next.js 16.x App Router, not Pages Router, not a Vite SPA.
- **Why:** RSC by default, server-side BFF routes, mature i18n, production tooling.
- **Alternatives:** Next 15 (Maintenance LTS ending Oct 2026); Vite SPA (weaker cookie/BFF story).
- **Trade-offs:** App Router conventions must be learned; Turbopack defaults in 16.
- **Impact:** Folder layout under `src/app/`; auth BFF as Route Handlers.

### Decision D2 — One webapp, role sections

- **Decision:** Single deployable Next app with employee / employer / admin route trees.
- **Why:** Spec requires one product; shared auth and design system.
- **Alternatives:** Separate apps per role (rejected — ops and auth duplication).
- **Trade-offs:** Careful route and layout isolation required.
- **Impact:** Middleware + layouts enforce UX boundaries; Nest enforces real authz.

### Decision D3 — No Redux

- **Decision:** TanStack Query for server state; React context/cookies for session shell; local `useState` for UI.
- **Why:** Avoid duplicated server state; Redux not needed for this surface.
- **Alternatives:** Redux Toolkit, Zustand global store.
- **Trade-offs:** Must keep session and query caches consistent on logout.
- **Impact:** Documented in WEB_ARCHITECTURE.md.

---

## 5. Backend relationship (locked)

- API: REST `/api/v1` on ham-backend.
- Auth: JWT access + rotating refresh in JSON; web wraps via BFF cookies (see WEB_AUTH_STRATEGY.md).
- Roles: `EMPLOYEE` | `EMPLOYER` | `ADMIN` | `SUPER_ADMIN`.
- Do not invent endpoints. Swagger `/docs`, [API_DESIGN.md](../../ham-backend/docs/API_DESIGN.md), [API_REVIEW.md](../../ham-backend/docs/API_REVIEW.md), and Postman are authoritative.
- Backend phases 0–12 complete. No Phase 13.

### Confirmed product rules (frontend must obey)

1. Register → `PENDING_PHONE` → OTP REGISTER verify → `ACTIVE` (no tokens at register).
2. Same phone register again → `409 CONFLICT`.
3. Login while `PENDING_PHONE` → `401 INVALID_CREDENTIALS`.
4. OTP request returns `{ expiresIn: 300 }` (seconds until OTP expiry), **not** the OTP code.
5. Never store/display full Aadhaar.
6. Verification success does not auto-join HAM.
7. Payment does not gate job posting.
8. Worker/applicant UI must not invent phone/DOB/identity fields.
9. Membership withdraw may return `NOT_ENABLED` — show honestly.
10. Welfare HTTP missing — Coming Soon only.

---

## 6. Assumptions

1. Local development runs Nest and Next on the same machine with CORS allowlist including `http://localhost:3001`.
2. Production TLS terminates at a reverse proxy; Next and Nest may be separate origins or same site behind a path — BFF remains same-origin to the browser.
3. Admin bootstrap remains a backend/ops concern (`SEED_DEV_ADMIN` in development).
4. Mock OTP is read from Nest logs in development (`LOG_LEVEL=debug`); production uses real SMS (M4) without returning codes to the client.

---

## 7. Non-goals (v1 web)

- Separate webapps per role
- Second backend or GraphQL layer
- Duplicating Nest business rules
- Redux without demonstrated need
- Real KYC / payment / SMS / object storage before product decisions
- Fake welfare completed flows
- Auto-translating job posts
- Micro-frontends
- Storing tokens in `localStorage`

---

## 8. Implementation roadmap

| Phase | Name | Starts when |
| --- | --- | --- |
| W0 | Discovery and architecture | **Done** (this planning set) |
| W1 | Project foundation | Explicit instruction |
| W2 | Internationalization | After W1 |
| W3 | API foundation | After W1 |
| W4 | Authentication | After W3 |
| W5 | Shared application shell | After W4 |
| W6 | Employee features | After W5 |
| W7 | Employer features | After W5 |
| W8 | Admin features | After W5 |
| W9 | Security hardening | After feature phases |
| W10 | Testing and quality | After W9 or overlapping critical flows |
| W11 | Release readiness | After W10 |

Details: [WEB_IMPLEMENTATION_CHECKLIST.md](WEB_IMPLEMENTATION_CHECKLIST.md).

---

## 9. Stop condition

After Phase W0 planning documents exist:

**STOP.** Do not run `create-next-app` or implement features until an explicit instruction such as `Implement Phase W1`.
