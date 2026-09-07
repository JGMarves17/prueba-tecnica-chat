/**
 * Cliente API para comunicarse con el backend
 * Usa fetch nativo con tipado TypeScript
 * Contrato API:
 * - Success: { status: "success", mensajes: [...] } | { status: "success", mensaje: {...} }
 * - Error:   { status: "error", message: "..." }
 */
import type { Mensaje, MensajesResponse, CreateMensajeInput, CreateMensajeResponse, DeleteMensajeResponse, ApiError } from '@/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787'

/**
 * Helper para manejar respuestas de la API con formato SPEC
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const data = await response.json()
  
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
}

/**
 * Keys para React Query
 */
export const apiKeys = {
  mensajes: (chatId: number) => ['mensajes', chatId] as const,
}