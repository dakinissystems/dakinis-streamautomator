# Documentación del Sistema - Streamer Scheduler

## Índice
1. [Visión General](#visión-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Flujo de Funcionamiento](#flujo-de-funcionamiento)
5. [Componentes Principales](#componentes-principales)
6. [Base de Datos](#base-de-datos)
7. [Autenticación y Seguridad](#autenticación-y-seguridad)
8. [Publicación de Contenido](#publicación-de-contenido)
9. [Almacenamiento de Archivos](#almacenamiento-de-archivos)
10. [Sistema de Licencias](#sistema-de-licencias)

---

## Visión General

**Streamer Scheduler** es una plataforma web completa para programar y gestionar contenido en múltiples plataformas sociales (Twitch, Twitter/X, Instagram, Discord) desde un solo lugar. El sistema permite a creadores de contenido y streamers organizar sus publicaciones mediante una interfaz de calendario visual y automatizar la publicación en diferentes plataformas.

### Características Principales
- ✅ Programación multiplataforma
- ✅ Calendario visual con arrastrar y soltar
- ✅ Sistema de licencias (Trial, Mensual, Trimestral, Permanente)
- ✅ Panel de administración
- ✅ Autenticación OAuth (Google, Twitch, Discord, Twitter)
- ✅ Integración de pagos con Stripe
- ✅ Subida segura de archivos multimedia
- ✅ Soporte multiidioma (Español/Inglés)
- ✅ Publicación automática programada

---

## Arquitectura del Sistema

El sistema sigue una arquitectura **cliente-servidor** con separación clara entre frontend y backend:

```
┌─────────────────┐
│   Frontend      │  React SPA (Single Page Application)
│   (React)       │  - Interfaz de usuario
│                 │  - Gestión de estado local
│                 │  - Comunicación con API REST
└────────┬────────┘
         │ HTTP/REST API
         │ JWT Authentication
┌────────▼────────┐
│   Backend       │  Node.js + Express
│   (API REST)    │  - Lógica de negocio
│                 │  - Autenticación
│                 │  - Programación de contenido
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    │         │          │          │
┌───▼───┐ ┌──▼───┐ ┌────▼────┐ ┌──▼────┐
│Supabase│ │Stripe│ │PostgreSQL│ │Discord│
│Storage │ │Payments│ │Database │ │API   │
└────────┘ └──────┘ └─────────┘ └───────┘
```

### Separación de Responsabilidades

- **Frontend**: Interfaz de usuario, validación de formularios, visualización de datos
- **Backend**: Validación de datos, lógica de negocio, comunicación con APIs externas
- **Base de Datos**: Almacenamiento persistente de usuarios, contenido, licencias
- **Supabase Storage**: Almacenamiento de archivos multimedia (imágenes, videos)
- **Servicios Externos**: Stripe (pagos), Discord API, Twitter API

---

## Tecnologías Utilizadas

### Frontend

#### Framework y Librerías Core
- **React 18.2**: Framework principal para la interfaz de usuario
- **React Router DOM 6.8**: Navegación y enrutamiento de la aplicación
- **React Scripts 5.0**: Herramientas de desarrollo y build (Create React App)

#### Estilos y UI
- **Tailwind CSS 3.2**: Framework de utilidades CSS para diseño responsive
- **PostCSS**: Procesamiento de CSS
- **Autoprefixer**: Compatibilidad de prefijos CSS

#### Componentes y Utilidades
- **React Big Calendar 1.19**: Componente de calendario para visualizar contenido programado
- **React Hot Toast 2.5**: Sistema de notificaciones toast
- **React Joyride 2.9**: Tours guiados para onboarding
- **Lucide React 0.263**: Librería de iconos moderna
- **Date-fns 2.30**: Utilidades para manipulación de fechas

#### Comunicación y Estado
- **Axios 1.3**: Cliente HTTP para comunicación con la API
- **Supabase JS 2.93**: Cliente para almacenamiento de archivos y autenticación OAuth

#### Internacionalización
- **Context API**: Sistema de traducción personalizado (Español/Inglés)

### Backend

#### Runtime y Framework
- **Node.js**: Entorno de ejecución JavaScript
- **Express 4.18**: Framework web minimalista y flexible
- **ES Modules**: Sistema de módulos ES6 (type: "module")

#### Base de Datos y ORM
- **PostgreSQL**: Base de datos principal (Supabase)
- **SQLite3 5.1**: Base de datos para desarrollo local
- **Sequelize 6.28**: ORM para interacción con la base de datos
- **Sequelize CLI 6.6**: Herramientas de migración

#### Autenticación y Seguridad
- **Passport 0.7**: Middleware de autenticación
- **Passport Google OAuth20 2.0**: Estrategia OAuth para Google
- **Passport Discord 0.1**: Estrategia OAuth para Discord
- **Passport Twitch 1.0**: Estrategia OAuth para Twitch
- **JSON Web Token (JWT) 9.0**: Tokens de autenticación
- **Bcryptjs 2.4**: Hash de contraseñas
- **Helmet 8.1**: Seguridad HTTP headers
- **Express Rate Limit 7.5**: Protección contra ataques de fuerza bruta
- **CORS 2.8**: Configuración de Cross-Origin Resource Sharing

#### Validación y Procesamiento
- **Joi 18.0**: Validación de esquemas de datos
- **Multer 2.0**: Manejo de archivos multipart/form-data
- **Sharp 0.34**: Procesamiento y optimización de imágenes
- **Form-data 4.0**: Construcción de formularios multipart

#### Procesamiento de Video
- **FFmpeg.wasm 0.13**: Procesamiento de video en el navegador/servidor
  - `@ffmpeg.wasm/core-mt`: Core con soporte multi-thread
  - `@ffmpeg.wasm/main`: Interfaz principal

#### Pagos
- **Stripe 20.2**: Integración de pagos y suscripciones

#### Logging y Monitoreo
- **Winston 3.19**: Sistema de logging estructurado
- **Winston Daily Rotate File 5.0**: Rotación diaria de logs

#### Utilidades
- **Axios 1.13**: Cliente HTTP para APIs externas
- **Dotenv 16.6**: Gestión de variables de entorno
- **PG 8.8**: Cliente PostgreSQL nativo

#### Testing (DevDependencies)
- **Vitest 1.0**: Framework de testing
- **Vitest UI 1.0**: Interfaz visual para tests

#### Opcionales (OptionalDependencies)
- **Bull 4.16**: Sistema de colas para trabajos en background
- **Ioredis 5.9**: Cliente Redis para colas
- **Socket.io 4.8**: WebSockets para notificaciones en tiempo real
- **Swagger JSDoc 6.2**: Documentación de API
- **Swagger UI Express 5.0**: Interfaz Swagger para documentación

### Infraestructura y Servicios Externos

- **Supabase**: 
  - Base de datos PostgreSQL
  - Almacenamiento de archivos (Storage)
  - Autenticación OAuth (Google, Twitch)
- **Stripe**: Procesamiento de pagos y gestión de suscripciones
- **Discord API**: Publicación de contenido en canales de Discord
- **Twitter/X API v2**: Publicación de tweets
- **Render**: Hosting y despliegue (producción)

---

## Flujo de Funcionamiento

### 1. Autenticación de Usuario

#### OAuth con Google/Twitch (vía Supabase)
```
Usuario → Frontend → Supabase OAuth → Callback → Backend → JWT Token → Frontend
```

1. Usuario hace clic en "Iniciar sesión con Google/Twitch"
2. Frontend redirige a Supabase Auth
3. Supabase maneja el flujo OAuth con el proveedor
4. Supabase redirige de vuelta con `access_token` en el hash de la URL
5. Frontend extrae el token y lo envía al backend (`/api/user/google-login`)
6. Backend verifica el token con Supabase y crea/actualiza el usuario
7. Backend genera un JWT y lo devuelve al frontend
8. Frontend almacena el JWT y lo usa en todas las peticiones

#### OAuth con Discord/Twitter (vía Backend Passport)
```
Usuario → Backend → Discord/Twitter OAuth → Callback → Backend → JWT Token → Frontend
```

1. Usuario hace clic en "Iniciar sesión con Discord/Twitter"
2. Frontend redirige al backend (`/api/user/auth/discord` o `/api/user/auth/twitter`)
3. Backend inicia el flujo OAuth con Passport
4. Proveedor redirige al callback del backend
5. Backend crea/actualiza el usuario y genera JWT
6. Backend redirige al frontend con token en query params
7. Frontend extrae el token y lo almacena

### 2. Creación de Contenido Programado

```
Usuario → Formulario → Validación Frontend → API POST /api/content → Validación Backend → Base de Datos
```

1. Usuario completa el formulario en `/schedule`
2. Frontend valida los datos localmente
3. Frontend envía POST a `/api/content` con:
   - Título y contenido
   - Plataformas seleccionadas
   - Fecha y hora programada (ISO string UTC)
   - Archivos multimedia (referencias a Supabase Storage)
   - Configuración de Discord (si aplica)
4. Backend valida con esquemas Joi
5. Backend verifica licencia del usuario
6. Backend crea registro en base de datos con estado `SCHEDULED`
7. Si hay recurrencia, se crean múltiples registros
8. Backend responde con el contenido creado

### 3. Publicación Automática

```
Scheduler (cada minuto) → Consulta BD → Contenido Due → Publica en Plataformas → Actualiza Estado
```

1. **Scheduler** se ejecuta cada minuto (`startScheduler()`)
2. Consulta contenido con `scheduledFor <= now` y estado `SCHEDULED`
3. Para cada contenido due:
   - **Twitter/X**: 
     - Obtiene `twitterAccessToken` del usuario
     - Llama a `postTweet()` con el texto
     - Actualiza estado a `PUBLISHED` o `FAILED`
   - **Discord**:
     - Resuelve URLs de archivos multimedia (signed URLs de Supabase)
     - Publica título, contenido y archivos en el canal
     - Actualiza estado a `PUBLISHED` o `FAILED`
   - **Otras plataformas**: Marcadas como `PUBLISHED` (sin API aún)

### 4. Subida de Archivos Multimedia

```
Usuario → Selecciona Archivo → Frontend → Supabase Storage → URL → Backend → Base de Datos
```

1. Usuario selecciona archivo en `/media` o `/schedule`
2. Frontend sube directamente a Supabase Storage (bucket `images` o `videos`)
3. Supabase devuelve `file_path` y URL pública
4. Frontend envía referencia al backend al crear contenido
5. Backend almacena `file_path` en el campo `files` (JSONB)
6. Al publicar, el scheduler genera signed URLs temporales desde `file_path`

---

## Componentes Principales

### Frontend

#### Páginas (`src/pages/`)
- **Login.js**: Autenticación con múltiples proveedores OAuth
- **Dashboard.js**: Vista principal del usuario con estadísticas
- **Schedule.js**: Formulario para crear contenido programado
- **Templates.js**: Gestión de plantillas de contenido reutilizables
- **MediaUpload.js**: Subida y gestión de archivos multimedia
- **Settings.js**: Configuración de usuario y conexión de plataformas
- **Profile.js**: Perfil del usuario
- **AdminDashboard.js**: Panel de administración (solo admins)

#### Componentes (`src/components/`)
- **ContentPreview.js**: Vista previa del contenido antes de publicar
- **FileUpload.js**: Componente para subida de archivos
- **MediaGallery.js**: Galería de archivos multimedia
- **OnboardingTour.js**: Tour guiado para nuevos usuarios
- **SearchAdvanced.js**: Búsqueda avanzada de contenido
- **TrialWarning.js**: Advertencia para usuarios en trial

#### Utilidades (`src/utils/`)
- **api.js**: Cliente Axios configurado con interceptores
- **auth.js**: Utilidades de autenticación
- **supabaseClient.js**: Cliente Supabase para frontend
- **dateUtils.js**: Utilidades para manejo de fechas
- **platformColors.js**: Colores por plataforma
- **themeUtils.js**: Gestión de temas (claro/oscuro)
- **websocket.js**: Conexión WebSocket (opcional)

#### Contextos (`src/contexts/`)
- **LanguageContext.js**: Contexto para internacionalización
- **authStore.js**: Store de autenticación (Context API)

### Backend

#### Rutas (`src/routes/`)
- **user.js**: Autenticación, registro, perfil, OAuth
- **content.js**: CRUD de contenido programado
- **templates.js**: Gestión de plantillas
- **platforms.js**: Información de plataformas
- **payments.js**: Integración con Stripe
- **uploads.js**: Endpoints para estadísticas de uploads
- **discord.js**: Endpoints específicos de Discord (guilds, channels)
- **health.js**: Health check del servidor

#### Servicios (`src/services/`)
- **scheduler.js**: Motor de publicación automática (ejecuta cada minuto)
- **contentService.js**: Lógica de negocio para contenido
- **templateService.js**: Lógica de negocio para plantillas
- **queueService.js**: Sistema de colas para trabajos en background (opcional)
- **twitchService.js**: Integración con Twitch API
- **websocketService.js**: Servicio WebSocket para notificaciones (opcional)

#### Middleware (`src/middleware/`)
- **auth.js**: Autenticación JWT (`authenticateToken`, `requireAuth`)
- **checkLicense.js**: Verificación de licencias activas
- **rateLimit.js**: Rate limiting por tipo de endpoint
- **csrf.js**: Protección CSRF
- **validate.js**: Validación de requests con Joi
- **audit.js**: Logging de auditoría

#### Modelos (`src/models/`)
- **index.js**: Definición de modelos Sequelize (User, Content, Platform, License, Payment, etc.)
- **AuditLog.js**: Modelo para logs de auditoría
- **ContentTemplate.js**: Modelo para plantillas de contenido

#### Validadores (`src/validators/`)
- **contentSchemas.js**: Esquemas Joi para validación de contenido
- **userSchemas.js**: Esquemas Joi para validación de usuarios
- **paymentSchemas.js**: Esquemas Joi para validación de pagos
- **uploadSchemas.js**: Esquemas Joi para validación de uploads

#### Utilidades (`src/utils/`)
- **logger.js**: Configuración de Winston logger
- **supabaseClient.js**: Cliente Supabase para backend (Service Role)
- **discordPublish.js**: Funciones para publicar en Discord
- **twitterPublish.js**: Funciones para publicar en Twitter/X
- **authUtils.js**: Utilidades de autenticación
- **licenseUtils.js**: Utilidades para gestión de licencias
- **cryptoUtils.js**: Utilidades criptográficas
- **sanitize.js**: Sanitización de inputs
- **compressMedia.js**: Compresión de archivos multimedia
- **metrics.js**: Métricas Prometheus
- **cache.js**: Sistema de caché (opcional)
- **redisCache.js**: Caché con Redis (opcional)

---

## Base de Datos

### Modelos Principales

#### User (Usuario)
- `id`: Identificador único
- `username`: Nombre de usuario único
- `email`: Email único (puede ser null para usuarios solo Twitter)
- `passwordHash`: Hash de contraseña (null para OAuth)
- `oauthProvider`: Proveedor OAuth ('google', 'twitch', 'discord', 'twitter')
- `oauthId`: ID del usuario en el proveedor OAuth
- `googleId`, `twitchId`, `discordId`, `twitterId`: IDs específicos por plataforma
- `twitterAccessToken`, `twitterRefreshToken`: Tokens OAuth de Twitter (para publicar)
- `discordAccessToken`, `discordRefreshToken`: Tokens OAuth de Discord
- `licenseKey`: Clave de licencia
- `licenseType`: Tipo de licencia (NONE, TRIAL, MONTHLY, QUARTERLY, PERMANENT)
- `licenseExpiresAt`: Fecha de expiración de la licencia
- `isAdmin`: Boolean para usuarios administradores
- `merchandisingLink`: URL de merchandising (opcional)
- `createdAt`, `updatedAt`: Timestamps

#### Content (Contenido)
- `id`: Identificador único
- `title`: Título del contenido
- `content`: Texto del contenido
- `contentType`: Tipo ('post', 'story', 'video', etc.)
- `scheduledFor`: Fecha y hora programada (DATE)
- `hashtags`: Hashtags (STRING)
- `mentions`: Menciones (STRING)
- `platforms`: Array de plataformas (JSONB) ['twitter', 'discord', etc.]
- `timezone`: Zona horaria del usuario
- `recurrence`: Configuración de recurrencia (JSONB)
- `files`: Referencias a archivos multimedia (JSONB)
  ```json
  {
    "items": [
      {
        "file_path": "path/to/file.jpg",
        "url": "https://...",
        "type": "image",
        "fileName": "file.jpg"
      }
    ]
  }
  ```
- `userId`: ID del usuario propietario
- `discordGuildId`: ID del servidor de Discord
- `discordChannelId`: ID del canal de Discord
- `status`: Estado ('SCHEDULED', 'PUBLISHED', 'FAILED')
- `publishedAt`: Fecha de publicación exitosa
- `publishError`: Mensaje de error si falló
- `createdAt`, `updatedAt`: Timestamps

#### ContentTemplate (Plantilla)
- `id`: Identificador único
- `name`: Nombre de la plantilla
- `title`: Título por defecto
- `content`: Contenido por defecto
- `platforms`: Plataformas por defecto (JSONB)
- `userId`: ID del usuario propietario
- `createdAt`, `updatedAt`: Timestamps

#### Platform (Plataforma)
- `id`: Identificador único
- `name`: Nombre de la plataforma ('twitter', 'discord', etc.)
- `enabled`: Boolean si está habilitada
- `config`: Configuración adicional (JSONB)

#### License (Licencia)
- `id`: Identificador único
- `licenseKey`: Clave única de licencia
- `licenseType`: Tipo de licencia
- `userId`: ID del usuario asignado
- `expiresAt`: Fecha de expiración
- `createdAt`, `updatedAt`: Timestamps

#### Payment (Pago)
- `id`: Identificador único
- `userId`: ID del usuario
- `stripePaymentIntentId`: ID del Payment Intent de Stripe
- `amount`: Monto del pago
- `currency`: Moneda
- `status`: Estado ('PENDING', 'SUCCEEDED', 'FAILED')
- `licenseType`: Tipo de licencia comprada
- `createdAt`, `updatedAt`: Timestamps

#### AuditLog (Log de Auditoría)
- `id`: Identificador único
- `userId`: ID del usuario (puede ser null)
- `action`: Acción realizada
- `resource`: Recurso afectado
- `details`: Detalles adicionales (JSONB)
- `ipAddress`: Dirección IP
- `userAgent`: User agent del cliente
- `createdAt`: Timestamp

### Relaciones

- `User` → `Content` (1:N): Un usuario tiene múltiples contenidos
- `User` → `ContentTemplate` (1:N): Un usuario tiene múltiples plantillas
- `User` → `License` (1:N): Un usuario puede tener múltiples licencias
- `User` → `Payment` (1:N): Un usuario puede tener múltiples pagos

---

## Autenticación y Seguridad

### Autenticación JWT

1. **Generación de Token**: Al autenticarse, el backend genera un JWT con:
   - `userId`: ID del usuario
   - `username`: Nombre de usuario
   - `isAdmin`: Si es administrador
   - `exp`: Expiración (ej: 7 días)

2. **Uso del Token**: Frontend envía el token en el header:
   ```
   Authorization: Bearer <token>
   ```

3. **Validación**: Middleware `authenticateToken` verifica:
   - Firma del token
   - Expiración
   - Extrae `user` y lo adjunta a `req.user`

### Protecciones Implementadas

- **Rate Limiting**: Límites diferentes por tipo de endpoint
  - Autenticación: 5 intentos por 15 minutos
  - API general: 100 requests por 15 minutos
  - Uploads: 10 uploads por hora

- **CSRF Protection**: Tokens CSRF para operaciones sensibles

- **Helmet**: Headers de seguridad HTTP
  - XSS Protection
  - Content Security Policy
  - HSTS

- **Validación de Inputs**: Esquemas Joi en backend previenen:
  - Inyección SQL
  - XSS
  - Datos malformados

- **Sanitización**: Limpieza de inputs antes de almacenar

- **Logging de Auditoría**: Registro de acciones importantes

---

## Publicación de Contenido

### Flujo de Publicación

#### Twitter/X
1. Usuario vincula cuenta de Twitter en Settings
2. Backend almacena `twitterAccessToken` y `twitterRefreshToken`
3. Al publicar, scheduler llama a `postTweet()`:
   - Construye el texto (título + contenido)
   - Llama a Twitter API v2 (`POST /2/tweets`)
   - Actualiza estado del contenido

#### Discord
1. Usuario vincula cuenta de Discord en Settings
2. Backend almacena `discordAccessToken`
3. Usuario selecciona servidor y canal al crear contenido
4. Al publicar, scheduler:
   - Resuelve URLs de archivos multimedia (signed URLs de Supabase)
   - Publica título en un mensaje
   - Publica archivos en otro mensaje (si hay)
   - Publica contenido en otro mensaje
   - Actualiza estado del contenido

### Scheduler

El scheduler (`services/scheduler.js`) se ejecuta cada minuto:

```javascript
setInterval(runTick, INTERVAL_MS); // 60 segundos
```

En cada tick:
1. Consulta contenido con `scheduledFor <= now` y `status = 'SCHEDULED'`
2. Para cada contenido:
   - Publica en plataformas configuradas
   - Actualiza estado a `PUBLISHED` o `FAILED`
   - Registra errores en `publishError`

---

## Almacenamiento de Archivos

### Supabase Storage

- **Buckets**:
  - `images`: Imágenes (JPG, PNG, GIF, WebP)
  - `videos`: Videos (MP4, WebM, MOV)

### Flujo de Subida

1. **Frontend**: Usuario selecciona archivo
2. **Frontend**: Sube directamente a Supabase Storage usando `supabase.storage.from(bucket).upload()`
3. **Supabase**: Devuelve `file_path` (ej: `"user123/image.jpg"`)
4. **Frontend**: Almacena referencia en estado local
5. **Frontend**: Al crear contenido, envía `file_path` al backend
6. **Backend**: Almacena `file_path` en campo `files` (JSONB)
7. **Scheduler**: Al publicar, genera signed URL desde `file_path`:
   ```javascript
   supabase.storage.from(bucket).createSignedUrl(file_path, expiresIn)
   ```

### Límites por Licencia

- **Trial**: Límites reducidos (configurables)
- **Pro**: Límites mayores o ilimitados

---

## Sistema de Licencias

### Tipos de Licencia

- **NONE**: Sin licencia (acceso limitado)
- **TRIAL**: Prueba temporal (duración configurable)
- **MONTHLY**: Mensual (30 días)
- **QUARTERLY**: Trimestral (90 días)
- **PERMANENT**: Permanente (sin expiración)

### Verificación de Licencias

Middleware `checkLicense` verifica:
1. Usuario tiene `licenseType` activo
2. `licenseExpiresAt` no ha pasado (o es null para PERMANENT)
3. Si no cumple, bloquea acceso a funcionalidades premium

### Compra de Licencias

1. Usuario selecciona plan en Settings
2. Frontend redirige a Stripe Checkout
3. Stripe procesa el pago
4. Webhook de Stripe notifica al backend (`/api/payments/webhook`)
5. Backend crea registro de `Payment` y asigna `License` al usuario
6. Usuario puede usar funcionalidades premium

---

## Configuración y Variables de Entorno

### Backend (.env)

```env
# Base de Datos
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres
DATABASE_SSL=true

# JWT
JWT_SECRET=...

# Supabase
SUPABASE_URL=https://...
SUPABASE_SERVICE_KEY=...

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
TWITTER_CLIENT_ID=...
TWITTER_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# URLs
BACKEND_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=https://...
REACT_APP_SUPABASE_ANON_KEY=...
```

---

## Despliegue

### Producción (Render)

- **Backend**: Servicio Node.js en Render
- **Frontend**: Sitio estático en Render
- **Base de Datos**: PostgreSQL en Supabase
- **Storage**: Supabase Storage
- **Variables de Entorno**: Configuradas en Render Dashboard

### Scripts Disponibles

**Backend**:
- `npm start`: Inicia servidor
- `npm run dev`: Desarrollo con nodemon
- `npm run migrate`: Ejecuta migraciones
- `npm test`: Ejecuta tests

**Frontend**:
- `npm start`: Servidor de desarrollo
- `npm run build`: Build de producción

---

## Mejoras Futuras

- 🔄 Automatización completa de publicación en todas las plataformas
- 🔄 Más plataformas (YouTube, TikTok)
- 🔄 Panel de analíticas y métricas
- 🔄 Colaboración en equipo
- 🔄 Publicaciones recurrentes avanzadas
- 🔄 Biblioteca de contenido con búsqueda
- 🔄 API RESTful pública para integraciones

---

**Versión del Documento**: 1.0  
**Última Actualización**: Febrero 2026  
**Autor**: Christian David Villar Colodro
