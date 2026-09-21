/**
 * Rutas de Chat - Endpoints para chats y mensajes
 *
 * GET    /chats/:chatId              - Info del chat (nombre, telefono)
 * GET    /chats/:chatId/mensajes     - Listar mensajes (paginado)
 * POST   /chats/:chatId/mensajes     - Crear mensaje (direccion siempre 'saliente')
 * DELETE /mensajes/:id               - Eliminar mensaje
 *
 * Formato de respuesta SPEC:
 * - Success: { status: "success", mensajes: [...] } | { status: "success", mensaje: {...} }
 * - Error:   { status: "error", message: "..." }
 *
 * Todos validan con Zod antes de consultar BD
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { mensajes, chats } from '../db/schema'
import { eq, count } from 'drizzle-orm'
import {
  chatIdParamSchema,
  messageIdParamSchema,
  createMensajeSchema,
  mensajesQuerySchema,
  type ChatIdParam,
  type MessageIdParam,
  type CreateMensajeInput,
  type MensajesQuery,
} from '../utils/validations'
import type { Env } from '../index'
import type { DrizzleDb } from '../db'

// ============================================
// TIPAR LAS RUTAS CON BINDINGS Y VARIABLES
// ============================================
// Usamos los mismos tipos que la app principal (Env + Variables con db)
// Esto asegura que c.env y c.var.db tengan los tipos correctos en todos los handlers
const chatRoutes = new Hono<{ Bindings: Env; Variables: { db: DrizzleDb } }>()

// ============================================
// HOOK PERSONALIZADO PARA ERRORES DE ZOD
// ============================================
// Convierte errores de validación de Zod al formato SPEC: { status: "error", message: "..." }
// Se pasa como tercer argumento a zValidator
const zodErrorHook = (result: any, c: any) => {
  if (!result.success) {
    // Une todos los mensajes de error de Zod en un solo string
    const errorMessage = result.error.issues.map((i: any) => i.message).join(', ')
    return c.json({ status: 'error', message: errorMessage }, 400)
  }
}

/**
 * Middleware: valida que el body sea JSON válido ANTES de zValidator
 * 
 * Por qué: Si el cliente envía JSON malformado (ej: { contenido: "hola" sin comillas }),
 * Hono lanza error 500 interno. Este middleware lo captura y devuelve 400 con formato SPEC.
 * 
 * Hono cachea el body parseado, así que el zValidator posterior reutiliza el resultado
 * sin volver a parsear (rendimiento).
 */
const jsonBodyGuard = async (c: any, next: any) => {
  try {
    await c.req.json()  // Intenta parsear el body
  } catch {
    // JSON malformado → error del cliente (400), no del servidor (500)
    return c.json({ status: 'error', message: 'El body debe ser JSON válido' }, 400)
  }
  await next()  // Continúa al siguiente middleware (zValidator)
}

/**
 * GET /chats/:chatId
 * Devuelve la info del chat (nombre del contacto y telefono) para la cabecera del front
 * 
 * Respuesta: { status: "success", chat: Chat }
 */
chatRoutes.get(
  '/chats/:chatId',
  zValidator('param', chatIdParamSchema, zodErrorHook),  // Valida :chatId en params
  async (c) => {
    const db = c.get('db')  // Obtiene instancia de Drizzle inyectada por middleware
    const { chatId } = c.req.valid('param') as ChatIdParam  // Params ya validados por Zod

    // Buscar chat por ID (limit 1 para eficiencia)
    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (!chat) {
      return c.json({ status: 'error', message: 'Chat no encontrado' }, 404)
    }

    // Respuesta formato SPEC
    return c.json({ status: 'success', chat })
  }
)

/**
 * GET /chats/:chatId/mensajes
 * Lista mensajes de un chat ordenados cronologicamente (mas antiguos primero)
 * Query params: limit (default 50), offset (default 0)
 * 
 * Respuesta: { status: "success", mensajes: Mensaje[], total: number, limit: number, offset: number }
 */
chatRoutes.get(
  '/chats/:chatId/mensajes',
  zValidator('param', chatIdParamSchema, zodErrorHook),   // Valida :chatId
  zValidator('query', mensajesQuerySchema, zodErrorHook), // Valida ?limit=&offset=
  async (c) => {
    const db = c.get('db')
    const { chatId } = c.req.valid('param') as ChatIdParam
    const { limit, offset } = c.req.valid('query') as MensajesQuery

    // 1. Verificar que el chat existe
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (chat.length === 0) {
      return c.json({ status: 'error', message: 'Chat no encontrado' }, 404)
    }

    // 2. Obtener mensajes con paginación (más antiguos primero = ASC)
    // orderBy(mensajes.createdAt, mensajes.id) → ASC por createdAt, desempata por id
    const mensajesList = await db
      .select()
      .from(mensajes)
      .where(eq(mensajes.chatId, chatId))
      .orderBy(mensajes.createdAt, mensajes.id)  // ASC = más antiguos primero
      .limit(limit)
      .offset(offset)

    // Contar total para paginación (usando count() eficiente de Drizzle)
    const totalResult = await db
      .select({ total: count() })
      .from(mensajes)
      .where(eq(mensajes.chatId, chatId))

    // Respuesta formato SPEC con metadatos de paginación
    return c.json({
      status: 'success',
      mensajes: mensajesList,
      total: totalResult[0]?.total ?? 0,
      limit,
      offset,
    })
  }
)

/**
 * POST /chats/:chatId/mensajes
 * Crea un nuevo mensaje en el chat
 * Body: { contenido: string }  -- direccion SIEMPRE 'saliente' (fijada por servidor)
 * 
 * Respuesta: { status: "success", mensaje: Mensaje }
 */
chatRoutes.post(
  '/chats/:chatId/mensajes',
  zValidator('param', chatIdParamSchema, zodErrorHook),   // Valida :chatId
  jsonBodyGuard,                                           // Valida JSON válido ANTES
  zValidator('json', createMensajeSchema, zodErrorHook),  // Valida { contenido }
  async (c) => {
    const db = c.get('db')
    const { chatId } = c.req.valid('param') as ChatIdParam
    const { contenido } = c.req.valid('json') as CreateMensajeInput  // SOLO contenido

    // Verificar que el chat existe
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (chat.length === 0) {
      return c.json({ status: 'error', message: 'Chat no encontrado' }, 404)
    }

    // Insertar mensaje con direccion FIJA 'saliente' (negocio responde)
    // El cliente NUNCA envía direccion; el servidor la fija siempre
    const [nuevoMensaje] = await db
      .insert(mensajes)
      .values({ chatId, contenido, direccion: 'saliente' })
      .returning()  // Retorna el registro insertado con ID generado

    return c.json({ status: 'success', mensaje: nuevoMensaje }, 201)
  }
)

/**
 * DELETE /mensajes/:id
 * Elimina un mensaje por su ID
 * 
 * Respuesta: { status: "success", mensaje: Mensaje }
 */
chatRoutes.delete(
  '/mensajes/:id',
  zValidator('param', messageIdParamSchema, zodErrorHook),  // Valida :id numérico
  async (c) => {
    const db = c.get('db')
    const { id } = c.req.valid('param') as MessageIdParam

    // Eliminar y retornar el mensaje eliminado (para confirmación en front)
    const [mensajeEliminado] = await db
      .delete(mensajes)
      .where(eq(mensajes.id, id))
      .returning()  // Retorna el registro eliminado

    if (!mensajeEliminado) {
      return c.json({ status: 'error', message: 'Mensaje no encontrado' }, 404)
    }

    return c.json({ status: 'success', mensaje: mensajeEliminado })
  }
)

export default chatRoutes