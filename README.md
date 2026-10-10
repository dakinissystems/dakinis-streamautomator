[Español](README.md) · [English](README.en.md)

# StreamAutomator

Plataforma para **programar y gestionar** el contenido de streamers y creadores (calendario, multimedia, página pública, bots, licencias). Producto de [Dakinis Systems](https://github.com/dakinissystems).

| | |
|---|---|
| **App** | https://streamautomator.com |
| **Repo** | [dakinis-streamautomator](https://github.com/dakinissystems/dakinis-streamautomator) |
| **Versión** | 2.4.0 (`package.json`) |
| **Docs de usuario** | [`docs/README.md`](docs/README.md) |
| **Estado ecosistema** | [STATUS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/STATUS.md) |

---

## Disponible vs planificado

| Estado | Capacidad |
|--------|-----------|
| **Disponible** | Calendario / programación de contenido, página pública y embed, multimedia, OAuth Google/Twitch, licencias y admin, Nightbot `!todo`, bits panel, overlays, i18n ES/EN, Stripe para licencias (según config) |
| **Con límites** | Integraciones Discord / X / Twitch para *publicar*: requieren tokens y OAuth bien configurados en el entorno; no “plug and play” sin secretos |
| **En desarrollo** | Publicación automática multi-red genérica, YouTube/TikTok, analíticas avanzadas, equipos, API pública de terceros |

> Programar en el calendario **no** implica que todas las redes publiquen solas. La automatización de publicación por plataforma está en roadmap o depende de bots/tokens.

---

## Estructura

```text
apps/api/     Backend Express (API, worker, scheduler)
apps/web/     Frontend React
docs/         Guías de usuario y legal
.env.example  Plantilla API + web
```

---

## Local

Requisitos: Node.js 20+, Postgres o SQLite, cuentas Supabase/Stripe según features.

```bash
npm run install:all
cp .env.example apps/api/.env
cp .env.example apps/web/.env
```

```bash
npm run dev:api
npm run dev:web
```

| Comando | Uso |
|---------|-----|
| `npm run install:all` | Dependencias api + web |
| `npm run dev:api` | API |
| `npm run dev:web` | Web (p. ej. http://localhost:3000) |

---

## Despliegue

- **Producto canónico:** https://streamautomator.com  
- **Infra del ecosistema Dakinis:** Railway + Cloudflare ([OPERATIONS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/OPERATIONS.md)).  
- Si un servicio concreto sigue en **Render** (root directory `apps/api`), trátarlo como despliegue de ese servicio y alinea `FRONTEND_URL` / `BACKEND_URL` / OAuth con el dominio real — no como la norma de toda la plataforma.

Variables críticas: `.env.example`. OAuth (redirect URIs) detallado en [`docs/`](docs/) y secciones históricas del README EN si aplica.

---

## Seguridad (controles, no garantías absolutas)

- Validación de entrada con **Joi** (reduce datos malformados; no sustituye escaping XSS en el cliente)
- Consultas parametrizadas / ORM donde aplica
- JWT, rate limiting, logging estructurado (Winston)
- Secretos solo en el entorno de despliegue

---

## Changelog

Historial de versiones y cambios internos → releases de GitHub / notas en `docs/`. El README prioriza uso actual (v2.4.0).

---

## Licencia

Copyright © 2024-2026 Dakinis Systems. Software propietario — ver [LICENSE](LICENSE).

## Docs canónicas (ecosistema)

Estado → [STATUS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/STATUS.md) ·
Mapa → [SYSTEMS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/SYSTEMS.md) ·
Ops → [OPERATIONS](https://github.com/dakinissystems/dakinis-systems/blob/main/docs/OPERATIONS.md) ·
Índice → [docs](https://github.com/dakinissystems/dakinis-systems/tree/main/docs)
