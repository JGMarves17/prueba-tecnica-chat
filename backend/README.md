# Chat Backend - Hono + Neon Postgres

Backend para SaaS de chat con 3 endpoints CRUD, validaciones Zod, y despliegue en Cloudflare Workers.

## Stack
- **Runtime**: Cloudflare Workers (edge)
- **Framework**: Hono 4.x
- **Base de datos**: Neon Postgres (serverless)
- **ORM**: Drizzle ORM (type-safe)
- **Validación**: Zod
- **Testing**: Vitest

## Estructura
```
src/
├── index.ts              # App Hono principal + CORS
├── db/
│   ├── index.ts          # Conexión Neon + Drizzle
│   └── schema.ts         # Tablas: empresas, chats, mensajes
├── routes/
│   └── chat.ts           # 3 endpoints: GET/POST/DELETE
└── utils/
    └── validations.ts    # Esquemas Zod
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/chats/:chatId/mensajes` | Listar mensajes (paginado) |
| POST | `/api/chats/:chatId/mensajes` | Crear mensaje |
| DELETE | `/api/mensajes/:id` | Eliminar mensaje |

### Ejemplos

**GET /api/chats/1/mensajes?limit=20&offset=0**
```json
{
  "mensajes": [
    { "id": 1, "chatId": 1, "contenido": "Hola", "direccion": "saliente", "createdAt": "..." },
    { "id": 2, "chatId": 1, "contenido": "¿Cómo estás?", "direccion": "entrante", "createdAt": "..." }
  ],
  "total": 2,
  "limit": 20,
  "offset": 0
}
```

**POST /api/chats/1/mensajes**
```json
// Request
{ "contenido": "Nuevo mensaje", "direccion": "saliente" }

// Response 201
{ "mensaje": { "id": 3, "chatId": 1, "contenido": "Nuevo mensaje", "direccion": "saliente", "createdAt": "..." } }
```

**DELETE /api/mensajes/1**
```json
// Response 200
{ "success": true, "mensaje": { "id": 1, ... } }
```

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL de Neon

# Generar migraciones
npm run db:generate

# Aplicar migraciones a Neon
npm run db:push

# Iniciar servidor de desarrollo (Cloudflare Workers local)
npm run dev
# Disponible en http://localhost:8787
```

## Testing

```bash
# Ejecutar pruebas
npm test

# Con coverage
npm run test -- --coverage
```

## Despliegue a Cloudflare Workers

```bash
# Login en Cloudflare
wrangler login

# Configurar DATABASE_URL en dashboard:
# Cloudflare Dashboard > Workers > chat-backend > Settings > Variables

# Desplegar
npm run deploy
# URL pública: https://chat-backend.<tu-subdominio>.workers.dev
```

## Variables de Entorno (Cloudflare Dashboard)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` | Connection string de Neon Postgres | ✅ Sí |

## CORS

Configurado para aceptar:
- `http://localhost:3000` (desarrollo local)
- `https://*.vercel.app` (frontends en Vercel)

## Esquema de Base de Datos

```sql
-- Empresas (tenants)
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chats (por empresa)
CREATE TABLE chats (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES empresas(id),
  nombre TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Mensajes (por chat)
CREATE TABLE mensajes (
  id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES chats(id),
  contenido TEXT NOT NULL,
  direccion TEXT NOT NULL CHECK (direccion IN ('saliente', 'entrante')),
  created_at TIMESTAMP DEFAULT NOW()
);
```