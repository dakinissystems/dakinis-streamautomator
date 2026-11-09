[Español](README.md) · [English](README.en.md)

# StreamAutomator

Platform to **schedule and manage** content for streamers and creators (calendar, media, public page, bots, licenses). A product of [Dakinis Systems](https://github.com/dakinissystems).

| | |
|---|---|
| **App** | https://streamautomator.com |
| **Repo** | [dakinis-streamautomator](https://github.com/dakinissystems/dakinis-streamautomator) |
| **Version** | 2.4.0 (`package.json`) |
| **User docs** | [`docs/README.md`](docs/README.md) |
| **Ecosystem status** | [STATUS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/STATUS.md) |

---

## Available vs planned

| State | Capability |
|--------|-----------|
| **Available** | Content calendar, public page and embed, media, Google/Twitch OAuth, licenses and admin, Nightbot `!todo`, bits panel, overlays, ES/EN, Stripe for licenses (when configured) |
| **Limited** | Discord / X / Twitch *publishing* needs tokens and OAuth in that environment. It is not plug-and-play without secrets |
| **In development** | Generic multi-network auto-publish, YouTube/TikTok, advanced analytics, teams, a public third-party API |

> Putting an item on the calendar does **not** mean every network publishes it. Per-platform publishing is on the roadmap or depends on bots and tokens.

---

## Layout

```text
apps/api/     Express backend (API, worker, scheduler)
apps/web/     React frontend
docs/         User guides and legal copies
.env.example  API + web template
```

---

## Local

Requirements: Node.js 20+, Postgres or SQLite, and Supabase/Stripe accounts for the features that need them.

```bash
npm run install:all
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

```bash
npm run dev:api
npm run dev:web
```

| Command | Use |
|---------|-----|
| `npm run install:all` | Install api + web dependencies |
| `npm run dev:api` | API |
| `npm run dev:web` | Web (for example http://localhost:3000) |

---

## Deploy

- **Canonical product:** https://streamautomator.com
- **Dakinis infrastructure:** Railway + Cloudflare ([OPERATIONS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/OPERATIONS.md)).
- If one service is still on **Render** (root directory `apps/api`), treat that as that service's deploy. Align `FRONTEND_URL`, `BACKEND_URL`, and OAuth with the real domain. It is not the rule for the whole platform.

Critical variables: `.env.example`.

---

## Security (controls, not absolute guarantees)

- Input validation with **Joi** (rejects malformed data; it does not replace client-side XSS escaping)
- Parameterized queries / ORM where used
- JWT, rate limiting, structured logging (Winston)
- Secrets only in the deploy environment

---

## Changelog

Version history lives in GitHub releases and `docs/`. This README describes current use (v2.4.0).

---

## License

Copyright © 2024-2026 Dakinis Systems. Proprietary software — see [LICENSE](LICENSE).

## Ecosystem docs

Files in `docs/legal/` are the product copy. The platform base is [dakinis-systems/docs/legal](https://github.com/dakinissystems/dakinis-systems/tree/main/docs/legal). A policy change has to land in both places.

Status → [STATUS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/STATUS.md) ·
Map → [SYSTEMS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/SYSTEMS.md) ·
Ops → [OPERATIONS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/OPERATIONS.md) ·
Index → [docs](https://github.com/dakinissystems/dakinis-systems/tree/main/docs)
