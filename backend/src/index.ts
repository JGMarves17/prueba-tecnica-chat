/**
 * Punto de entrada principal - App Hono
 * Configura CORS, monta rutas, manejo de errores global
 * Compatible con Cloudflare Workers
 */
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import chatRoutes from './routes/chat'
import { getDb, type DrizzleDb } from './db'

// Tipado de bindings de Cloudflare Workers
export interface Env {
  DATABASE_URL: string
}

// Tipado de variables de contexto
interface Variables {
  db: DrizzleDb
}

// App Hono tipada con bindings y variables
const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Middleware global
app.use('*', logger())

// CORS con función para soportar wildcard *.vercel.app
app.use('*', cors({
  origin: (origin, c) => {
    const allowedOrigins = ['http://localhost:3000']
    const isVercel = origin?.endsWith('.vercel.app') ?? false
    const isLocal = origin === 'http://localhost:3000'
    
    if (isLocal || isVercel) {
      return origin
    }
    return undefined
  },
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Middleware para inyectar db en el contexto
app.use('*', async (c, next) => {
  c.set('db', getDb(c.env))
  await next()
})

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// Montar rutas de chat (sin prefijo /api para cumplir spec exacto)
app.route('/', chatRoutes)

// Manejo de errores global - formato spec: { status: "error", message: "..." }
app.onError((err, c) => {
  console.error('Error:', err)
  return c.json({ status: 'error', message: 'Error interno del servidor' }, 500)
})

// 404 para rutas no encontradas - formato spec
app.notFound((c) => c.json({ status: 'error', message: 'Ruta no encontrada' }, 404))

export default app