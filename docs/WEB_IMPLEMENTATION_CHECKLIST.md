# ham-webapp — Implementation Checklist

**Project name:** ham-webapp  
**Status:** Phases W0–W11 Done  
**Date:** 2026-08-24

**Next allowed action:** Implementation checklist complete through W11. Further work only on explicit new instructions.

Related: [WEB_PROJECT_PLAN.md](WEB_PROJECT_PLAN.md) · [WEB_ARCHITECTURE.md](WEB_ARCHITECTURE.md) · [WEB_AUTH_STRATEGY.md](WEB_AUTH_STRATEGY.md) · [WEB_API_INTEGRATION.md](WEB_API_INTEGRATION.md) · [WEB_SECURITY.md](WEB_SECURITY.md) · [WEB_I18N.md](WEB_I18N.md)

---

## How to use

Each task has:

- **Status:** `Done` | `NOT STARTED` | `In progress` | `Blocked`
- **Dependencies:** prior tasks/phases
- **Deliverables:** concrete outputs
- **Acceptance:** done when true

Execute phases **sequentially** unless a later phase task explicitly allows parallel work after its dependencies.

---

## Phase W0 — Discovery and architecture

**Phase status:** Done

### W0-T1 — Create webapp docs directory

- **Status:** Done
- **Dependencies:** None
- **Deliverables:** `ham-webapp/`, `ham-webapp/docs/`
- **Acceptance:** Directories exist; no Next app scaffold yet

### W0-T2 — Verify toolchain and pin versions

- **Status:** Done
- **Dependencies:** W0-T1
- **Deliverables:** Versions recorded in WEB_PROJECT_PLAN (Node 24.19.0, npm 11.17.0, Next 16.3.2, next-intl 4.x, TanStack Query 5.x); local web port **3001**
- **Acceptance:** Pins documented; Node ≥ 20.9 confirmed

### W0-T3 — Cross-check backend contracts and gaps

- **Status:** Done
- **Dependencies:** W0-T1
- **Deliverables:** Gaps and Nest helpers documented in WEB_API_INTEGRATION.md
- **Acceptance:** Welfare gap, NOT_ENABLED flows, OTP/privacy rules, CORS note listed honestly

### W0-T4 — Write planning documents

- **Status:** Done
- **Dependencies:** W0-T2, W0-T3
- **Deliverables:** WEB_PROJECT_PLAN, WEB_ARCHITECTURE, WEB_AUTH_STRATEGY, WEB_API_INTEGRATION, WEB_SECURITY, WEB_I18N, docs README, root README
- **Acceptance:** Each major decision includes Decision / Why / Alternatives / Trade-offs / Impact; BFF auth documented; Nest contract unchanged

### W0-T5 — Write sequential checklist and stop

- **Status:** Done
- **Dependencies:** W0-T4
- **Deliverables:** This file with W0 Done and W1–W11 NOT STARTED
- **Acceptance:** No `create-next-app`; agent stops pending explicit W1 instruction

---

## Phase W1 — Project foundation

**Phase status:** Done

### W1-T1 — Scaffold Next.js 16 App Router app

- **Status:** Done
- **Dependencies:** W0 complete + explicit “Implement Phase W1”
- **Deliverables:** Next 16.x app under `ham-webapp/` with TypeScript strict, `src/` layout, App Router
- **Acceptance:** `npm run dev` serves on port **3001**; no business features yet

### W1-T2 — Pin Node and env examples

- **Status:** Done
- **Dependencies:** W1-T1
- **Deliverables:** `.nvmrc` → `24.19.0`; `.env.example` with server `HAM_API_BASE_URL`, `NEXT_PUBLIC_APP_URL`
- **Acceptance:** Env vars documented; no secrets committed

### W1-T3 — Tailwind + base styles

- **Status:** Done
- **Dependencies:** W1-T1
- **Deliverables:** Tailwind configured; global styles entry
- **Acceptance:** Utility classes work in a placeholder page

### W1-T4 — shadcn/ui-style primitives baseline

