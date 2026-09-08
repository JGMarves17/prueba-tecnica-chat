'use client'

/**
 * Página de chat individual
 * - Lista de mensajes con useQuery (React Query)
 * - Envío de mensajes con useMutation + optimistic updates
 * - Eliminar mensaje con confirmación + manejo de errores
 * - Auto-scroll al final
 * - Estados: loading, error, empty
 * - Dark mode support
 * 
 * Next 14: params es objeto plano { id: string }, NO Promise
 */
import { useEffect, useRef, useState } from 'react'
import { useMensajes, useSendMensaje, useDeleteMensaje, useChat } from '@/lib/query'
import { ChatMessage } from '@/components/ChatMessage'
import { ChatInput } from '@/components/ChatInput'
import { cn } from '@/lib/utils'
import type { Mensaje } from '@/types'

interface ChatPageProps {
  params: { id: string } // Next 14: params es objeto plano
}

export default function ChatPage({ params }: ChatPageProps) {
  // Validar chatId: parseInt trunca "1abc" -> 1, así que validamos formato exacto
  const rawId = params.id
  const isValidChatId = /^\d+$/.test(rawId) && parseInt(rawId, 10) > 0
  const chatId = isValidChatId ? parseInt(rawId, 10) : 0

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const { data, isLoading, isError, error, refetch } = useMensajes(chatId, 50, 0, isValidChatId)
  const { data: chat, isLoading: chatLoading } = useChat(chatId, isValidChatId)
  const sendMutation = useSendMensaje(chatId)
  const deleteMutation = useDeleteMensaje(chatId)

  // Auto-scroll al final cuando llegan nuevos mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.mensajes.length, sendMutation.isSuccess])

  // Scroll al final al montar
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [])

  const handleDelete = (id: number) => {
    if (confirm('¿Eliminar este mensaje?')) {
      setDeleteError(null)
      deleteMutation.mutate(id, {
        onError: (error) => {
          setDeleteError(error.message || 'No se pudo eliminar el mensaje')
        },
        onSuccess: () => {
          setDeleteError(null)
        }
      })
    }
  }

  // Chat ID inválido (ej: /chats/abc, /chats/0, /chats/1abc)
  if (!isValidChatId) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-8">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Chat inválido</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">El ID del chat debe ser un número positivo sin ceros a la izquierda</p>
        </div>
      </div>
    )
  }

  if (isLoading || chatLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Cargando chat...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    // Manejar "Failed to fetch" y otros errores de red
    const errorMessage = error instanceof TypeError && error.message === 'Failed to fetch'
      ? 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.'
      : (error as Error)?.message || 'No se pudieron cargar los mensajes'

    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center p-8">
          <svg className="mx-auto h-16 w-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Error al cargar</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">{errorMessage}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  const mensajes = data?.mensajes || []

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header del chat */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
          <span className="text-primary-700 dark:text-primary-300 font-medium">#{chatId}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">{chat?.nombre || `Chat #${chatId}`}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {chat?.telefono && <span>{chat.telefono} &middot; </span>}
            {mensajes.length} mensaje{mensajes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={sendMutation.isPending || deleteMutation.isPending}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          aria-label="Actualizar mensajes"
        >
          <svg className={cn('w-5 h-5', sendMutation.isPending && 'animate-spin')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </header>

      {/* Lista de mensajes */}
      <main 
        role="log" 
        aria-live="polite" 
        aria-label="Conversación del chat"
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <svg className="h-16 w-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">Aún no hay mensajes</p>
            <p className="text-sm mt-1">Sé el primero en enviar un mensaje</p>
          </div>
        ) : (
          <>
            {mensajes.map((mensaje: Mensaje) => (
              <ChatMessage key={mensaje.id} mensaje={mensaje} onDelete={handleDelete} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </main>

      {/* Error de borrado (toast inline) */}
      {deleteError && (
        <div className="mx-4 mb-2 px-4 py-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg" role="alert">
          {deleteError}
        </div>
      )}

      {/* Input para enviar mensajes - pasa sendMutation unificado */}
      <ChatInput sendMutation={sendMutation} />
    </div>
  )
}