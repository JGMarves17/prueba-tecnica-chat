# Chat SaaS - Prueba Técnica

SaaS de chat multi-tenant con backend en Cloudflare Workers + Neon Postgres y frontend en Vercel + Next.js.

## 🚀 URLs de Producción

| Componente | URL | Estado |
|------------|-----|--------|
| **Backend API** | `https://chat-backend.<tu-subdominio>.workers.dev` | ⏳ Pendiente deploy |
| **Frontend** | `https://chat-frontend.vercel.app` | ⏳ Pendiente deploy |

> **Nota**: Reemplazar con URLs reales tras deploy.

## 📋 Chat de Prueba

- **Chat ID**: `1`
- **Teléfono**: `+34600123456`
- **URL Frontend**: `https://chat-frontend.vercel.app/chats/1`
- **API Directa**: `GET https://chat-backend.<tu-subdominio>.workers.dev/chats/1/mensajes`

El chat incluye 8 mensajes de prueba (mezcla saliente/entrante) simulando una conversación real de soporte.

## 🏗️ Arquitectura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backend       │────▶│   Database      │
│   (Vercel)      │     │   (Cloudflare)  │     │   (Neon)        │
│   Next.js 14    │     │   Hono + TS     │     │   Postgres      │
│   React Query   │     │   Drizzle ORM   │     │   Serverless    │
│   Tailwind CSS  │     │   Zod Valid.    │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## 🛠️ Stack Tecnológico

### Backend
- **Runtime**: Cloudflare Workers (Edge)
- **Framework**: Hono 4.x
- **Base de datos**: Neon Postgres (Serverless)
- **ORM**: Drizzle ORM (Type-safe)
- **Validación**: Zod
- **Testing**: Vitest (10 tests passing)

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
│   ├── tests/              # Vitest (10 tests)
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

-- Chats (con teléfono obligatorio)
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mensajes
CREATE TABLE mensajes (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id),
  contenido TEXT NOT NULL,
  direccion TEXT NOT NULL CHECK (direccion IN ('saliente', 'entrante')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 💻 Desarrollo Local

### Prerrequisitos
- Node.js 20+
- Cuenta Neon (gratis en console.neon.tech)
- Cuenta Cloudflare (gratis en dash.cloudflare.com)
- Cuenta Vercel (gratis en vercel.com)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tu DATABASE_URL de Neon
npm run db:generate
npm run db:push
npm run db:seed      # Pobla empresa + chat 1 + mensajes
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
cd backend && npm test        # 10 tests passing

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
# URL: https://chat-backend.<tu-subdominio>.workers.dev
```

### Frontend → Vercel
```bash
cd frontend
vercel login
vercel --prod
# En Vercel Dashboard > Settings > Environment Variables:
# NEXT_PUBLIC_API_URL = https://chat-backend.<tu-subdominio>.workers.dev
```

## 📝 Variables de Entorno

### Backend (Cloudflare Dashboard > Workers > Settings > Variables)
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Connection string Neon Postgres | ✅ Sí |

### Frontend (Vercel Dashboard > Settings > Environment Variables)
| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | URL completa del backend API | ✅ Sí |

## 👥 Acceso para Evaluación

Si el repositorio es privado, invitar a:
- **gerencia@authcode.biz** (acceso de lectura)

## 📄 Licencia

MIT - Prueba técnica para AuthCode