- **Status:** Done
- **Dependencies:** W1-T3
- **Deliverables:** `components/ui` init (button, input, label as minimum)
- **Acceptance:** Accessible primitives render; lucide-react available

### W1-T5 — Folder skeleton

- **Status:** Done
- **Dependencies:** W1-T1
- **Deliverables:** Empty `features/*`, `lib/{api,auth,utils}`, `hooks`, `types`, `config`, `i18n`, `styles` per WEB_ARCHITECTURE
- **Acceptance:** Structure matches plan; no fake feature UIs

### W1-T6 — ESLint / Prettier / scripts

- **Status:** Done
- **Dependencies:** W1-T1
- **Deliverables:** Lint/format scripts aligned with strict TS
- **Acceptance:** `npm run lint` runs clean on scaffold

---

## Phase W2 — Internationalization

**Phase status:** Done

### W2-T1 — Install and configure next-intl

- **Status:** Done
- **Dependencies:** W1
- **Deliverables:** next-intl routing for `ta` | `en` | `hi`
- **Acceptance:** Locale-prefixed routes resolve

### W2-T2 — Message catalogs scaffolding

- **Status:** Done
- **Dependencies:** W2-T1
- **Deliverables:** `en.json` / `ta.json` / `hi.json` with `common` + `auth` + `errors` stubs
- **Acceptance:** Switching locale changes visible strings

### W2-T3 — Language selection UX

- **Status:** Done
- **Dependencies:** W2-T2
- **Deliverables:** Language picker reachable from public shell
- **Acceptance:** Choice persists for session/local preference per W2 design

### W2-T4 — Catalog display-name helper

- **Status:** Done
- **Dependencies:** W2-T1
- **Deliverables:** Utility: `names[locale] ?? names.en ?? fallback`
- **Acceptance:** Unit-tested or clearly verified with sample maps

### W2-T5 — Error code → message key map

- **Status:** Done
- **Dependencies:** W2-T2
- **Deliverables:** Mapper for Nest `error.code` values listed in WEB_I18N
- **Acceptance:** Unknown codes fall back to generic error

---

## Phase W3 — API foundation

**Phase status:** Done

### W3-T1 — Server Nest fetch client

- **Status:** Done
- **Dependencies:** W1
- **Deliverables:** `lib/api` server client using `HAM_API_BASE_URL`
- **Acceptance:** Can hit Nest `/health` or equivalent from server code

### W3-T2 — Error envelope parser

- **Status:** Done
- **Dependencies:** W3-T1, W2-T5
- **Deliverables:** Typed parse of Nest error shape → code + details
- **Acceptance:** Maps known sample errors without inventing fields

### W3-T3 — TanStack Query provider

- **Status:** Done
- **Dependencies:** W1
- **Deliverables:** QueryClient provider for client trees
- **Acceptance:** Provider wraps authenticated app shells

### W3-T4 — BFF auth route stubs

- **Status:** Done
- **Dependencies:** W3-T1
- **Deliverables:** `/api/auth/*` route handlers scaffolding (login/register/otp/refresh/logout/session)
- **Acceptance:** Handlers exist; cookie helpers sketched; CSRF Origin check hook points defined

### W3-T5 — Authenticated proxy pattern

- **Status:** Done
- **Dependencies:** W3-T4
- **Deliverables:** Documented pattern (and minimal implementation) for cookie → Bearer Nest calls
- **Acceptance:** No tokens exposed to client JS

---

## Phase W4 — Authentication

**Phase status:** Done

### W4-T1 — Register UI + API via BFF

- **Status:** Done
- **Dependencies:** W3, W2
- **Deliverables:** Register form (role EMPLOYEE|EMPLOYER, phone, language, optional password)
- **Acceptance:** Nest `201` pending; no cookies; UI does not claim full login

### W4-T2 — OTP request REGISTER

- **Status:** Done
- **Dependencies:** W4-T1
- **Deliverables:** Request OTP; show countdown from `expiresIn`
- **Acceptance:** No OTP code from HTTP; resend available

### W4-T3 — OTP verify REGISTER

