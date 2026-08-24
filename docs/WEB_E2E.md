# E2E smoke (Phase W10)

Optional Playwright smoke against local Nest + Next.

## Prerequisites

1. ham-backend running on `http://localhost:3000` with `LOG_LEVEL=debug`
2. ham-webapp `.env.local` with `HAM_API_BASE_URL` and `NEXT_PUBLIC_APP_URL`
3. `npm run dev` on port 3001

## Manual smoke (required minimum)

1. Open `http://localhost:3001/ta`
2. Register EMPLOYEE with E.164 phone + preferred language
3. Read mock OTP from Nest logs (`otp.mock`)
4. Verify OTP → land on `/ta/employee`
5. Open `/ta/employer` while EMPLOYEE → forbidden
6. Logout → login again

## Playwright (optional)

```bash
npx playwright install chromium
npx playwright test
```

Specs live under `e2e/` when added. Until then, use the manual smoke above.
