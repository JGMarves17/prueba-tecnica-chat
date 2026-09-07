/**
 * Rutas de Chat - 3 Endpoints CRUD para mensajes
 * 
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
import { eq, desc, count } from 'drizzle-orm'
import {
  chatIdParamSchema,
  messageIdParamSchema,
  createMensajeSchema,
  mensajesQuerySchema,
  type ChatIdParam,
  type CreateMensajeInput,
  type MensajesQuery,
} from '../utils/validations'
import type { Env } from '../index'
import type { DrizzleDb } from '../db'

// Tipar las rutas con los mismos bindings y variables que la app principal
const chatRoutes = new Hono<{ Bindings: Env; Variables: { db: DrizzleDb } }>()

// Hook personalizado para errores de Zod - formato SPEC: { status: "error", message: "..." }
const zodErrorHook = (result: any, c: any) => {
  if (!result.success) {
    const errorMessage = result.error.issues.map((i: any) => i.message).join(', ')
    return c.json({ status: 'error', message: errorMessage }, 400)
  }
}

/**
 * GET /chats/:chatId/mensajes
 * Lista mensajes de un chat ordenados cronológicamente (más antiguos primero)
 * Query params: limit (default 50), offset (default 0)
 * 
 * Respuesta: { status: "success", mensajes: Mensaje[], total: number, limit: number, offset: number }
 */
chatRoutes.get(
  '/chats/:chatId/mensajes',
  zValidator('param', chatIdParamSchema, zodErrorHook),
  zValidator('query', mensajesQuerySchema, zodErrorHook),
  async (c) => {
    const db = c.get('db')
    const { chatId } = c.req.valid('param') as ChatIdParam
    const { limit, offset } = c.req.valid('query') as MensajesQuery

    // Verificar que el chat existe
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (chat.length === 0) {
      return c.json({ status: 'error', message: 'Chat no encontrado' }, 404)
    }

    // Obtener mensajes con paginación (más antiguos primero = ASC)
    const mensajesList = await db
      .select()
      .from(mensajes)
      .where(eq(mensajes.chatId, chatId))
      .orderBy(mensajes.createdAt) // ASC = más antiguos primero
      .limit(limit)
      .offset(offset)

    // Contar total para paginación (usando count() eficiente)
    const totalResult = await db
      .select({ total: count() })
      .from(mensajes)
      .where(eq(mensajes.chatId, chatId))

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
  zValidator('param', chatIdParamSchema, zodErrorHook),
  zValidator('json', createMensajeSchema, zodErrorHook),
  async (c) => {
    const db = c.get('db')
    const { chatId } = c.req.valid('param') as ChatIdParam
    const { contenido } = c.req.valid('json') as CreateMensajeInput

    // Verificar que el chat existe
    const chat = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (chat.length === 0) {
      return c.json({ status: 'error', message: 'Chat no encontrado' }, 404)
    }

    // Insertar mensaje con direccion FIJA 'saliente' (negocio responde)
    const [nuevoMensaje] = await db
      .insert(mensajes)
      .values({ chatId, contenido, direccion: 'saliente' })
      .returning()

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
  zValidator('param', messageIdParamSchema, zodErrorHook),
  async (c) => {
    const db = c.get('db')
    const { id } = c.req.valid('param') as { id: number }

    // Eliminar y retornar el mensaje eliminado
    const [mensajeEliminado] = await db
      .delete(mensajes)
      .where(eq(mensajes.id, id))
      .returning()

    if (!mensajeEliminado) {
      return c.json({ status: 'error', message: 'Mensaje no encontrado' }, 404)
    }

    return c.json({ status: 'success', mensaje: mensajeEliminado })
  }
)

export default chatRoutes