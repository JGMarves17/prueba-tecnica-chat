/**
 * Tipos compartidos entre frontend y backend
 * Contrato API SPEC:
 * - Success: { status: "success", mensajes: [...] } | { status: "success", mensaje: {...} }
 * - Error:   { status: "error", message: "..." }
 */

export type DireccionMensaje = 'saliente' | 'entrante'

export interface Mensaje {
  id: number
  chatId: number
  contenido: string
  direccion: DireccionMensaje
  createdAt: string // ISO string from API
}

export interface Chat {
  id: number
  empresaId: number
  nombre: string
  telefono: string
  createdAt: string
}

// Respuestas de la API
export interface MensajesResponse {
  status: 'success'
  mensajes: Mensaje[]
  total: number
  limit: number
  offset: number
}

export interface ChatResponse {
  status: 'success'
  chat: Chat
}

export interface CreateMensajeResponse {
  status: 'success'
  mensaje: Mensaje
}

export interface DeleteMensajeResponse {
  status: 'success'
  mensaje: Mensaje
}

export interface ApiError {
  status: 'error'
  message: string
}

// Inputs
export interface CreateMensajeInput {
  contenido: string
  // direccion NO va aquí: la fija el servidor a 'saliente'
}