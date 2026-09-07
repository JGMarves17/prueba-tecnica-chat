/**
 * Esquemas de validación con Zod
 * Validan inputs de los endpoints antes de tocar la base de datos
 * Previenen inyección SQL, datos malformados, etc.
 * 
 * Formato de error personalizado via zodErrorHook en routes
 */
import { z } from 'zod'

/**
 * Validación para chatId en params
 * Debe ser número entero positivo
 */
export const chatIdParamSchema = z.object({
  chatId: z.string().regex(/^\d+$/, 'chatId debe ser un número entero positivo').transform(Number),
})

/**
 * Validación para messageId en params
 */
export const messageIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id debe ser un número entero positivo').transform(Number),
})

/**
 * Validación para crear mensaje (POST /chats/:chatId/mensajes)
 * contenido: string no vacío (trim + min 1), máx 5000 chars
 * NO incluye direccion: la fija el servidor a 'saliente'
 */
export const createMensajeSchema = z.object({
  contenido: z.string().trim().min(1, 'El contenido es requerido').max(5000, 'Máximo 5000 caracteres'),
})

/**
 * Validación para query params de paginación (GET /chats/:chatId/mensajes)
 */
export const mensajesQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).optional().default('0'),
})

// Tipos inferidos para uso en handlers
export type ChatIdParam = z.infer<typeof chatIdParamSchema>
export type MessageIdParam = z.infer<typeof messageIdParamSchema>
export type CreateMensajeInput = z.infer<typeof createMensajeSchema>
export type MensajesQuery = z.infer<typeof mensajesQuerySchema>