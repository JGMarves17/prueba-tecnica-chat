'use client'

/**
 * Componente para mostrar un mensaje individual en el chat
 * Soporta direcciones: saliente (negocio) / entrante (cliente)
 * Accesible: usa role="log" y aria-live en el CONTENEDOR (no por burbuja)
 * Incluye botón de eliminar con confirmación
 */
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import type { Mensaje } from '@/types'

interface ChatMessageProps {
  mensaje: Mensaje
  onDelete?: (id: number) => void
}

export function ChatMessage({ mensaje, onDelete }: ChatMessageProps) {
  const isSaliente = mensaje.direccion === 'saliente'

  return (
    <div
      className={cn(
        'flex gap-2 px-4 py-2 max-w-[80%] animate-fade-in relative',
        isSaliente ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar placeholder para mensajes entrantes */}
      {!isSaliente && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-medium">
          C
        </div>
      )}

      <div
        className={cn(
          'relative rounded-2xl px-4 py-2 text-sm max-w-xs',
          isSaliente
            ? 'bg-primary-500 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
        )}
      >
        <p className="whitespace-pre-wrap break-words pr-8">{mensaje.contenido}</p>

        <time
          className={cn(
            'absolute bottom-0 right-2 text-[10px] opacity-60',
            isSaliente ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          )}
          dateTime={mensaje.createdAt}
        >
          {formatDate(mensaje.createdAt)}
        </time>

        {/* Botón eliminar - solo visible en hover/focus */}
        {onDelete && (
          <button
            onClick={() => onDelete(mensaje.id)}
            className="absolute top-1 right-1 p-1 rounded opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            aria-label={`Eliminar mensaje ${mensaje.id}`}
            title="Eliminar mensaje"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Avatar placeholder para mensajes salientes */}
      {isSaliente && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
          N
        </div>
      )}
    </div>
  )
}