- **Status:** Done
- **Dependencies:** W4-T2
- **Deliverables:** Verify UI; BFF sets HttpOnly cookies on success
- **Acceptance:** Active session; pending → active state machine matched

### W4-T4 — Password login

- **Status:** Done
- **Dependencies:** W3-T4
- **Deliverables:** Login form → BFF → cookies
- **Acceptance:** Pending phone shows INVALID_CREDENTIALS messaging; active succeeds

### W4-T5 — OTP LOGIN

- **Status:** Done
- **Dependencies:** W4-T2 patterns
- **Deliverables:** Login via OTP purpose=LOGIN
- **Acceptance:** Cookies set; errors mapped

### W4-T6 — Session restore

- **Status:** Done
- **Dependencies:** W4-T3 or W4-T4
- **Deliverables:** Middleware/server session using Nest `/auth/session` or `/me`
- **Acceptance:** Refresh on access expiry once; anonymous if both fail

### W4-T7 — Refresh

- **Status:** Done
- **Dependencies:** W4-T6
- **Deliverables:** Single-flight refresh; cookie rotation
- **Acceptance:** No infinite refresh loop; one retry after refresh

### W4-T8 — Logout

- **Status:** Done
- **Dependencies:** W4-T6
- **Deliverables:** Clear cookies + Nest logout with refresh when present
- **Acceptance:** Query cache cleared; redirect to login

### W4-T9 — Protected routes by role

- **Status:** Done
- **Dependencies:** W4-T6
- **Deliverables:** Employee/employer/admin route gates (UX)
- **Acceptance:** Wrong role → forbidden; Nest still authoritative

### W4-T10 — 401 / 403 UX

- **Status:** Done
- **Dependencies:** W4-T9, W2-T5
- **Deliverables:** Suspended/blocked/forbidden/re-auth flows by `error.code`
- **Acceptance:** Honest messages; no silent swallow

### W4-T11 — Password set / reset (minimum)

- **Status:** Done
- **Dependencies:** W4-T3
- **Deliverables:** Set password (authed); reset request/confirm via OTP PASSWORD_RESET
- **Acceptance:** Matches Nest endpoints; tokens only via BFF cookies where applicable

---

## Phase W5 — Shared application shell

**Phase status:** Done

### W5-T1 — Public layout + landing stub

- **Status:** Done
- **Dependencies:** W2, W4-T6
- **Deliverables:** Public chrome, CTA to register/login, language control
- **Acceptance:** First paint coherent; no fake feature claims

### W5-T2 — Employee layout + nav

- **Status:** Done
- **Dependencies:** W4-T9
- **Deliverables:** Employee shell, large nav targets
- **Acceptance:** Only EMPLOYEE routes reachable from nav

### W5-T3 — Employer layout + nav

- **Status:** Done
- **Dependencies:** W4-T9
- **Deliverables:** Employer sidebar/shell
- **Acceptance:** Only EMPLOYER routes in nav

### W5-T4 — Admin layout + nav

- **Status:** Done
- **Dependencies:** W4-T9
- **Deliverables:** Admin shell; permission-aware menu stubs
- **Acceptance:** ADMIN/SUPER_ADMIN only; progressive disclosure documented

### W5-T5 — Shared UI states

- **Status:** Done
- **Dependencies:** W1-T4
- **Deliverables:** Loading, empty, error/retry, confirm dialog, pagination controls
- **Acceptance:** Reused across feature phases

### W5-T6 — Welfare Coming Soon page

- **Status:** Done
- **Dependencies:** W5-T1
- **Deliverables:** Honest Coming Soon; no fake welfare API
- **Acceptance:** Copy uses i18n; no invented Nest call

---

## Phase W6 — Employee features

**Phase status:** Done

### W6-T1 — Employee dashboard stub wired to session

- **Status:** Done
- **Dependencies:** W5-T2
- **Deliverables:** Dashboard shell with real session identity
- **Acceptance:** No placeholder fake metrics claiming Nest data that does not exist

### W6-T2 — Profile view/edit

- **Status:** Done
- **Dependencies:** W3, W5-T2
- **Deliverables:** Employee profile against Nest profile APIs
- **Acceptance:** Only Nest fields; validation UX + Nest errors

