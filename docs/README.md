# ham-webapp planning documents

This folder is the authoritative planning set for **ham-webapp**, the single Next.js web client for the HAM Job & Worker Welfare Platform.

These documents are the authoritative planning set. Phases **W0–W11** are complete.

Additional delivery notes:

- [WEB_SECURITY_HARDENING.md](WEB_SECURITY_HARDENING.md)
- [WEB_E2E.md](WEB_E2E.md)
- [WEB_RELEASE_CHECKLIST.md](WEB_RELEASE_CHECKLIST.md)
- [WEB_DEPENDENCY_AUDIT.md](WEB_DEPENDENCY_AUDIT.md)

| Document | Purpose |
| --- | --- |
| [WEB_PROJECT_PLAN.md](WEB_PROJECT_PLAN.md) | Product context, stack, decisions, non-goals, roadmap |
| [WEB_ARCHITECTURE.md](WEB_ARCHITECTURE.md) | Modular frontend, role sections, folder structure |
| [WEB_AUTH_STRATEGY.md](WEB_AUTH_STRATEGY.md) | BFF session bridge vs Nest Bearer tokens |
| [WEB_API_INTEGRATION.md](WEB_API_INTEGRATION.md) | Typed client, errors, endpoint map, gaps |
| [WEB_SECURITY.md](WEB_SECURITY.md) | XSS, tokens, PII, uploads, CSRF |
| [WEB_I18N.md](WEB_I18N.md) | Tamil / English / Hindi, catalogs, low-literacy UX |
| [WEB_IMPLEMENTATION_CHECKLIST.md](WEB_IMPLEMENTATION_CHECKLIST.md) | Sequential implementation sheet |

Backend authority: [../../ham-backend/docs/](../../ham-backend/docs/) — especially API_DESIGN, API_REVIEW, SECURITY, ARCHITECTURE.

**Stop condition:** Checklist W0–W11 complete. Wait for an explicit new instruction for further work.
