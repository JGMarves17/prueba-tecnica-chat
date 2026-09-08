/**
 * Cliente API para comunicarse con el backend
 * Usa fetch nativo con tipado TypeScript
 * Contrato API:
 * - Success: { status: "success", mensajes: [...] } | { status: "success", mensaje: {...} }
 * - Error:   { status: "error", message: "..." }
 */
import type { Mensaje, MensajesResponse, CreateMensajeInput, CreateMensajeResponse, DeleteMensajeResponse, ApiError, Chat, ChatResponse } from '@/types'

const API_BASE = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('NEXT_PUBLIC_API_URL no configurada. Configúrala en Vercel Dashboard > Settings > Environment Variables.')
    }
    return 'http://localhost:8787'
  }
  return url
})()

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
    const response = await fetch(`${API_BASE}/chats/${chatId}/mensajes?limit=${limit}&offset=${offset}`, {
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
    const response = await fetch(`${API_BASE}/chats/${chatId}/mensajes`, {
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
    const response = await fetch(`${API_BASE}/mensajes/${id}`, {
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
    const response = await fetch(`${API_BASE}/chats/${chatId}`, {
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