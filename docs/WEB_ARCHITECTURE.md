# ham-webapp — Web Architecture

**Project name:** ham-webapp  
**Status:** Planning complete  
**Date:** 2026-08-24

Related: [WEB_PROJECT_PLAN.md](WEB_PROJECT_PLAN.md) · [WEB_AUTH_STRATEGY.md](WEB_AUTH_STRATEGY.md) · [WEB_API_INTEGRATION.md](WEB_API_INTEGRATION.md)

---

## 1. Architectural style

**Single Next.js App Router application** with role-separated route trees and feature modules. Server Components by default; Client Components only for interactivity (forms, dialogs, live filters).

ham-backend remains the modular monolith API. The webapp never becomes a second source of truth for jobs, membership, permissions, or identity.

### Principles

1. One deployable webapp
2. Feature folders over layer-only dumping
3. Thin pages; logic in feature modules and `lib/`
4. Backend authoritative for authz and business state
5. UX route protection only (middleware + layouts)
6. No duplicated Nest domain rules
7. Shared UI only when genuinely shared
8. Accessibility and low-literacy UX first for employee surfaces
9. Honest empty/error/loading states
10. Configuration via environment variables

---

## 2. System context

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Employee web │  │ Employer web │  │ Admin web    │
│ (same app)   │  │ (same app)   │  │ (same app)   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       └────────────┬────┴────────────────┘
                    │ Same origin (browser → Next)
                    ▼
              ┌─────────────────────────┐
              │      ham-webapp         │
              │  Next.js 16 App Router  │
              │  BFF cookies + proxy    │
              └───────────┬─────────────┘
                          │ Bearer to Nest (server-side)
                          ▼
                    ┌─────────────┐
                    │ ham-backend │
                    │ /api/v1     │
                    └─────────────┘
```

Mobile React Native is out of scope for this repo but will share the same Nest contract.

---

## 3. Decision D4 — Feature-oriented `src/` layout

- **Decision:** Use `features/*` + thin `app/` routes + `lib/api` + `lib/auth`.
- **Why:** Matches domain boundaries (auth, jobs, admin) and keeps RSC pages small.
- **Alternatives:** Pages-only folders; atomic design everywhere.
- **Trade-offs:** Must avoid circular feature imports; shared types live in `types/` or `lib/`.
- **Impact:** W1 creates this tree empty of business UI.

### Planned folder structure

```
ham-webapp/
  docs/                         # this planning set
  public/
  src/
    app/
      [locale]/
        (public)/               # landing, marketing, coming-soon welfare
        (auth)/                 # register, otp, login, reset
        (employee)/             # employee shell
        (employer)/             # employer shell
        (admin)/                # admin shell
      api/
        auth/                   # BFF: register, otp, login, refresh, logout, session
        proxy/                  # optional authenticated proxy to Nest
    components/
      ui/                       # shadcn primitives
      shared/                   # loading, empty, error, confirm, pagination
    features/
      auth/
      employee/
      employer/
      jobs/
      applications/
      legal-support/
      membership/
      verification/
      admin/
    lib/
      api/                      # typed Nest client (server), error mapping
      auth/                     # cookie helpers, session types
      utils/
    hooks/
    types/
    config/
    i18n/
    styles/
  .env.example
  .nvmrc
```

---

## 4. Route areas

| Area | Audience | Examples |
| --- | --- | --- |
| Public | Anonymous | `/`, language picker, welfare coming-soon |
| Auth | Anonymous / pending | `/register`, `/otp`, `/login`, `/password/reset` |
| Employee | `EMPLOYEE` | `/employee/...` dashboard, profile, jobs, applications, legal, verification, membership, settings |
| Employer | `EMPLOYER` | `/employer/...` org, jobs, applicants, workers, settings |
| Admin | `ADMIN` / `SUPER_ADMIN` | `/admin/...` users, jobs, legal, metrics, audit, admins |

Locale prefix via next-intl: `/ta/...`, `/en/...`, `/hi/...` (exact segment strategy finalized in W2).

Wrong-role navigation redirects to an honest forbidden page. Nest still returns 403 if the UI is bypassed.

---

## 5. RSC vs Client Components

| Use Server Components | Use Client Components |
| --- | --- |
| Static shells, marketing copy | Forms (RHF) |
| First paint of read-only pages when session readable on server | Dialogs, toasts, OTP timers |
| Localized static content | Job filters, table sort UX |
| Layout chrome that needs only session role | TanStack Query consumers |

Avoid making the entire app a client SPA.

---

## 6. Layouts and navigation

- **Public layout:** minimal chrome, language switcher.
- **Employee layout:** bottom-nav / simple top nav, large actions, guided steps.
- **Employer layout:** sidebar, denser tables.
- **Admin layout:** sidebar, operational tables, confirmations for high-impact actions.

Navigation items are filtered by role. Super Admin sees admin UI plus permission-gated admin-creation flows.

---

## 7. State management

| Kind | Tool |
| --- | --- |
| Auth/session | HttpOnly cookies + server session reader; thin client session context for role display |
| Server/API data | TanStack Query (browser) and/or server fetch via BFF |
| Local UI | Component state |

On logout: clear cookies, clear QueryClient, redirect to login.

---

## 8. Design system (practical)

Reusable shared pieces (W5+):

- Role layouts and nav
- Page header
- Loading / empty / error / retry
- Confirmation dialog
- Form field + accessible errors
- Pagination (offset) and cursor “load more” for job feed
- Status badges (application, job, verification, membership)
- Tables (employer/admin)

Employee UI: simpler, larger controls. Employer/admin: denser.

---

## 9. Performance

- Prefer Server Components and pagination (backend max limit 50).
- Job feed uses cursor pagination from Nest.
- Do not cache personalized responses across users at CDN edge without explicit strategy (W11).
- Avoid refetch storms: Query keys per resource; invalidate on mutations.

---

## 10. Testing architecture (planned)

- Unit: pure mappers (locale name, error code → message key)
- Component: critical forms with Testing Library
- E2E (later): Playwright against Nest + Next for register→OTP→login and role gates

W10 expands this; W0 only records intent.
