# Chat Frontend - Next.js + React Query + Tailwind

Interfaz de conversación estilo WhatsApp para el CRM: listar, enviar y eliminar mensajes.

## Stack
- **Framework**: Next.js 14 (App Router)
- **Estado servidor**: TanStack Query (React Query) v5
- **Estilos**: Tailwind CSS v3
- **Lenguaje**: TypeScript strict
- **Despliegue**: Vercel

## Estructura
```
src/
├── app/
│   ├── layout.tsx           # Root layout (server component) + metadata
│   ├── page.tsx             # `/` redirige a /chats/1
│   ├── globals.css          # Tailwind + estilos globales
│   └── chats/[id]/page.tsx  # Pantalla de conversación
├── components/
│   ├── Providers.tsx        # 'use client' — QueryClientProvider + devtools
│   ├── ChatMessage.tsx      # Burbuja (saliente/entrante) + borrar en hover
│   └── ChatInput.tsx        # Formulario de envío (recibe la mutación del padre)
├── lib/
│   ├── api.ts               # Cliente API tipado
│   ├── query.ts             # Hooks: useChat, useMensajes, useSendMensaje, useDeleteMensaje
│   └── utils.ts             # cn(), formatDate()
└── types/
    └── index.ts             # Tipos del contrato de la API
```

## Características

- **Optimistic updates** al enviar y al borrar, con rollback si el servidor falla.
- **Estados explícitos**: loading, empty ("Aún no hay mensajes"), error con botón de reintento, y chatId inválido.
- **Borrado con confirmación**, botón visible al pasar el ratón por la burbuja (`group-hover`).
- **Auto-scroll** al último mensaje.
- **Validación en cliente**: no se envían mensajes vacíos ni solo espacios; si el envío falla se restaura el texto.
- **Accesibilidad**: `role="log"` + `aria-live="polite"` en la lista, `aria-label` en los controles, envío con Enter (Shift+Enter para salto de línea), focus visible.
- **Dark mode** por `prefers-color-scheme` vía clases `dark:` de Tailwind.

## Desarrollo Local

```bash
npm install

cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8787   (sin /api y sin barra final)

npm run dev          # http://localhost:3000
```

Con el backend corriendo en `localhost:8787`, abrir `http://localhost:3000/chats/1`.

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL base del backend, **sin** `/api` ni barra final | `http://localhost:8787` |

La URL se lee de `process.env.NEXT_PUBLIC_API_URL` con fallback a `http://localhost:8787` en desarrollo (`src/lib/api.ts:10`).

## Despliegue a Vercel

```bash
vercel login
vercel --prod
```

En **Vercel Dashboard > Settings > Environment Variables**:
- `NEXT_PUBLIC_API_URL` = `https://chat-backend.<tu-subdominio>.workers.dev`

> Al ser `NEXT_PUBLIC_*` se inyecta en build time: tras cambiarla hay que **redesplegar**.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Servidor de producción |
| `npm run lint` | ESLint |
| `npm run type-check` | `tsc --noEmit` |

## Integración con la API

| Método | Endpoint | Hook |
|--------|----------|------|
| GET | `/chats/:chatId` | `useChat(chatId)` |
| GET | `/chats/:chatId/mensajes` | `useMensajes(chatId)` |
| POST | `/chats/:chatId/mensajes` | `useSendMensaje(chatId)` |
| DELETE | `/mensajes/:id` | `useDeleteMensaje(chatId)` |

Todas las respuestas se validan contra el contrato `{ status: "success" \| "error" }` en `handleResponse()`.

## Tipos

`src/types/index.ts` refleja el contrato de la API y debe mantenerse en sync con `backend/src/db/schema.ts`:

```typescript
type DireccionMensaje = 'saliente' | 'entrante'

interface Mensaje {
  id: number
  chatId: number
  contenido: string
  direccion: DireccionMensaje
  createdAt: string
}
```

## Tests

No hay tests de UI en esta entrega; la cobertura automatizada está en el backend (`cd ../backend && npm test`, 15 tests). La verificación del frontend es `npm run type-check` + `npm run build`.
