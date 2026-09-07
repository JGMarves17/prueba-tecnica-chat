# Chat Backend - Hono + Neon Postgres

API para el SaaS de chat: 4 endpoints, validación con Zod y despliegue en Cloudflare Workers.

## Stack
- **Runtime**: Cloudflare Workers (edge)
- **Framework**: Hono 4.x
- **Base de datos**: Neon Postgres (serverless)
- **ORM**: Drizzle ORM (type-safe)
- **Validación**: Zod
- **Testing**: Vitest (15 tests)

## Estructura
```
src/
├── index.ts              # App Hono + CORS + middleware de BD + error handling
├── db/
│   ├── index.ts          # getDb(env) — cliente Neon por request (c.env, no process.env)
│   └── schema.ts         # Tablas: empresas, chats, mensajes
├── routes/
│   └── chat.ts           # Endpoints
├── utils/
│   └── validations.ts    # Esquemas Zod
└── seed.ts               # Datos de prueba (idempotente)
```

## Formato de respuesta

Todas las respuestas siguen la convención del enunciado:

```json
// éxito
{ "status": "success", "mensajes": [ ... ] }
{ "status": "success", "mensaje": { ... } }
{ "status": "success", "chat": { ... } }

// error
{ "status": "error", "message": "El contenido es requerido" }
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/health` | Health check (no toca la BD) |
| GET | `/chats/:chatId` | Info del chat (nombre del contacto + teléfono) |
| GET | `/chats/:chatId/mensajes` | Listar mensajes, orden cronológico ASC (paginado) |
| POST | `/chats/:chatId/mensajes` | Crear mensaje — el servidor fija `direccion: 'saliente'` |
| DELETE | `/mensajes/:id` | Eliminar mensaje |

> Sin prefijo `/api`: las rutas son exactamente las del enunciado.

### Ejemplos

**GET /chats/1**
```json
{
  "status": "success",
  "chat": { "id": 1, "empresaId": 1, "nombre": "Juan Pérez", "telefono": "+34600123456", "createdAt": "..." }
}
```

**GET /chats/1/mensajes?limit=20&offset=0**
```json
{
  "status": "success",
  "mensajes": [
    { "id": 1, "chatId": 1, "contenido": "Hola", "direccion": "saliente", "createdAt": "..." },
    { "id": 2, "chatId": 1, "contenido": "¿Cómo estás?", "direccion": "entrante", "createdAt": "..." }
  ],
  "total": 2,
  "limit": 20,
  "offset": 0
}
```

**POST /chats/1/mensajes**
```json
// Request — el cliente NO manda direccion; si la manda, se ignora
{ "contenido": "Nuevo mensaje" }

// Response 201
{
  "status": "success",
  "mensaje": { "id": 3, "chatId": 1, "contenido": "Nuevo mensaje", "direccion": "saliente", "createdAt": "..." }
}
```

**DELETE /mensajes/1**
```json
// Response 200
{ "status": "success", "mensaje": { "id": 1, "...": "..." } }
```

### Códigos de error

| Situación | Código | Respuesta |
|-----------|--------|-----------|
| `:chatId` / `:id` no numérico | `400` | `{ "status": "error", "message": "chatId debe ser un número entero positivo" }` |
| `contenido` vacío o solo espacios | `400` | `{ "status": "error", "message": "El contenido es requerido" }` |
| Chat inexistente | `404` | `{ "status": "error", "message": "Chat no encontrado" }` |
| Mensaje inexistente (DELETE) | `404` | `{ "status": "error", "message": "Mensaje no encontrado" }` |
| Error inesperado | `500` | `{ "status": "error", "message": "Error interno del servidor" }` |

## Desarrollo Local

Hacen falta **dos** archivos de entorno distintos, con el mismo `DATABASE_URL`:

| Archivo | Lo lee | Para qué |
|---------|--------|----------|
| `.env` | Node (drizzle-kit, seed) | `db:push`, `db:generate`, `db:seed` |
| `.dev.vars` | `wrangler dev` | Inyecta `c.env.DATABASE_URL` en el Worker |

`wrangler dev` **no lee `.env`**: sin `.dev.vars`, todos los endpoints que tocan la BD responden `500`.

```bash
npm install

cp .env.example .env             # pegar tu DATABASE_URL de Neon
cp .dev.vars.example .dev.vars   # pegar el mismo DATABASE_URL

npm run db:push                  # crea las tablas en Neon
npm run db:seed                  # empresa + chat + 8 mensajes (idempotente)
npm run dev                      # http://localhost:8787
```

Comprobación rápida:
```bash
curl http://localhost:8787/health
curl http://localhost:8787/chats/1/mensajes
```

## Testing

```bash
npm test              # 15 tests
npm test -- --coverage
```

Los tests mockean `getDb`, así que cubren routing, validaciones y contrato de respuesta — no la BD real.

## Despliegue a Cloudflare Workers

```bash
wrangler login
wrangler secret put DATABASE_URL   # pegar la connection string de Neon
npm run deploy
# URL pública: https://chat-backend.<tu-subdominio>.workers.dev
```

`DATABASE_URL` se guarda como **Secret**, nunca en `wrangler.toml`.

## CORS

Configurado en `src/index.ts` mediante función (no lista), para que el comodín funcione de verdad:
- `http://localhost:3000` (desarrollo)
- cualquier `*.vercel.app` (producción)

Otros orígenes no reciben cabecera `Access-Control-Allow-Origin`.

## Esquema de Base de Datos

```sql
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES empresas(id),
  nombre TEXT NOT NULL,      -- nombre del contacto
  telefono TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE mensajes (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER NOT NULL REFERENCES chats(id),
  contenido TEXT NOT NULL,
  direccion TEXT NOT NULL,   -- 'entrante' | 'saliente'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Las migraciones generadas por Drizzle están en `drizzle/`.
