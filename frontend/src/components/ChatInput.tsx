'use client'

/**
 * Componente para enviar mensajes en el chat
 * - Validación básica (no vacío, trim)
 * - Enter para enviar, Shift+Enter para nueva línea
 * - Loading state durante envío
 * - Accesible: form nativo, labels, aria
 * - SIN selector de dirección: el servidor fija 'saliente'
 * - La mutación viene del padre: una sola instancia para toda la pantalla
 */
import { useState, FormEvent } from 'react'
import type { UseMutationResult } from '@tanstack/react-query'
import type { CreateMensajeInput, CreateMensajeResponse } from '@/types'

interface ChatInputProps {
  sendMutation: UseMutationResult<CreateMensajeResponse, Error, CreateMensajeInput, unknown>
}

export function ChatInput({ sendMutation }: ChatInputProps) {
  const [contenido, setContenido] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const trimmed = contenido.trim()
    if (!trimmed) return

    // Se limpia al enviar; si falla se restaura para no perder lo escrito
    setContenido('')
    sendMutation.mutate(
      { contenido: trimmed },
      { onError: () => setContenido((actual) => actual || trimmed) }
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full shrink-0">
      <div className="p-4 safe-bottom border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex gap-2 items-end">
          {/* Textarea para el mensaje */}
          <textarea
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje…"
          aria-describedby="hint-envio"
          rows={1}
          className="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none min-h-[44px] max-h-[120px]"
          aria-label="Contenido del mensaje"
          disabled={sendMutation.isPending}
        />

          {/* Botón de envío */}
          <button
          type="submit"
          disabled={!contenido.trim() || sendMutation.isPending}
          className="flex-shrink-0 px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-xl hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Enviar mensaje"
        >
          {sendMutation.isPending ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Enviando...
            </span>
          ) : (
            'Enviar'
          )}
          </button>
        </div>

        {/* Pista de teclado: fuera del placeholder para que no desborde en móvil */}
        <p id="hint-envio" className="hidden sm:block mt-2 text-[11px] text-gray-400 dark:text-gray-500">
          Enter para enviar · Shift+Enter para nueva línea
        </p>

        {/* Error de envío */}
        {sendMutation.isError && (
          <p className="mt-2 text-sm text-red-500 dark:text-red-400" role="alert">
            {(sendMutation.error as Error)?.message || 'No se pudo enviar el mensaje'}
          </p>
        )}
      </div>
    </form>
  )
}
