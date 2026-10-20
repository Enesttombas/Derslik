<!-- Moved from README.md (Enesttombas/Derslik), 2026-10-20. Kept as-is; the new README is a showcase. -->
<div align="center">

# Derslik

**A personal, mobile-first study platform: spaced repetition, a TikTok-style question feed, and course notes in one place.**

![Next.js 16](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers%20%2B%20D1%20%2B%20R2-F38020?logo=cloudflare&logoColor=white)
![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8)

<img src="docs/media/akis-mobil.gif" alt="Akış feed on a phone" width="300">
&nbsp;&nbsp;
<img src="docs/media/panel-masaustu.gif" alt="Desktop dashboard" width="560">

<sub>Full-quality clips: [`akis-mobil.mp4`](docs/media/akis-mobil.mp4) · [`panel-masaustu.mp4`](docs/media/panel-masaustu.mp4)</sub>

</div>

---

## Why it exists

University material arrives as slides and PDFs. Reading them is not learning them. Derslik turns a semester of courses into small, answerable cards, schedules each one with SM-2, and serves them in a feed you can swipe through on a bus.

## Features

| | |
|---|---|
| **Akış feed** | Full-screen, snap-scrolling cards. 295 curated questions (code reading, "what happens?", output prediction) for EBLG351 and EBLG359, with scope selector and instant answer reveal. |
| **Spaced repetition** | SM-2 scheduling. Rate recall 1–4; due cards surface on the dashboard. |
| **Course workspace** | Units, notes, PDF sources (R2), formula-friendly Markdown with KaTeX and Mermaid. |
| **Study chat** | Ask about the card or code in front of you. Any OpenAI-compatible endpoint; built-in mock answer when no key is set. |
| **Four themes** | Light, Dark, Sage (sepia) and Twilight, persisted per device. |
| **Installable** | PWA shell with offline fallback banner. |
| **Private by design** | Owner + invited allowlist, per-user data isolation. See [SECURITY.md](SECURITY.md). |

## Tour

<table>
<tr>
<td align="center"><img src="docs/media/m-panel.png" width="220"><br><sub>Dashboard</sub></td>
<td align="center"><img src="docs/media/m-kapsam.png" width="220"><br><sub>Scope picker</sub></td>
<td align="center"><img src="docs/media/m-kart1.png" width="220"><br><sub>Question card</sub></td>
<td align="center"><img src="docs/media/m-cevap.png" width="220"><br><sub>Answer + explanation</sub></td>
</tr>
<tr>
<td align="center"><img src="docs/media/m-koyu.png" width="220"><br><sub>Dark theme</sub></td>
<td align="center"><img src="docs/media/m-hata.png" width="220"><br><sub>Wrong-answer feedback</sub></td>
<td colspan="2" align="center"><img src="docs/media/d-panel.png" width="460"><br><sub>Desktop dashboard</sub></td>
</tr>
<tr>
<td colspan="2" align="center"><img src="docs/media/d-ders.png" width="380"><br><sub>Course view</sub></td>
<td colspan="2" align="center"><img src="docs/media/d-koyu-menu.png" width="380"><br><sub>Theme menu</sub></td>
</tr>
</table>

## Architecture

```
Browser (PWA, React 19)
   │  swipe / rate / ask
   ▼
Cloudflare Worker  ── vinext (Next.js 16 on Vite 8)
   ├─ proxy.ts            access gate: OWNER_EMAIL + ALLOWED_EMAILS
   ├─ app/api/*           cards · courses · feed · chat   (every query scoped by userId)
   ├─ D1 (SQLite)         study items, reviews, feed events  — Drizzle ORM
   ├─ R2                  uploaded PDFs
   └─ content/            curriculum, notes, Akış question bank (JSON, checked by `check-akis.mjs`)
```

## Run it locally

```bash
node -v            # >= 22.13
npm run install:ci
cp .dev.vars.example .dev.vars   # fill OWNER_EMAIL; CHAT_API_KEY is optional
npm run dev                      # http://localhost:5173
```

Open `/signin-with-chatgpt?return_to=/` for the simulated local sign-in. Build and preview the Worker with `npm run build && npm start`. Platform notes inherited from the starter are in [docs/STARTER-NOTES.md](docs/STARTER-NOTES.md).

### Checks

```bash
npm run lint
node scripts/check-akis.mjs         # question-bank schema + answers
node scripts/check-curriculum.mjs   # course/unit integrity
```

## Configuration

| Variable | Purpose |
|---|---|
| `OWNER_EMAIL` | Account allowed in; site returns 503 without it |
| `ALLOWED_EMAILS` | Optional comma-separated invitees |
| `CHAT_API_KEY` | Optional. Without it chat uses a local mock |
| `CHAT_API_BASE` / `CHAT_MODEL` | OpenAI-compatible endpoint and model |
| `CHAT_REASONING_EFFORT(_URET)` | `low` / `medium` / `high` |

## Repository layout

```
app/          routes + API handlers          components/   UI (akis/, study feed, themes)
db/ drizzle/  schema + migrations            content/      Akış bank, notes, assignments
lib/          SRS, scoring, helpers          scripts/      checks, dev proxies, exporters
public/odevler  image-processing coursework outputs (own work)
```

## Status

Personal project, actively used. Source is public for viewing; all rights reserved ([LICENSE](LICENSE)).
