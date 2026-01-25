# 🚀 Guía de Deploy en Render

Esta guía te ayudará a desplegar tanto el **Backend** como el **Frontend** en Render.

---

## 📋 Tabla de Contenidos

1. [Backend en Render](#backend-en-render)
2. [Frontend en Render](#frontend-en-render)
3. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
4. [Verificación Post-Deploy](#verificación-post-deploy)
5. [Solución de Problemas](#solución-de-problemas)

---

## 🔧 Backend en Render

### 1. Crear el Web Service (Backend)

En Render → **New** → **Web Service**

#### Configuración Base

| Campo | Valor |
|-------|-------|
| **Name** | `stream-schedule-api` |
| **Language** | `Node` |
| **Environment** | `Production` |
| **Branch** | `development` (o `main` según tu flujo) |
| **Region** | `Frankfurt (EU Central)` |
| **Root Directory** | `backend` |
| **Instance Type** | `Free` (o `Starter` para mejor rendimiento) |

#### Build & Start Commands

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
node src/app.js
```

### 2. Environment Variables (Backend)

En Render → **Environment Variables**, agrega todas las variables necesarias:

```env
NODE_ENV=production
PORT=10000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
DATABASE_SSL=true
JWT_SECRET=tu-jwt-secret-super-seguro-aqui
SESSION_SECRET=tu-session-secret-super-seguro-aqui
ENCRYPTION_KEY=tu-32-caracteres-encryption-key
FRONTEND_URL=https://stream-schedule-frontend.onrender.com
BACKEND_URL=https://stream-schedule-api.onrender.com
GOOGLE_CLIENT_ID=tu-google-client-id
GOOGLE_CLIENT_SECRET=tu-google-client-secret
TWITCH_CLIENT_ID=tu-twitch-client-id
TWITCH_CLIENT_SECRET=tu-twitch-client-secret
STRIPE_SECRET_KEY=sk_live_tu-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_tu-webhook-secret
LOG_LEVEL=error
ENABLE_LOGGING=false
```

**⚠️ IMPORTANTE:**
- **NO** pongas `PORT` en las variables de entorno (Render lo inyecta automáticamente)
- La contraseña en `DATABASE_URL` debe estar **URL-codificada** (`!` → `%21`)
- Usa `DATABASE_SSL=true` para Supabase

### 3. Health Check (Opcional pero Recomendado)

**Health Check Path:**
```
/api/health
```

O crea un endpoint simple en tu backend:
```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

---

## 🎨 Frontend en Render

### 1. Crear el Web Service (Frontend)

En Render → **New** → **Web Service**

#### Configuración Base

| Campo | Valor |
|-------|-------|
| **Name** | `stream-schedule-frontend` |
| **Language** | `Node` |
| **Environment** | `Production` |
| **Branch** | `development` (o `main` según tu flujo) |
| **Region** | `Frankfurt (EU Central)` |
| **Root Directory** | `frontend` |
| **Instance Type** | `Free` |

#### Build & Start Commands

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npx serve -s build -l 10000
```

**⚠️ IMPORTANTE:**
- El flag `-s` en `serve` es **crítico** para SPAs (Single Page Applications)
- Sin `-s`, las rutas como `/login`, `/dashboard` darán 404 al refrescar
- El puerto `10000` es el que Render espera (no uses `3000`)
- Alternativamente, puedes usar: `./node_modules/.bin/serve -s build -l 10000` si `serve` está en devDependencies

### 2. Environment Variables (Frontend)

En Render → **Environment Variables**, agrega:

```env
REACT_APP_API_URL=https://stream-schedule-api.onrender.com
```

**⚠️ IMPORTANTE:**
- **TODAS** las variables de entorno del frontend **DEBEN** empezar con `REACT_APP_`
- Si no empiezan con `REACT_APP_`, React las ignorará
- No uses `localhost:5000` en producción

### 3. Instalar `serve` (Opcional)

Si `npx serve` no funciona, puedes agregar `serve` como dependencia:

```bash
cd frontend
npm install --save-dev serve
```

Y cambiar el Start Command a:
```bash
./node_modules/.bin/serve -s build -l 10000
```

---

## 🔐 Configuración de Variables de Entorno

### Backend

1. Ve a tu servicio en Render
2. **Settings** → **Environment Variables**
3. Agrega cada variable una por una
4. **NO** uses archivos `.env` en Render (usa el dashboard)

### Frontend

1. Ve a tu servicio en Render
2. **Settings** → **Environment Variables**
3. Agrega `REACT_APP_API_URL` con la URL de tu backend
4. Asegúrate de que empiece con `REACT_APP_`

---

## ✅ Verificación Post-Deploy

### 1. Verificar Backend

```bash
# Verificar que el backend responde
curl https://stream-schedule-api.onrender.com/api/health

# O en el navegador:
https://stream-schedule-api.onrender.com/api/health
```

### 2. Verificar Frontend

1. Abre la URL del frontend: `https://stream-schedule-frontend.onrender.com`
2. Abre **DevTools** → **Network**
3. Verifica que las requests van a:
   ```
   https://stream-schedule-api.onrender.com/api/...
   ```
4. **NO** deberías ver requests a `localhost:5000`

### 3. Verificar OAuth

1. Prueba login con Google/Twitch
2. Verifica que los callbacks funcionen
3. Asegúrate de que `BACKEND_URL` en el backend apunte a la URL de Render

---

## 🧯 Solución de Problemas

### Backend

#### ❌ Error: "Cannot find module"
**Solución:**
- Verifica que `Root Directory` sea `backend`
- Verifica que `package.json` esté en `backend/`

#### ❌ Error: "Database connection failed"
**Solución:**
- Verifica `DATABASE_URL` (debe estar URL-codificada)
- Verifica `DATABASE_SSL=true`
- Usa el script de diagnóstico: `node src/scripts/testDatabaseConnection.js`

#### ❌ Error: "Port already in use"
**Solución:**
- **NO** pongas `PORT` en las variables de entorno
- Render inyecta `PORT` automáticamente

### Frontend

#### ❌ Error: "react-scripts: not found"
**Solución:**
- Verifica que `package.json` tenga `react-scripts` en `dependencies`
- Build Command debe ser: `npm install && npm run build`

#### ❌ Pantalla blanca
**Solución:**
- Verifica `REACT_APP_API_URL` en Render
- Abre DevTools → Console para ver errores
- Verifica que la URL del backend sea correcta

#### ❌ 404 al refrescar página
**Solución:**
- Start Command debe ser: `npx serve -s build -l 10000`
- El flag `-s` es **obligatorio** para SPAs

#### ❌ Requests van a localhost
**Solución:**
- Verifica que `REACT_APP_API_URL` esté configurada en Render
- Verifica que empiece con `REACT_APP_`
- Rebuild el frontend después de cambiar variables

---

## 📝 Checklist Pre-Deploy

### Backend
- [ ] `DATABASE_URL` configurada y URL-codificada
- [ ] `DATABASE_SSL=true` configurado
- [ ] `JWT_SECRET` y `SESSION_SECRET` configurados
- [ ] `FRONTEND_URL` apunta a la URL de Render del frontend
- [ ] `BACKEND_URL` apunta a la URL de Render del backend
- [ ] OAuth credentials configuradas (Google, Twitch)
- [ ] Stripe keys configuradas (si aplica)
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install`
- [ ] Start Command: `node src/app.js`

### Frontend
- [ ] `REACT_APP_API_URL` configurada (empieza con `REACT_APP_`)
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Start Command: `npx serve -s build -l 10000`
- [ ] Código usa `process.env.REACT_APP_API_URL` (no `localhost`)

---

## 🔗 URLs de Ejemplo

Después del deploy, tendrás:

- **Backend:** `https://stream-schedule-api.onrender.com`
- **Frontend:** `https://stream-schedule-frontend.onrender.com`

Asegúrate de actualizar:
- `FRONTEND_URL` en el backend
- `BACKEND_URL` en el backend (para OAuth callbacks)
- `REACT_APP_API_URL` en el frontend

---

## 📚 Recursos Adicionales

- [Render Documentation](https://render.com/docs)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Supabase Connection Guide](./backend/SUPABASE_CONNECTION_GUIDE.md)

---

**¡Listo para deploy! 🚀**
