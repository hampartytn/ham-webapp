# ham-webapp

**Status:** Phases **W0–W11** complete (release-candidate scaffolding)  
**Stack:** Next.js 16.3.2 · React 19 · TypeScript · Tailwind 4 · next-intl · TanStack Query · BFF cookies

One Next.js app for HAM (Tamil Nadu Job & Worker Welfare). Talks to **ham-backend** only via same-origin BFF (`/api/auth/*`, `/api/proxy/*`). Tokens stay HttpOnly — never in `localStorage`.

## Run locally

```bash
# Terminal A — Nest (see ham-backend README)
# port 3000; mock OTP → Nest warn banner + ham-backend/logs/mock-otp.log

# Terminal B — Web
cd ham-webapp
cp .env.example .env.local   # if needed
npm install
npm run dev                  # http://localhost:3001  →  /ta
```

| Env | Purpose |
| --- | --- |
| `HAM_API_BASE_URL` | Server-only Nest base, default `http://localhost:3000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Public origin for CSRF allowlist, default `http://localhost:3001` |

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev on **3001** |
| `npm run build` / `start` | Production |
| `npm run lint` / `typecheck` / `test` | Quality gates |
| `npm run format` | Prettier |

### Auth smoke

1. Register at `/ta/register` (E.164 phone)
2. Copy OTP from Nest terminal (`MOCK OTP` banner) or `ham-backend/logs/mock-otp.log`
3. Verify OTP → role home
4. Wrong role path → `/forbidden`

## Docs

| Doc | Topic |
| --- | --- |
| [docs/README.md](docs/README.md) | Planning index |
| [docs/WEB_IMPLEMENTATION_CHECKLIST.md](docs/WEB_IMPLEMENTATION_CHECKLIST.md) | W0–W11 tasks |
| [docs/WEB_SECURITY_HARDENING.md](docs/WEB_SECURITY_HARDENING.md) | Headers, CSRF, cookies |
| [docs/WEB_E2E.md](docs/WEB_E2E.md) | Manual / Playwright smoke |
| [docs/WEB_RELEASE_CHECKLIST.md](docs/WEB_RELEASE_CHECKLIST.md) | Prod env + honest gaps |
| [docs/WEB_DEPENDENCY_AUDIT.md](docs/WEB_DEPENDENCY_AUDIT.md) | `npm audit` notes |

## Honest Nest gaps (do not fake)

- Welfare detail HTTP → Coming soon
- Membership withdraw → `NOT_ENABLED`
- Payments may be `NOT_ENABLED` (does **not** gate job posting)
- Legal = provider directory (no employee case API)
- Mock KYC complete only when Nest allows (non-prod)
