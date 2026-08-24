# ham-webapp — Web API Integration

**Project name:** ham-webapp  
**Status:** Planning complete  
**Date:** 2026-08-24

Authoritative backend sources:

- [API_DESIGN.md](../../ham-backend/docs/API_DESIGN.md)
- [API_REVIEW.md](../../ham-backend/docs/API_REVIEW.md)
- [SECURITY.md](../../ham-backend/docs/SECURITY.md)
- Swagger: `http://localhost:3000/docs` (dev)
- Postman: `ham-backend/postman/`

---

## 1. Base URL and environment

| Variable (planned) | Local default | Purpose |
| --- | --- | --- |
| `HAM_API_BASE_URL` | `http://localhost:3000/api/v1` | Nest API root used only on the **Next server** |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3001` | Public web origin (links, CSRF allowlist) |
| `PORT` / `npm run dev -p 3001` | **3001** | Must stay on CORS allowlist |

Browser never calls Nest directly in the preferred BFF model. If a temporary direct call is used in early W3, CORS must include `http://localhost:3001` (already in ham-backend `.env.example`).

### Decision D6 — Server-only Nest base URL

- **Decision:** Nest base URL is a server env var, not `NEXT_PUBLIC_*`.
- **Why:** Avoid baking internal hostnames into the client bundle; reinforce BFF.
- **Alternatives:** Public Nest URL for SPA-style fetch.
- **Trade-offs:** All browser data paths need BFF or RSC.
- **Impact:** Documented in W3 `.env.example`.

---

## 2. Typed client plan

W3 deliverables:

1. Shared TypeScript types for Nest envelopes and feature DTOs (hand-written from API_DESIGN / OpenAPI, or generated later if tooling is added).
2. Server Nest client: `fetch` wrapper with Bearer from cookies, timeout, and error parsing.
3. BFF Route Handlers for auth + authenticated proxy for feature mutations/queries used from Client Components.
4. Map Nest `{ statusCode, error: { code, message, details? } }` → UI message keys via next-intl.

Never invent fields Nest does not return.

---

## 3. Error envelope handling

Nest standard (API_DESIGN):

```json
{
  "statusCode": 401,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid phone or password"
  }
}
```

| Rule | Frontend behavior |
| --- | --- |
| Prefer `error.code` | Map to next-intl key (`errors.INVALID_CREDENTIALS`) |
| Fallback | Generic `errors.UNKNOWN` + optional English message in logs (dev only) |
| `VALIDATION_ERROR` | Surface field `details` on forms |
| `NOT_ENABLED` | Honest “not available yet” |
| `ACCOUNT_SUSPENDED` / `ACCOUNT_BLOCKED` | Dedicated blocked UX |
| `CONFLICT` | Registration / uniqueness messaging |
| Network failure | Retry-friendly empty/error state |

Do not rely only on English `message` for UX.

---

## 4. Auth endpoints (via BFF)

| Nest | BFF role | Notes |
| --- | --- | --- |
| `POST /auth/register` | Bridge | 201 pending; no cookies yet |
| `POST /auth/otp/request` | Bridge | Body: phone, purpose; returns `{ expiresIn }` only |
| `POST /auth/otp/verify` | Bridge + set cookies | Tokens on success |
| `POST /auth/login` | Bridge + set cookies | Password |
| `POST /auth/refresh` | Internal BFF | Rotate cookies |
| `POST /auth/logout` | Bridge + clear cookies | Send refresh when present |
| `POST /auth/password/set` | Authed proxy | |
| `POST /auth/password/reset/request` | Bridge | |
| `POST /auth/password/reset/confirm` | Bridge | |
| `GET /auth/me` | Session | |
| `GET /auth/session` | Session restore | Intentional Nest helper |

---

## 5. Feature endpoint map (summary)

Use Nest paths under `/api/v1`. Exact shapes: API_DESIGN / Swagger.

| Feature | Nest areas | Web notes |
| --- | --- | --- |
| Profiles | `/profiles/me`, employee/employer profile | Role-specific forms |
| Organizations | employer org CRUD | Employer shell |
| Jobs | create/list/get/update/close; public/employee search | Cursor feed + offset admin lists |
| Applications | apply, withdraw, employer review | Status badges |
| Workers | employer worker roster | Privacy: no invented PII |
| Legal support | employee create/list; admin triage | |
| Membership | status, join/renew flows | Withdraw → `NOT_ENABLED` UX |
| Verification | start, status, mock complete (non-prod) | No Aadhaar display |
| Payments | stubs | Do **not** gate job posting |
| Files | upload initiate + `GET /files/:fileId` | UX MIME/size only |
| Catalog | skills, districts, etc. | Locale maps → display name |
| Admin | users, jobs, legal, metrics, audit, admins | Permission-gated UI |
| Admin helpers | `GET /admin/session`, `GET /admin/permissions/check` | Progressive disclosure |
| Welfare | **no HTTP GET by slug** | Coming Soon page only |
| Health | `/health`, `/ready` | Ops / readiness only |

---

## 6. Integration gaps (honest)

| Gap | Frontend handling |
| --- | --- |
| `GET /api/v1/welfare/:slug` missing | Static “Coming soon”; no fake API client |
| Membership withdraw → `NOT_ENABLED` | Clear “not available” message |
| Payments stub / `NOT_ENABLED` | Never block employer job posting in UI |
| Identity provider = mock | UI: start → status → mock complete only in non-prod notes |
| OTP not in HTTP body | Manual entry + resend; document Nest `otp.mock` logs for dev |
| Worker/applicant payloads omit phone/DOB/identity | Render only returned fields |
| Catalog locale maps (`names` JSON) | Resolve via user language with `en` fallback |
| Backend CORS | Document `http://localhost:3001` already in example allowlist |

Do not invent welfare/KYC/payment/SMS provider UIs that pretend to be live.

---

## 7. Pagination

| Pattern | Use |
| --- | --- |
| Offset (`page`, `limit`) | Admin/employer tables; max limit 50 |
| Cursor | Employee job feed |

UI must respect Nest limits; never request unbounded lists.

---

## 8. Files and uploads

- Client validates MIME/size for UX only.
- Nest remains authoritative for accept/reject.
- Prefer Nest file metadata endpoints; do not proxy arbitrary binary through Next unless required for auth.

---

## 9. Cross-check notes (W0)

Reviewed against API_DESIGN, API_REVIEW, SECURITY, and Postman intent:

- Auth register → OTP → tokens path confirmed.
- Session helpers (`/auth/session`, `/admin/session`) exist for web restore.
- Welfare public detail by slug remains a known Nest gap.
- Error codes listed in SECURITY / API docs are the mapping source for W4+.
