# Chat SaaS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o superpowers:executing-plans para implementar este plan paso a paso.

**Objetivo:** Construir un SaaS de chat funcional con soporte para múltiples usuarios, historial de conversaciones, autenticación y escalabilidad en producción.

**Arquitectura:**
El sistema se divide en tres capas: frontend (Next.js), backend (Hono + Neon Postgres), y despliegue (Cloudflare Workers + Vercel). Usaremos Drizzle ORM para interactuar con la base de datos y React Query para gestión de datos en el frontend.

**Stack Tecnológico:**
- Backend: Hono, TypeScript, Neon Postgres, Drizzle ORM.
- Frontend: Next.js (App Router), React Query, Tailwind CSS.
- Despliegue: Cloudflare Workers, Vercel.


## Global Constraints
- Usar TypeScript para todo el código.
- Base de datos: Neon Postgres con Drizzle ORM.
- Frontend: Next.js 14 con App Router.
- Backend: Hono con soporte para WebSockets para real-time.
- Tailwind CSS v4 para estilos.
- Pruebas TDD para cada componente y endpoint.
- Configuración de variables de entorno para seguridad y flexibilidad.


## Estructura del Proyecto
```
chat-saas/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── db/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   └── app.ts
│   ├── tests/
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (chat)/
│   │   └── layout.tsx
│   ├── components/
│   ├── lib/
│   │   ├── api/
│   │   └── query.ts
│   ├── styles/
│   ├── types/
│   └── package.json
├── docs/
│   └── superpowers/
│       └── plans/
│           └── chat-saas-implementation.md
└── .env.example
```


## Tareas por Capa

### Backend (Hono + TypeScript + Neon Postgres)

#### Tarea 1: Configuración y Base de Datos
**Archivos:**
- `backend/src/config/db.ts`
- `backend/src/db/schema.ts`
- `backend/src/db/index.ts`

**Interfaces:**
- Consume: Configuración de Neon Postgres.
- Produce: Conexión establecida a la base de datos.

- [ ] **Step 1:** Configurar Neon Postgres.
- [ ] **Step 2:** Crear esquema de la base de datos.
- [ ] **Step 3:** Implementar conexión a Neon.
- [ ] **Commit:** `backend/src/config/db.ts`, `backend/src/db/schema.ts`, `backend/src/db/index.ts`.


#### Tarea 2: Endpoints de Autenticación
**Archivos:**
- `backend/src/routes/auth.ts`
- `backend/src/app.ts`

**Interfaces:**
- Consume: Conexión a la base de datos.
- Produce: Funciones para registro y login.

- [ ] **Step 1:** Escribir test para autenticación.
- [ ] **Step 2:** Ejecutar test para verificar falla.
- [ ] **Step 3:** Implementar endpoint de registro.
- [ ] **Commit:** `backend/src/routes/auth.ts`, `backend/tests/auth.test.ts`.


#### Tarea 3: Endpoints de Chat
**Archivos:**
- `backend/src/routes/chat.ts`
- `backend/src/app.ts`

**Interfaces:**
- Consume: Conexión a la base de datos y autenticación.
- Produce: Endpoints para enviar mensajes y obtener historial.

- [ ] **Step 1:** Escribir test para mensajes.
- [ ] **Step 2:** Implementar WebSocket para real-time.
- [ ] **Commit:** `backend/src/routes/chat.ts`, `backend/tests/chat.test.ts`.


### Frontend (Next.js + React Query + Tailwind CSS)

#### Tarea 4: Configuración y Estructura del Frontend
**Archivos:**
- `frontend/app/layout.tsx`
- `frontend/styles/globals.css`
- `frontend/lib/query.ts`

**Interfaces:**
- Consume: Configuración de Next.js y Tailwind.
- Produce: Estructura básica del frontend.

- [ ] **Step 1:** Configurar Next.js y Tailwind.
- [ ] **Commit:** `frontend/app/layout.tsx`, `frontend/styles/globals.css`, `frontend/lib/query.ts`.


#### Tarea 5: Componentes de Autenticación
**Archivos:**
- `frontend/components/auth/RegisterForm.tsx`
- `frontend/components/auth/LoginForm.tsx`

**Interfaces:**
- Consume: Configuración de React Query.
- Produce: Componentes para registro y login.

- [ ] **Step 1:** Escribir test para componentes de autenticación.
- [ ] **Step 2:** Implementar componente de registro.
- [ ] **Commit:** `frontend/components/auth/RegisterForm.tsx`, `frontend/tests/auth.test.tsx`.


#### Tarea 6: Componentes de Chat
**Archivos:**
- `frontend/components/chat/ChatWindow.tsx`
- `frontend/components/chat/MessagesList.tsx`

**Interfaces:**
- Consume: Configuración de React Query y autenticación.
- Produce: Componentes para mostrar mensajes y enviar nuevos mensajes.

- [ ] **Step 1:** Escribir test para componentes de chat.
- [ ] **Step 2:** Implementar componentes de chat.
- [ ] **Commit:** `frontend/components/chat/ChatWindow.tsx`, `frontend/components/chat/MessagesList.tsx`, `frontend/tests/chat.test.tsx`.


### Despliegue (Cloudflare Workers + Vercel)

#### Tarea 7: Configuración de Cloudflare Workers
**Archivos:**
- `backend/src/workers.ts`
- `backend/wrangler.toml`

**Interfaces:**
- Consume: Configuración de Hono y Neon.
- Produce: Configuración para Cloudflare Workers.

- [ ] **Step 1:** Configurar Worker para Hono.
- [ ] **Commit:** `backend/src/workers.ts`, `backend/wrangler.toml`.


#### Tarea 8: Configuración de Vercel para Frontend
**Archivos:**
- `frontend/.vercel.json`

**Interfaces:**
- Consume: Configuración de Next.js y Tailwind.
- Produce: Configuración para despliegue en Vercel.

- [ ] **Step 1:** Configurar `vercel.json`.
- [ ] **Commit:** `frontend/.vercel.json`.


## Validaciones y Manejo de Errores

### Backend
- **Autenticación:** Validar emails y contraseñas antes de guardar en la base de datos.
- **Mensajes:** Validar contenido antes de insertar en la tabla `messages`.
- **WebSocket:** Manejar errores de conexión y enviar mensajes solo si hay conexión estable.

### Frontend
- **Formularios:** Validar campos antes de enviar.
- **React Query:** Manejar errores en las consultas y mostrar mensajes de usuario.
- **Tailwind:** Usar clases de Tailwind para estilos y validar accesibilidad.


## Pruebas TDD
- **Backend:** Pruebas unitarias con Vitest para autenticación y mensajes.
- **Frontend:** Pruebas unitarias con React Testing Library para componentes de autenticación y chat.
- **Despliegue:** Pruebas de integración para validar que los endpoints funcionan correctamente en ambos entornos.


## Configuración de Variables de Entorno
- **Backend:** `.env` para `DATABASE_URL`, `NEXTAUTH_SECRET`, etc.
- **Frontend:** `.env.local` para variables como `NEXT_PUBLIC_API_URL`.


## Despliegue Paso a Paso
1. **Backend:** Configurar Cloudflare Workers con `wrangler publish`.
2. **Frontend:** Configurar Vercel con la configuración `.vercel.json`.


---