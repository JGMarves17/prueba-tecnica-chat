/**
 * Cliente API para comunicarse con el backend
 * Usa fetch nativo con tipado TypeScript
 * Contrato API:
 * - Success: { status: "success", mensajes: [...] } | { status: "success", mensaje: {...} }
 * - Error:   { status: "error", message: "..." }
 */
import type { Mensaje, MensajesResponse, CreateMensajeInput, CreateMensajeResponse, DeleteMensajeResponse, ApiError, Chat, ChatResponse } from '@/types'

/**
 * En desarrollo cae a localhost. En producción no hay valor razonable por
 * defecto, así que se deja vacío y cada llamada falla con un mensaje claro.
 *
 * NO se lanza a nivel de módulo: hacerlo tumba el bundle del cliente entero
 * y el usuario ve una página en blanco. Lanzando dentro de cada petición, el
 * error viaja por React Query y se muestra en la pantalla de error normal.
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:8787')

function baseUrl(): string {
  if (!API_BASE) {
    throw new Error(
      'La URL de la API no está configurada. Define NEXT_PUBLIC_API_URL en las variables de entorno del despliegue y vuelve a desplegar.'
    )
  }
  return API_BASE
}

/**
 * Helper para manejar respuestas de la API con formato SPEC
 * Incluye try/catch para errores de parsing JSON (ej: 502 HTML de Cloudflare)
 */
async function handleResponse<T>(response: Response): Promise<T> {
  let data: unknown
  
  try {
    data = await response.json()
  } catch {
    // Respuesta no es JSON válido (ej: HTML de error 502/503)
    throw new Error(`HTTP ${response.status}: Respuesta no válida del servidor`)
  }
  
  if (!response.ok) {
    // Error response: { status: "error", message: "..." }
    const error = data as ApiError
    throw new Error(error.message || `HTTP ${response.status}`)
  }
  
  // Success response: { status: "success", ... }
  const successData = data as { status: string } & T
  if (successData.status !== 'success') {
    throw new Error('Respuesta inesperada del servidor')
  }
  
  return data as T
}

/**
 * API client con métodos tipados
 */
export const api = {
  /**
   * Obtener mensajes de un chat con paginación
   * GET /chats/:chatId/mensajes
   */
  getMensajes: async (chatId: number, limit = 50, offset = 0): Promise<MensajesResponse> => {
    const response = await fetch(`${baseUrl()}/chats/${chatId}/mensajes?limit=${limit}&offset=${offset}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    return handleResponse<MensajesResponse>(response)
  },

  /**
   * Enviar un nuevo mensaje
   * POST /chats/:chatId/mensajes
   * Body: { contenido: string } -- direccion la fija el servidor
   */
  sendMensaje: async (chatId: number, data: CreateMensajeInput): Promise<CreateMensajeResponse> => {
    const response = await fetch(`${baseUrl()}/chats/${chatId}/mensajes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<CreateMensajeResponse>(response)
  },

  /**
   * Eliminar un mensaje
   * DELETE /mensajes/:id
   */
  deleteMensaje: async (id: number): Promise<DeleteMensajeResponse> => {
    const response = await fetch(`${baseUrl()}/mensajes/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
    return handleResponse<DeleteMensajeResponse>(response)
  },

  /**
   * Obtener info de un chat
   * GET /chats/:chatId
   */
  getChat: async (chatId: number): Promise<ChatResponse> => {
    const response = await fetch(`${baseUrl()}/chats/${chatId}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    return handleResponse<ChatResponse>(response)
  },
}

/**
 * Keys para React Query
 */
export const apiKeys = {
  mensajes: (chatId: number) => ['mensajes', chatId] as const,
  chat: (chatId: number) => ['chat', chatId] as const,
}