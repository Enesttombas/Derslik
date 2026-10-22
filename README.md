<p align="center"><img src="docs/media/banner.png" width="100%" alt="Derslik: a mobile-first study platform with spaced repetition and a swipe question feed"></p>
<p align="center"><b>English</b> · <a href="README.tr.md">Türkçe</a></p>

Derslik turns a semester of university slides and PDFs into small answerable cards, schedules them with SM-2 spaced repetition, and serves them in a TikTok-style feed you can swipe on a phone. It is a personal project, built for one student and a short invite list.

<p align="center"><img src="docs/media/akis-mobil.gif" width="300" alt="The Akış feed on a phone: swipe between question cards">
&nbsp;&nbsp;
<img src="docs/media/panel-masaustu.gif" width="540" alt="Desktop dashboard with course cards"></p>

## What it does

**Akış, a swipe feed of questions.** Full-screen snap-scrolling cards: read code, predict output, find the bug, answer exam-style questions. 295 cards for EBLG351 (image processing) and EBLG359 (algorithm analysis), with a scope picker and instant answer reveal.

<p align="center"><img src="docs/media/m-kart1.png" width="200" alt="A hata-bul card: tap the wrong line of Python code">
<img src="docs/media/m-cevap.png" width="200" alt="Answer and explanation view">
<img src="docs/media/m-hata.png" width="200" alt="Wrong-answer feedback"></p>

**Spaced repetition.** Rate recall 1 to 4. `app/api/reviews/route.ts` updates each card's interval and ease factor; due cards show up on the dashboard.

**Course workspace and study chat.** Units, notes and PDF sources (stored in R2), Markdown with KaTeX and Mermaid. Chat works with any OpenAI-compatible endpoint and falls back to a local mock answer when no key is set.

<p align="center"><img src="docs/media/d-ders.png" width="420" alt="Course view on desktop">
<img src="docs/media/d-koyu-menu.png" width="420" alt="Theme menu on desktop in dark mode"></p>

Four themes (Light, Dark, Sage, Twilight), an installable PWA shell, and an owner plus invitee allowlist with per-user data isolation ([SECURITY.md](SECURITY.md)).

## How it works

<p align="center"><img src="docs/media/architecture.svg" width="860" alt="Architecture: browser to Worker to API routes, content, D1, R2 and chat endpoint"></p>

- The app runs on Cloudflare Workers through vinext (Next.js 16 on Vite 8).
- `proxy.ts` is the access gate (`OWNER_EMAIL`, `ALLOWED_EMAILS`); the site returns 503 without an owner.
- Route handlers in `app/api/*` scope every query by `userId`. Study data lives in D1 through Drizzle (`db/schema.ts`); uploaded PDFs live in R2.
- The Akış bank is plain JSON in `content/akis/`, validated by `scripts/check-akis.mjs`.

## Numbers

<p align="center"><img src="docs/media/akis-bank.svg" width="860" alt="Bar chart of 295 Akış cards by type and course"></p>

Measured on 2026-10-20 (Windows 11, Node v24.18.0). Raw data is in [`docs/media/data/`](docs/media/data/).

| Command | Exit code | Result |
|---|---|---|
| `node scripts/check-akis.mjs` | 0 | 15 packages, 295 cards, 0 errors |
| `node --test lib/*.test.ts` | 0 | 48 tests, 48 pass, 0 fail (about 0.4 s) |
| `npm run lint` | 0 | 0 errors, 6 warnings |
| `npm run build` | 0 | Worker and client bundle built |
| `node scripts/akis-stats.mjs` | 0 | Source of the chart above |

## Quick start

```bash
node -v                          # >= 22.13
npm run install:ci
cp .dev.vars.example .dev.vars   # set OWNER_EMAIL; CHAT_API_KEY is optional
npm run dev                      # http://localhost:5173
```

Open `/signin-with-chatgpt?return_to=/` for the simulated local sign-in. To build and preview the Worker locally: `npm run build && npm start`. Starter platform notes and the original technical README are in [docs/NOTES.md](docs/NOTES.md) and [docs/STARTER-NOTES.md](docs/STARTER-NOTES.md).

## Usage

Sign in, pick a course on the dashboard, and open **Akış**. Swipe up for the next card, tap a line or an option to answer, and rate your recall so the card comes back at the right time.

| Variable | Purpose |
|---|---|
| `OWNER_EMAIL` | Account allowed in |
| `ALLOWED_EMAILS` | Optional comma-separated invitees |
| `CHAT_API_KEY` | Optional; without it chat uses a local mock |
| `CHAT_API_BASE` / `CHAT_MODEL` | OpenAI-compatible endpoint and model |
| `CHAT_REASONING_EFFORT(_URET)` | `low`, `medium` or `high` |

## Limits

- Personal project: no public hosted demo, no sign-up. The source is public for viewing.
- The Akış bank covers two courses only (EBLG351, EBLG359). The other four courses have notes but no Akış cards.
- `scripts/check-curriculum.mjs` currently fails because the EBLG351.1 notes yield 0 curriculum questions; EBLG351 is served from the Akış bank instead.
- There is no `npm test` script yet; unit tests run with `node --test lib/*.test.ts`.
- Real chat answers and production deployment need your own API key and Cloudflare account; neither was exercised for this README.

## License

All rights reserved. See [LICENSE](LICENSE).

Older technical notes: [docs/NOTES.md](docs/NOTES.md)
