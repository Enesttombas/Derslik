# Security

This repository is **private** and holds a personal study platform. Nothing here is a
service for third parties.

## Model

- **Access gate** (`proxy.ts`): every page and `/api/*` request needs the
  `oai-authenticated-user-email` header injected by the hosting platform's sign-in.
  Only `OWNER_EMAIL` and the optional `ALLOWED_EMAILS` list pass; all others get 403,
  anonymous API calls get 401. Without `OWNER_EMAIL` the site refuses to serve (503).
- **Per-user isolation**: every API route filters on `userId` from the platform header
  (never from client input). Cards, courses, reviews, feed events and PDFs are scoped to it.
- **Secrets**: only via Cloudflare secrets / `.dev.vars` (gitignored). `.dev.vars.example`
  lists the names. The chat route reads `CHAT_API_KEY` server-side only and falls back to
  a mock when unset. No key is shipped to the browser.
- **Dev-only auth**: the simulated sign-in works for loopback development requests only and
  is stripped from production builds. `scripts/local-auth-proxy.mjs`, `tailnet-proxy.cjs`
  and `tunel-proxy.cjs` inject a fixed test identity (`owner@derslik.test`); **never expose
  them to an untrusted network**.
- **Chat prompt hygiene**: note/code context is passed as data with an instruction not to
  follow directives inside it.
- **Out of the repo on purpose**: university syllabi, generated study-guide PDFs,
  agent working notes and local logs.

## Before making this repo public

1. Rotate any key that ever lived in a `.dev.vars` on a shared machine.
2. Re-run a secret scan (`trufflehog git file://. --only-verified`).
3. Review `public/odevler` (own coursework outputs) and `content/` for material you do not
   want public.
4. Decide on a licence; the current `LICENSE` is all-rights-reserved.

## Reporting

Owner: Enes Tombas. Open a private issue or contact the owner directly.
