'use client'

/**
 * Burbuja de un mensaje del chat
 * - saliente (negocio) a la derecha, entrante (cliente) a la izquierda
 * - La hora va en el flujo, no en absolute: asi nunca se solapa con el texto
 * - Boton de eliminar visible al pasar el raton por la burbuja (group-hover)
 *   y tambien al tabular hasta el (focus), para teclado
 *
 * El max-w va en la BURBUJA, no en el wrapper: si estuviera en el wrapper,
 * justify-end alinearia dentro de ese ancho y los mensajes salientes no
 * llegarian al borde derecho.
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
        'group flex w-full items-end gap-2 px-1 py-1 animate-fade-in',
        isSaliente ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar del cliente */}
      {!isSaliente && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-300 text-xs font-medium">
          C
        </div>
      )}

      <div
        className={cn(
          'relative rounded-2xl px-4 py-2 text-sm max-w-[75%] sm:max-w-[60%] shadow-sm',
          isSaliente
            ? 'bg-primary-500 text-white rounded-br-md'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md'
        )}
      >
        {/* pr-6 reserva sitio para el boton de eliminar en la primera linea */}
        <p className="whitespace-pre-wrap break-words pr-6">{mensaje.contenido}</p>

        <time
          className={cn(
            'block text-right text-[10px] mt-1 tabular-nums',
            isSaliente ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
          )}
          dateTime={mensaje.createdAt}
        >
          {formatDate(mensaje.createdAt)}
        </time>

        {onDelete && (
          <button
            onClick={() => onDelete(mensaje.id)}
            className={cn(
              'absolute top-1 right-1 p-1 rounded-md transition-opacity',
              'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
              isSaliente
                ? 'text-white/60 hover:text-white hover:bg-white/20'
                : 'text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/10'
            )}
            aria-label={`Eliminar mensaje: ${mensaje.contenido.slice(0, 40)}`}
            title="Eliminar mensaje"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Avatar del negocio */}
      {isSaliente && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-medium">
          N
        </div>
      )}
    </div>
  )
}