### W6-T3 — Job discovery / feed

- **Status:** Done
- **Dependencies:** W3, W5-T5
- **Deliverables:** Cursor-based job feed + detail
- **Acceptance:** No auto-translate of job text; pagination correct

### W6-T4 — Applications

- **Status:** Done
- **Dependencies:** W6-T3
- **Deliverables:** Apply, list, withdraw where Nest allows
- **Acceptance:** Status badges; error codes mapped

### W6-T5 — Verification flow UI

- **Status:** Done
- **Dependencies:** W5-T2
- **Deliverables:** Start → status; mock complete only per non-prod Nest rules
- **Acceptance:** No full Aadhaar; success ≠ membership

### W6-T6 — Membership UI

- **Status:** Done
- **Dependencies:** W5-T2
- **Deliverables:** Status + join/renew as Nest enables; withdraw shows NOT_ENABLED honestly
- **Acceptance:** No fake withdraw success

### W6-T7 — Legal support (employee)

- **Status:** Done
- **Dependencies:** W5-T2
- **Deliverables:** Create/list legal support requests
- **Acceptance:** Matches Nest; empty/error states

### W6-T8 — Employee settings

- **Status:** Done
- **Dependencies:** W4-T11, W2-T3
- **Deliverables:** Language, password, logout entry points
- **Acceptance:** Settings do not invent backend preferences

---

## Phase W7 — Employer features

**Phase status:** Done

### W7-T1 — Employer dashboard

- **Status:** Done
- **Dependencies:** W5-T3
- **Deliverables:** Dashboard shell
- **Acceptance:** Real session; no fake payment gates

### W7-T2 — Organization management

- **Status:** Done
- **Dependencies:** W3
- **Deliverables:** Org create/view/update per Nest
- **Acceptance:** Validation + Nest errors

### W7-T3 — Job posting and management

- **Status:** Done
- **Dependencies:** W7-T2
- **Deliverables:** Create/list/edit/close jobs
- **Acceptance:** **Not** blocked on payment stub; payments UI honest if shown

### W7-T4 — Applicants review

- **Status:** Done
- **Dependencies:** W7-T3
- **Deliverables:** Applicant list/detail actions per Nest
- **Acceptance:** Privacy: only returned fields (no invented phone/DOB/identity)

### W7-T5 — Workers roster

- **Status:** Done
- **Dependencies:** W5-T3
- **Deliverables:** Worker list UI from Nest
- **Acceptance:** Privacy-safe components

### W7-T6 — Employer settings

- **Status:** Done
- **Dependencies:** W4-T8
- **Deliverables:** Settings + logout
- **Acceptance:** Role-appropriate only

---

## Phase W8 — Admin features

**Phase status:** Done

### W8-T1 — Admin dashboard

- **Status:** Done
- **Dependencies:** W5-T4
- **Deliverables:** Admin home
- **Acceptance:** Session via Nest admin helpers where used

### W8-T2 — Users management

- **Status:** Done
- **Dependencies:** W8-T1
- **Deliverables:** User list/detail/actions per Nest admin APIs
- **Acceptance:** 403 UX for missing permissions

### W8-T3 — Jobs moderation

- **Status:** Done
- **Dependencies:** W8-T1
- **Deliverables:** Admin job list/actions
- **Acceptance:** Confirmations for high-impact actions

### W8-T4 — Legal triage

- **Status:** Done
- **Dependencies:** W8-T1
- **Deliverables:** Admin legal support queue
- **Acceptance:** Matches Nest states

### W8-T5 — Metrics

- **Status:** Done
- **Dependencies:** W8-T1
- **Deliverables:** Metrics views from Nest only
- **Acceptance:** No invented charts without API data

### W8-T6 — Audit log

- **Status:** Done
- **Dependencies:** W8-T1
- **Deliverables:** Audit list UI
- **Acceptance:** Pagination respected

### W8-T7 — Admins management (Super Admin)

- **Status:** Done
- **Dependencies:** W8-T1, permissions check
- **Deliverables:** Admin create/list gated UI
- **Acceptance:** Not exposed as open registration; Nest enforces

