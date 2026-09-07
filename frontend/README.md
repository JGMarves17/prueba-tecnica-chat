# Chat Frontend - Next.js + React Query + Tailwind

Frontend para SaaS de chat con interfaz moderna, dark mode, y gestión de estado optimista.

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
│   ├── layout.tsx          # Root layout + QueryClientProvider
│   ├── globals.css         # Tailwind + estilos globales
│   └── chats/[id]/page.tsx # Página de chat individual
├── components/
│   ├── ChatMessage.tsx     # Burbuja de mensaje (saliente/entrante)
│   └── ChatInput.tsx       # Formulario de envío
├── lib/
│   ├── api.ts              # Cliente API tipado
│   ├── query.ts            # Hooks React Query (useMensajes, useSendMensaje, useDeleteMensaje)
│   └── utils.ts            # Utilidades (cn, formatDate)
└── types/
    └── index.ts            # Tipos compartidos con backend
```

## Características

### Chat en tiempo real (simulado)
- **Optimistic updates**: Mensajes aparecen instantáneamente
- **Auto-scroll**: Siempre al último mensaje
- **Estados**: loading, error, empty, success

### Accesibilidad
- ARIA labels y roles semánticos
- Focus visible management
- Keyboard navigation (Enter para enviar)
- Screen reader support (aria-live)

### Dark Mode
- `class` strategy en Tailwind
- Persistencia en localStorage (opcional)
- Respeta `prefers-color-scheme`

### Validaciones
- Cliente: contenido no vacío, max 5000 chars
- Servidor: Zod en backend (fuente de verdad)

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables
cp .env.example .env.local
# Editar .env.local con NEXT_PUBLIC_API_URL

# Servidor de desarrollo
npm run dev
# Abre http://localhost:3000
```

## Variables de Entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | URL base del backend API | `http://localhost:8787/api` |

## Despliegue a Vercel

```bash
# Login
vercel login

# Deploy (configura NEXT_PUBLIC_API_URL en dashboard)
vercel --prod
```

### Configuración en Vercel Dashboard
1. **Settings > Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://chat-backend.tu-subdominio.workers.dev/api`

2. **Functions**: Max duration 30s (configurado en vercel.json)

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor desarrollo (Turbopack) |
| `npm run build` | Build producción |
| `npm run start` | Servidor producción |
| `npm run lint` | ESLint |
| `npm run type-check` | TypeScript check |

## API Integration

El frontend consume 3 endpoints del backend:

| Método | Endpoint | Hook |
|--------|----------|------|
| GET | `/api/chats/:chatId/mensajes` | `useMensajes(chatId)` |
| POST | `/api/chats/:chatId/mensajes` | `useSendMensaje(chatId)` |
| DELETE | `/api/mensajes/:id` | `useDeleteMensaje(chatId)` |

## Tipos Compartidos

Los tipos en `src/types/index.ts` deben mantenerse sincronizados con `backend/src/db/schema.ts`:

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

## Testing (pendiente)

```bash
# Unit tests con Vitest + React Testing Library
npm test

# E2E con Playwright
npx playwright test
```

## Performance

- **React Query**: Cache 30s, deduping, background refetch
- **Next.js**: Server Components por defecto, Client Components solo donde necesario
- **Tailwind**: JIT compilation, solo CSS usado
- **Fonts**: Inter con `font-display: swap`

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Safari/Chrome