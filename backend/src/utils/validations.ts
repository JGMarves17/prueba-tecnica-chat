/**
 * Esquemas de validación con Zod
 * Validan forma y límites de los inputs antes de tocar la base de datos
 * La prevención de inyección SQL la hace Drizzle (queries parametrizadas)
 * 
 * Formato de error personalizado via zodErrorHook en routes
 */
import { z } from 'zod'

// ============================================
// CONSTANTES DE VALIDACIÓN
// ============================================
const MAX_INT = 2_147_483_647      // Máximo valor INT32 (PostgreSQL INT4)
const MAX_LIMIT = 100              // Máximo de mensajes por página: evita traer el chat entero de golpe
const NO_NULL_BYTE = /^[^\u0000]*$/  // Regex: prohíbe byte nulo (\u0000)
const NO_LEADING_ZEROS = /^(0|[1-9]\d*)$/  // Regex: prohíbe ceros a la izquierda (01, 001, etc.)

/**
 * Validación para chatId en params (:chatId)
 * Debe ser número entero positivo, sin ceros a la izquierda, max 2^31-1
 * 
 * Pipeline de transformación:
 * 1. regex(NO_LEADING_ZEROS)  → Rechaza "01", "001", "007" (y de paso todo lo que no sean dígitos)
 * 2. regex(/^\d+$/)           → Solo dígitos: "abc", "1.5", "-1". Redundante con el paso 1,
 *                               pero deja un mensaje de error más claro
 * 3. transform(Number)        → Convierte string "123" → number 123
 * 4. refine(n => n > 0 && n <= MAX_INT) → Rango válido INT32
 */
export const chatIdParamSchema = z.object({
  chatId: z.string()
    .regex(NO_LEADING_ZEROS, 'chatId no debe tener ceros a la izquierda')
    .regex(/^\d+$/, 'chatId debe ser un número entero positivo')
    .transform(Number)
    .refine(n => n > 0 && n <= MAX_INT, `chatId debe estar entre 1 y ${MAX_INT}`),
})

/**
 * Validación para messageId en params (:id)
 * Mismas reglas que chatId: entero positivo, sin leading zeros, max INT32
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
 * 
 * Pipeline:
 * 1. trim()           → Quita espacios al inicio/final ("  hola  " → "hola")
 * 2. min(1)           → Rechaza string vacío tras trim
 * 3. max(5000)        → Límite de longitud del mensaje. Ojo: cuando Zod lo mira, el body
 *                        ya se ha recibido y parseado entero; solo impide guardarlo
 * 4. regex(NO_NULL_BYTE) → Rechaza byte nulo \u0000 (PostgreSQL lo rechaza en TEXT)
 */
export const createMensajeSchema = z.object({
  contenido: z.string()
    .trim()                                    // Quita espacios inicio/final
    .min(1, 'El contenido es requerido')       // No vacío tras trim
    .max(5000, 'Máximo 5000 caracteres')       // Límite superior
    .regex(NO_NULL_BYTE, 'El contenido no puede contener bytes nulos'), // Sin esto, el INSERT fallaría con 500
})

/**
 * Validación para query params de paginación (GET /chats/:chatId/mensajes)
 * limit: máx 100 (evita traer demasiados registros de golpe)
 * offset: máx 2^31-1 (rango INT32)
 * 
 * Pipeline para limit/offset:
 * 1. regex(/^\d+$/)  → Solo dígitos
 * 2. transform(Number) → String → Number
 * 3. refine()        → Rango válido
 * 4. optional().default() → Valores por defecto si no vienen en query
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

// ============================================
// TIPOS INFERIDOS PARA USO EN HANDLERS
// ============================================
// z.infer<typeof Schema> extrae el tipo TypeScript del schema Zod
// Evita duplicar tipos: el schema ES la fuente de verdad
export type ChatIdParam = z.infer<typeof chatIdParamSchema>
export type MessageIdParam = z.infer<typeof messageIdParamSchema>
export type CreateMensajeInput = z.infer<typeof createMensajeSchema>
export type MensajesQuery = z.infer<typeof mensajesQuerySchema>