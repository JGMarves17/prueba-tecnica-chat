/**
 * Esquemas de validación con Zod
 * Validan forma y límites de los inputs antes de tocar la base de datos
 * La prevención de inyección SQL la hace Drizzle (queries parametrizadas)
 * 
 * Formato de error personalizado via zodErrorHook en routes
 */
import { z } from 'zod'

const MAX_INT = 2_147_483_647
const MAX_LIMIT = 100
const NO_NULL_BYTE = /^[^\u0000]*$/
const NO_LEADING_ZEROS = /^(0|[1-9]\d*)$/

/**
 * Validación para chatId en params
 * Debe ser número entero positivo, sin ceros a la izquierda, max 2^31-1
 */
export const chatIdParamSchema = z.object({
  chatId: z.string()
    .regex(NO_LEADING_ZEROS, 'chatId no debe tener ceros a la izquierda')
    .regex(/^\d+$/, 'chatId debe ser un número entero positivo')
    .transform(Number)
    .refine(n => n > 0 && n <= MAX_INT, `chatId debe estar entre 1 y ${MAX_INT}`),
})

/**
 * Validación para messageId en params
 */
export const messageIdParamSchema = z.object({
  id: z.string()
    .regex(NO_LEADING_ZEROS, 'id no debe tener ceros a la izquierda')
    .regex(/^\d+$/, 'id debe ser un número entero positivo')
    .transform(Number)
    .refine(n => n > 0 && n <= MAX_INT, `id debe estar entre 1 y ${MAX_INT}`),
})

/**
 * Validación para crear mensaje (POST /chats/:chatId/mensajes)
 * contenido: string no vacío (trim + min 1), máx 5000 chars, sin byte nulo
 * NO incluye direccion: la fija el servidor a 'saliente'
 */
export const createMensajeSchema = z.object({
  contenido: z.string()
    .trim()
    .min(1, 'El contenido es requerido')
    .max(5000, 'Máximo 5000 caracteres')
    .regex(NO_NULL_BYTE, 'El contenido no puede contener bytes nulos'),
})

/**
 * Validación para query params de paginación (GET /chats/:chatId/mensajes)
 * limit: máx 100, offset: máx 2^31-1
 */
export const mensajesQuerySchema = z.object({
  limit: z.string()
    .regex(/^\d+$/, 'limit debe ser un número')
    .transform(Number)
    .refine(n => n > 0 && n <= MAX_LIMIT, `limit debe estar entre 1 y ${MAX_LIMIT}`)
    .optional()
    .default('50'),
  offset: z.string()
    .regex(/^\d+$/, 'offset debe ser un número')
    .transform(Number)
    .refine(n => n >= 0 && n <= MAX_INT, `offset debe estar entre 0 y ${MAX_INT}`)
    .optional()
    .default('0'),
})

// Tipos inferidos para uso en handlers
export type ChatIdParam = z.infer<typeof chatIdParamSchema>
export type MessageIdParam = z.infer<typeof messageIdParamSchema>
export type CreateMensajeInput = z.infer<typeof createMensajeSchema>
export type MensajesQuery = z.infer<typeof mensajesQuerySchema>