# Chat SaaS - Prueba Técnica

SaaS de chat con backend en Cloudflare Workers + Neon Postgres y frontend en Vercel + Next.js.

## 🚀 URLs de Producción

| Componente | URL |
|------------|-----|
| **Frontend** (Vercel) | https://chat-frontend-ochre-psi.vercel.app |
| **Backend API** (Cloudflare Workers) | https://chat-backend.gabrielmarves.workers.dev |
| **Repositorio** | https://github.com/JGMarves17/prueba-tecnica-chat |

### 👉 Abrir el chat de ejemplo

**https://chat-frontend-ochre-psi.vercel.app/chats/1**

O la API directamente: [https://chat-backend.gabrielmarves.workers.dev/chats/1/mensajes](https://chat-backend.gabrielmarves.workers.dev/chats/1/mensajes)

## 📋 Chat de Prueba

- **Chat ID**: `1`
- **Teléfono**: `+34600123456`
- **Nombre del contacto**: `Juan Pérez`
- **URL Frontend**: https://chat-frontend-ochre-psi.vercel.app/chats/1
- **API Directa**: `GET https://chat-backend.gabrielmarves.workers.dev/chats/1/mensajes`
- **Info del chat**: `GET https://chat-backend.gabrielmarves.workers.dev/chats/1`

El chat incluye 8 mensajes de prueba (mezcla saliente/entrante) simulando una conversación real de soporte.
El seed es idempotente: re-ejecutarlo no duplica empresa, chat ni mensajes.

## 🏗️ Arquitectura

```
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   Database      │
│   (Vercel)      │      │   (Cloudflare)  │     │   (Neon)        │
│   Next.js 14    │      │   Hono + TS     │     │   Postgres      │
│   React Query   │      │   Drizzle ORM   │     │   Serverless    │
│   Tailwind CSS  │      │   Zod Valid.    │     │                 │
└─────────────────┘      └─────────────────┘     └─────────────────┘
```

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Cloudflare Workers (Edge)
- **Framework**: Hono 4.x
- **Base de datos**: Neon Postgres (Serverless)
- **ORM**: Drizzle ORM (Type-safe)
- **Validación**: Zod
- **Testing**: Vitest (15 tests passing)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Estado servidor**: TanStack Query v5
- **Estilos**: Tailwind CSS v3
- **Lenguaje**: TypeScript Strict
- **Despliegue**: Vercel

## 📦 Estructura del Proyecto

```
chat-saas/
├── backend/                 # Cloudflare Worker
│   ├── src/
│   │   ├── db/             # Drizzle schema + conexión
│   │   ├── routes/         # Endpoints chat
│   │   ├── utils/          # Validaciones Zod
│   │   └── index.ts        # App Hono + CORS + middleware
│   ├── tests/              # Vitest (15 tests)
│   ├── drizzle/            # Migraciones SQL
│   ├── wrangler.toml       # Config Cloudflare
│   └── package.json
│
├── frontend/               # Next.js App
│   ├── src/
│   │   ├── app/            # App Router (chats/[id])
│   │   ├── components/     # ChatMessage, ChatInput, Providers
│   │   ├── lib/            # API client, React Query hooks
│   │   └── types/          # Tipos compartidos
│   ├── vercel.json         # Config Vercel
│   └── package.json
│
├── .gitignore
└── README.md               # Este archivo
```

## 🔌 Endpoints API (Spec Exacto)

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/chats/:chatId` | Info del chat (nombre del contacto + teléfono) |
| `GET` | `/chats/:chatId/mensajes` | Listar mensajes (paginado) |
| `POST` | `/chats/:chatId/mensajes` | Crear mensaje (direccion='saliente') |
| `DELETE` | `/mensajes/:id` | Eliminar mensaje |

### Formato de Respuesta (Obligatorio)

**Éxito:**
```json
{ "status": "success", "mensajes": [...] }
{ "status": "success", "mensaje": {...} }
```

**Error:**
```json
{ "status": "error", "message": "Chat no encontrado" }
```

### Validaciones
- `:chatId` y `:id` deben ser numéricos → `400` si no
- `contenido` no vacío (trim + min 1) → `400` si vacío
- Chat inexistente → `404`
- Mensaje inexistente → `404`
- Error interno → `500`

## 🗄️ Modelo de Datos (Spec Exacto)

```sql
-- Empresas
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chats (nombre del contacto + teléfono, ambos obligatorios)
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  nombre TEXT NOT NULL,      -- nombre del contacto
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes
CREATE TABLE mensajes (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id),
  contenido TEXT NOT NULL,
  direccion TEXT NOT NULL, -- 'saliente' | 'entrante' (validado en API)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## 💻 Desarrollo Local

### Prerrequisitos
- Node.js 20.18+ o 22+ (db:seed usa --env-file-if-exists)
- Cuenta Neon (gratis en console.neon.tech)
- Cuenta Cloudflare (gratis en dash.cloudflare.com)
- Cuenta Vercel (gratis en vercel.com)

### Backend
```bash
cd backend
npm install

# 1) .env  -> lo leen drizzle-kit y el seed (scripts de Node)
cp .env.example .env
# Editar .env con tu DATABASE_URL de Neon

# 2) .dev.vars -> lo lee `wrangler dev` para inyectar c.env en el Worker.
#    Es un archivo APARTE: wrangler NO lee .env. Sin él, todos los
#    endpoints que tocan la BD responden 500.
cp .dev.vars.example .dev.vars
# Pegar el mismo DATABASE_URL

npm run db:push      # Crea las tablas en Neon
npm run db:seed      # Pobla empresa + chat + 8 mensajes (idempotente)
npm run dev          # http://localhost:8787
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
# Editar .env.local con NEXT_PUBLIC_API_URL=http://localhost:8787
npm run dev          # http://localhost:3000
```

### Probar integración
1. Backend corriendo en `localhost:8787`
2. Frontend en `localhost:3000`
3. Abrir `http://localhost:3000/chats/1`
4. Enviar/eliminar mensajes

## 🧪 Testing

```bash
# Backend
cd backend && npm test        # 15 tests passing

# Frontend (pendiente)
cd frontend && npm run type-check
```

## 🚀 Despliegue a Producción

### Backend → Cloudflare Workers
```bash
cd backend
wrangler login
wrangler secret put DATABASE_URL  # Pegar tu Neon URL
wrangler deploy
# URL: https://chat-backend.gabrielmarves.workers.dev
```

### Frontend → Vercel
```bash
cd frontend
vercel login
vercel --prod
# En Vercel Dashboard > Settings > Environment Variables:
# NEXT_PUBLIC_API_URL = https://chat-backend.gabrielmarves.workers.dev
```

## 📝 Variables de Entorno

### Backend
| Dónde | Archivo / comando | Para qué |
|-------|-------------------|----------|
| Local (scripts Node) | `backend/.env` | `db:push`, `db:generate`, `db:seed` |
| Local (Worker) | `backend/.dev.vars` | `wrangler dev` — inyecta `c.env.DATABASE_URL` |
| Producción | `wrangler secret put DATABASE_URL` | Worker desplegado |

Los tres necesitan el mismo valor: la connection string de Neon. `.env` y `.dev.vars` están en `.gitignore`.

### Frontend (Vercel Dashboard > Settings > Environment Variables)
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | URL completa del backend API | ✅ Sí |

## 👥 Acceso para Evaluación

Si el repositorio es privado, invitar a:
- **gerencia@authcode.biz** (acceso de lectura)

## 📄 Licencia

MIT - Prueba técnica para AuthCode