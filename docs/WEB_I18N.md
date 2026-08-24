# ham-webapp — Internationalization (i18n)

**Project name:** ham-webapp  
**Status:** Planning complete  
**Date:** 2026-08-24

Related: [WEB_ARCHITECTURE.md](WEB_ARCHITECTURE.md) · [WEB_API_INTEGRATION.md](WEB_API_INTEGRATION.md)

---

## 1. Decision D8 — next-intl with `ta` | `en` | `hi`

- **Decision:** Use **next-intl** for App Router locales Tamil, English, Hindi.
- **Why:** Mature App Router support; message catalogs; middleware locale detection patterns.
- **Alternatives:** next-i18next (Pages-oriented), custom JSON only, react-i18next SPA.
- **Trade-offs:** Locale-prefixed routes and middleware setup in W2.
- **Impact:** All user-facing strings go through message files; API `error.code` maps to keys.

Default language preference: respect user choice stored after language screen; catalog display falls back to `en` when a locale key is missing.

---

## 2. Locales

| Code | Language | Role |
| --- | --- | --- |
| `ta` | Tamil | Primary product language for TN workers |
| `en` | English | Fallback + admin/employer comfort |
| `hi` | Hindi | Supported v1 language |

Registration captures preferred language and sends it to Nest where the API accepts it. UI language can also be switched independently via next-intl (document sync strategy in W2: prefer Nest profile language when logged in).

---

## 3. Message organization (planned)

```
src/i18n/
  messages/
    en.json
    ta.json
    hi.json
  request.ts / routing.ts   # next-intl config
```

Namespaces (logical):

- `common` — actions, loading, empty, retry
- `auth` — register, OTP, login, password
- `errors` — keys matching Nest `error.code`
- `employee` / `employer` / `admin`
- `jobs` / `applications` / `membership` / `verification` / `legal`
- `comingSoon` — welfare and NOT_ENABLED surfaces

---

## 4. Catalog name resolution

Nest catalog entities expose locale maps (e.g. `names: { en, ta, hi }`).

**Rule:**

```
displayName = names[activeLocale] ?? names.en ?? firstAvailable ?? "—"
```

Same pattern for welfare `titles` / `bodies` if ever exposed; until then welfare remains Coming Soon.

Do **not** auto-translate free-text job titles or descriptions. Show author language as stored.

---

## 5. Error codes → messages

Map Nest codes to `errors.*` keys, including at least:

- `INVALID_CREDENTIALS`
- `INVALID_OR_EXPIRED_CODE`
- `CONFLICT`
- `ACCOUNT_SUSPENDED`
- `ACCOUNT_BLOCKED`
- `NOT_ENABLED`
- `VALIDATION_ERROR`
- `UNAUTHORIZED` / `FORBIDDEN` (if used)
- `NOT_FOUND`

Missing mapping → generic error string; log code in development.

---

## 6. Low-literacy UX notes (employee)

- Prefer short sentences and concrete verbs.
- Large tap targets; avoid dense jargon.
- OTP: show countdown from `expiresIn`; clear resend.
- Status badges with text, not color alone.
- Confirm destructive actions with plain language.
- Language picker early and always reachable.

Employer/admin UIs may be denser but still use the same locale system.

---

## 7. Formatting

- Use locale-aware date/number formatting (Intl or next-intl formatters).
- Phone display: E.164 from Nest; do not invent national formatting that corrupts the value on submit.

---

## 8. Non-goals

- Machine-translating job posts
- Per-role separate locale apps
- Shipping incomplete `ta`/`hi` catalogs with English-only employee critical paths at release (W11 gate: critical auth + employee strings complete in all three)
