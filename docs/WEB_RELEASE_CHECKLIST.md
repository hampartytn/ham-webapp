# Production environment checklist (Phase W11)

Hosting target may remain **TBD**. Before production traffic:

- [ ] HTTPS terminated (reverse proxy / platform)
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` = public https origin (CSRF allowlist)
- [ ] `HAM_API_BASE_URL` points at Nest `/api/v1` (server-only)
- [ ] Nest `CORS_ORIGINS` includes the web origin
- [ ] Auth cookies use `Secure` (automatic when `NODE_ENV=production`)
- [ ] Nest SMS/KYC/payments/storage providers configured or left honestly disabled (`NOT_ENABLED` / Coming soon)
- [ ] Admin bootstrap is ops-only (not open registration)
- [ ] Swagger disabled or protected in production

## Honest product gaps (must remain honest)

- Welfare scheme HTTP detail: Coming soon page only
- Membership withdraw: Nest returns `NOT_ENABLED`
- Payments: may return `NOT_ENABLED`; **must not** gate employer job posting
- Identity: mock complete only in non-prod Nest rules
- Legal: provider directory only (no employee “case create” API)