### W8-T8 — Permissions progressive disclosure

- **Status:** Done
- **Dependencies:** W3
- **Deliverables:** Use `GET /admin/permissions/check` for menu visibility
- **Acceptance:** Hidden UI still 403-safe if forced

---

## Phase W9 — Security hardening

**Phase status:** Done

### W9-T1 — Security headers

- **Status:** Done
- **Dependencies:** W1
- **Deliverables:** CSP baseline, Referrer-Policy, X-Content-Type-Options, frame denial
- **Acceptance:** Headers present on app responses in staging check

### W9-T2 — CSRF verification on BFF

- **Status:** Done
- **Dependencies:** W3-T4, W4
- **Deliverables:** Origin allowlist enforced on mutating auth/proxy routes
- **Acceptance:** Cross-site Origin rejected

### W9-T3 — Redirect allowlist

- **Status:** Done
- **Dependencies:** W4
- **Deliverables:** Safe `next` param handling
- **Acceptance:** External URLs rejected

### W9-T4 — Cookie flags audit

- **Status:** Done
- **Dependencies:** W4
- **Deliverables:** HttpOnly/SameSite/Secure (prod) verified
- **Acceptance:** No tokens in JS-accessible storage

### W9-T5 — Logging hygiene

- **Status:** Done
- **Dependencies:** W3
- **Deliverables:** No token/OTP/PII in client or server logs for happy paths
- **Acceptance:** Spot-check auth flows

---

## Phase W10 — Testing and quality

**Phase status:** Done

### W10-T1 — Unit tests for mappers

- **Status:** Done
- **Dependencies:** W2-T4, W2-T5, W3-T2
- **Deliverables:** Tests for locale names + error mapping
- **Acceptance:** CI-local script passes

### W10-T2 — Component tests for auth forms

- **Status:** Done
- **Dependencies:** W4
- **Deliverables:** Testing Library coverage for register/login/OTP critical paths
- **Acceptance:** Key validations covered

### W10-T3 — E2E smoke (Playwright or equivalent)

- **Status:** Done
- **Dependencies:** W4, running Nest
- **Deliverables:** register→OTP→session and role gate smoke
- **Acceptance:** Documented how to run against local Nest

### W10-T4 — Lint/typecheck gate

- **Status:** Done
- **Dependencies:** W1-T6
- **Deliverables:** `tsc --noEmit` + lint clean for src
- **Acceptance:** Scripts documented in README

---

## Phase W11 — Release readiness

**Phase status:** Done

### W11-T1 — README runbook

- **Status:** Done
- **Dependencies:** W1–W10 as completed for release candidate
- **Deliverables:** How to run web + backend locally; ports; env; OTP debug note
- **Acceptance:** New developer can follow without inventing steps

### W11-T2 — Dependency audit

- **Status:** Done
- **Dependencies:** Feature complete candidate
- **Deliverables:** `npm audit` notes + accepted exceptions
- **Acceptance:** No silent ignore of high issues without rationale

### W11-T3 — i18n completeness gate

- **Status:** Done
- **Dependencies:** W2, feature phases
- **Deliverables:** Critical auth + employee strings in `ta`/`en`/`hi`
- **Acceptance:** No English-only critical employee path

### W11-T4 — Production env checklist

- **Status:** Done
- **Dependencies:** W9
- **Deliverables:** HTTPS, Secure cookies, CORS/backend origins, `NEXT_PUBLIC_APP_URL`
- **Acceptance:** Checklist signed off in docs (hosting may remain TBD)

### W11-T5 — Honest gaps remain honest

- **Status:** Done
- **Dependencies:** W5-T6, W6-T6, payments UX if any
- **Deliverables:** Coming Soon / NOT_ENABLED still accurate at release
- **Acceptance:** No fake welfare/KYC/payment completion

---

## Stop / handoff

After completing any phase, update this checklist statuses, then **STOP** until the next explicit `Implement Phase Wn` instruction.

**Current stop point:** Phases **W0–W11** complete.
