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

// ============================================
// TIPADO DE BINDINGS DE CLOUDFLARE WORKERS
// ============================================
// Los "bindings" son la forma en que Cloudflare Workers accede a recursos externos
// (bases de datos, KV, secrets, variables de entorno) de forma segura y tipada.
// Aquí definimos qué variables de entorno espera nuestro Worker.
export interface Env {
  DATABASE_URL: string  // Binding a la base de datos Neon (se configura como Secret en Cloudflare)
}

// ============================================
// TIPADO DE VARIABLES DE CONTEXTO (c.var)
// ============================================
// Las variables de contexto (c.var) permiten pasar datos entre middlewares y handlers.
// Aquí tipamos que tendremos una instancia de DrizzleDb disponible en c.var.db
interface Variables {
  db: DrizzleDb
}

// ============================================
// CREACIÓN DE LA APP HONO TIPADA
// ============================================
// Creamos la app Hono con tipado estricto para bindings (Env) y variables (Variables)
// Esto nos da autocompletado y type-safety en c.env y c.var
const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ============================================
// MIDDLEWARES GLOBALES
// ============================================

// Logger: registra todas las peticiones HTTP en consola (útil para debugging)
app.use('*', logger())

// ============================================
// CORS CON FUNCIÓN DINÁMICA (NO ARRAY ESTÁTICO)
// ============================================
// Usamos una función en lugar de array para soportar wildcard *.vercel.app
// Los arrays en CORS hacen comparación exacta, así que *.vercel.app no funcionaría.
// La función recibe el origin y decide si permitirlo.
app.use('*', cors({
  origin: (origin, c) => {
    const isVercel = origin?.endsWith('.vercel.app') ?? false  // Cualquier subdominio de vercel.app
    const isLocal = origin === 'http://localhost:3000'         // Desarrollo local
    
    if (isLocal || isVercel) {
      return origin  // Permitir: devuelve el origin para header Access-Control-Allow-Origin
    }
    return undefined  // Rechazar: no envía header CORS
  },
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

/* 
  NOTA SOBRE CORS Y CREDENTIALS:
  - credentials: true permite peticiones con credenciales (cookies, autenticación HTTP).
    El header Authorization lo autoriza allowHeaders, no credentials.
  - Con credentials, Access-Control-Allow-Origin no puede ser "*",
    por eso la función devuelve el origin exacto.
  - Hoy la API no usa cookies ni sesiones, así que credentials sobra
    (limitación conocida: en producción se quitaría junto con el comodín *.vercel.app).
*/

// ============================================
// HEALTH CHECK (SIN MIDDLEWARE DE BD)
// ============================================
// IMPORTANTE: Este endpoint va ANTES del middleware de BD
// Así funciona aunque la base de datos esté caída (para monitoring/alertas)
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ============================================
// MIDDLEWARE DE INYECCIÓN DE BASE DE DATOS
// ============================================
// Se ejecuta DESPUÉS del health check, para TODAS las demás rutas
// Crea por request un cliente de Drizzle sobre el driver HTTP de Neon, con el
// binding c.env.DATABASE_URL. No abre una conexión persistente: cada consulta
// es una petición HTTP. Lo guarda en el contexto para que los handlers lo usen
// con c.get('db'), y los tests lo sustituyen por un doble.
app.use('*', async (c, next) => {
  c.set('db', getDb(c.env))  // Inyecta instancia de Drizzle en el contexto
  await next()               // Continúa al siguiente middleware/handler
})

// ============================================
// MONTAR RUTAS DE CHAT
// ============================================
// Sin prefijo /api para cumplir spec exacto (rutas directas: /chats/:chatId/mensajes)
app.route('/', chatRoutes)

// ============================================
// MANEJO DE ERRORES GLOBAL - FORMATO SPEC
// ============================================
// app.onError captura CUALQUIER error no manejado (throw, promise rejection, etc.)
// Responde SIEMPRE con formato SPEC: { status: "error", message: "..." }
app.onError((err, c) => {
  console.error('Error:', err)  // Log interno para debugging
  return c.json({ status: 'error', message: 'Error interno del servidor' }, 500)
})

// ============================================
// 404 PARA RUTAS NO ENCONTRADAS - FORMATO SPEC
// ============================================
app.notFound((c) => c.json({ status: 'error', message: 'Ruta no encontrada' }, 404))

export default app