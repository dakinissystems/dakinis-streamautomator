# StreamAutomator Web — Railway (producción)

## Qué hace este servicio

- **Build:** `npm run build` → carpeta `dist/`
- **Start:** `node scripts/serve-prod.mjs` — sirve `dist/` en `0.0.0.0:$PORT` (SPA con fallback `index.html`)
- **No** uses Vite dev (`npm run dev` / puerto **5173**) en producción.

Config en repo: [`railway.json`](./railway.json).

## Panel Railway — obligatorio tras deploy

1. **Settings → Networking → Public Networking**
2. **Quitar puerto fijo 5173.** Railway debe enrutar al **`PORT`** que inyecta el runtime (no al puerto de Vite dev).
3. Si pide “Target port”, déjalo en automático o el que muestre el log:
   ```
   [streamautomator-web] listening on http://0.0.0.0:XXXX
   ```
4. **Redeploy** después de cambiar el puerto.

## Dominios

| Dominio | Servicio |
|---------|----------|
| `streamautomator.com` | **Este frontend** (static) |
| `api.dakinissystems.com/streamautomator/` | **API** (`streamautomator-api` / `dakinis-streamautomator-production`) |

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
