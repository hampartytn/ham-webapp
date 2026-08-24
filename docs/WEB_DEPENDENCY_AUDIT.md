# Dependency audit notes (Phase W11)

Run from `ham-webapp`:

```bash
npm audit
```

Record date and findings here when preparing a release candidate.

**Policy:** Do not use `npm audit fix --force` to downgrade Next/React. Accept exceptions only with rationale (as with ham-backend Prisma pins).

### Initial W11 pass

- Date: 2026-08-24
- Command: `npm audit`
- Result: **0 vulnerabilities** reported
- Action: Re-run before each release; document high/critical exceptions below.

| Package | Severity | Decision |
| --- | --- | --- |
| _(none)_ | — | Clean audit at W11 complete |
