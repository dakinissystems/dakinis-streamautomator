# StreamAutomator Web — Railway (producción)

## Qué hace este servicio

- **Build:** `npm run build` → carpeta `dist/`
- **Start:** `node scripts/serve-prod.mjs` — sirve `dist/` en `0.0.0.0:$PORT` (SPA con fallback `index.html`)
- **No** uses Vite dev (`npm run dev` / puerto **5173**) en producción.

Config en repo: [`railway.json`](./railway.json).

## Panel Railway (puerto)

**No** fijes **5173** ni otro puerto en Networking. Railway inyecta `PORT` al contenedor.

1. **Settings → Networking** — dominio `streamautomator.com` **sin** target port 5173 (automático / el del log).
2. Tras cambiar networking, **redeploy**.
3. En logs debe aparecer:
   ```
   [streamautomator-web] listening on http://0.0.0.0:XXXX
   ```
## Dónde está el puerto en código (no cambiar a 5173 en prod)

| Archivo | Qué hace |
|---------|----------|
| [`scripts/serve-prod.mjs`](./scripts/serve-prod.mjs) | `const port = Number(process.env.PORT \|\| 8080)` + `listen(port, '0.0.0.0')` — **esto es prod** |
| [`package.json`](./package.json) | `"start": "node scripts/serve-prod.mjs"` |
| [`railway.json`](./railway.json) | `startCommand`: `node scripts/serve-prod.mjs` |
| `vite` / `npm run dev` | Solo local; Vite usa 5173 en dev — **no** es el start de Railway |

No hace falta `PORT=5173` en variables Railway.

## Dominios

| Dominio | Servicio |
|---------|----------|
| `streamautomator.com` | **Este frontend** (static) |
| `api.dakinissystems.com/streamautomator/` | **API** (`api.streamautomator.com` vía gateway) |

El gateway **no** debe apuntar rutas `/streamautomator/api/*` al frontend.

## Variables build (Vite)

Se hornean en el build — cambiar en Railway y **redeploy**:

- `VITE_SENTRY_DSN`
- `VITE_API_URL` (o la variable que use el proyecto para la API)

## Verificación

```bash
curl -i https://streamautomator.com/
# Debe ser 200 HTML (index), no "train has not arrived"

# Logs Railway:
# [streamautomator-web] PORT=... → listening on ...
```

## API (otro servicio)

Backend: `apps/api` — `railway.json` con health `/api/health`. Debe escuchar `process.env.PORT` (ya en `app.js`).
