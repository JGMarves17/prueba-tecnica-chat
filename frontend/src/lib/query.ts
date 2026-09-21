/**
 * Hooks de React Query para gestión de estado del servidor
 * Cache, invalidación, optimistic updates, etc.
 * Contrato API: { status: "success", ... } | { status: "error", message: "..." }
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, apiKeys } from '@/lib/api'
import type { Mensaje, CreateMensajeInput, MensajesResponse, CreateMensajeResponse, DeleteMensajeResponse, ChatResponse } from '@/types'

/**
 * Hook para obtener mensajes de un chat
 * - Cache automático por chatId
 * - Refetch en foco de ventana: deshabilitado (refetchOnWindowFocus: false)
 * - Paginación soportada
 */
export function useMensajes(chatId: number, limit = 50, offset = 0, enabled = true) {
  return useQuery({
    queryKey: apiKeys.mensajes(chatId),        // Clave única por chatId
    queryFn: () => api.getMensajes(chatId, limit, offset),
    enabled: enabled && !!chatId,              // Solo ejecuta si chatId válido
    staleTime: 30_000,                         // 30 segundos: datos "frescos" sin refetch
    refetchOnWindowFocus: false,               // No refetch al cambiar de pestaña
  })
}

/**
 * Hook para enviar un mensaje
 * - Optimistic update para UI instantánea
 * - Invalida cache de mensajes tras éxito
 */
export function useSendMensaje(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateMensajeInput) => api.sendMensaje(chatId, data),
    onMutate: async (newMensaje) => {
      // 1. Cancelar queries salientes para evitar race conditions
      await queryClient.cancelQueries({ queryKey: apiKeys.mensajes(chatId) })

      // 2. Snapshot del cache anterior (para rollback si falla)
      const previousMensajes = queryClient.getQueryData<MensajesResponse>(apiKeys.mensajes(chatId))

      // 3. Optimistic update: agregar mensaje temporal INSTANTÁNEO
      const optimisticMensaje: Mensaje = {
        id: Date.now(),              // ID temporal (ms); onSuccess lo cambia por el real al revalidar
        chatId,
        contenido: newMensaje.contenido,
        direccion: 'saliente',       // Server fija 'saliente'
        createdAt: new Date().toISOString(),
      }

      // Actualiza cache optimísticamente
      queryClient.setQueryData<MensajesResponse>(
        apiKeys.mensajes(chatId),
        (old) => ({
          status: 'success' as const,
          mensajes: [...(old?.mensajes || []), optimisticMensaje],
          total: (old?.total || 0) + 1,
          limit: old?.limit || 50,
          offset: old?.offset || 0,
        })
      )

      // Retorna contexto para rollback en onError
      return { previousMensajes }
    },
    onError: (err, newMensaje, context) => {
      // Rollback en error: restaura cache anterior
      if (context?.previousMensajes) {
        queryClient.setQueryData(apiKeys.mensajes(chatId), context.previousMensajes)
      }
    },
    onSuccess: () => {
      // Invalidar y refetch para obtener datos reales del servidor
      queryClient.invalidateQueries({ queryKey: apiKeys.mensajes(chatId) })
    },
  })
}

/**
 * Hook para eliminar un mensaje
 * - Optimistic update
 * - Invalida cache tras éxito
 */
export function useDeleteMensaje(chatId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => api.deleteMensaje(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: apiKeys.mensajes(chatId) })
      const previousMensajes = queryClient.getQueryData<MensajesResponse>(apiKeys.mensajes(chatId))

      // Optimistic update: quita mensaje del cache
      queryClient.setQueryData<MensajesResponse>(
        apiKeys.mensajes(chatId),
        (old) => ({
          status: 'success' as const,
          mensajes: (old?.mensajes || []).filter((m) => m.id !== id),
          total: Math.max(0, (old?.total || 1) - 1),
          limit: old?.limit || 50,
          offset: old?.offset || 0,
        })
      )

      return { previousMensajes }
    },
    onError: (err, id, context) => {
      // Rollback en error
      if (context?.previousMensajes) {
        queryClient.setQueryData(apiKeys.mensajes(chatId), context.previousMensajes)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiKeys.mensajes(chatId) })
    },
  })
}

/**
 * Hook para obtener info de un chat
 * - Cache automático por chatId
 */
export function useChat(chatId: number, enabled = true) {
  return useQuery({
    queryKey: apiKeys.chat(chatId),
    queryFn: () => api.getChat(chatId),
    enabled: enabled && !!chatId,
    staleTime: 60_000, // 1 minuto (info de chat cambia poco)
    refetchOnWindowFocus: false,
    select: (data: ChatResponse) => data.chat,  // Extrae solo el objeto chat
  })
}
