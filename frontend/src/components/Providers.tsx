'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { ReactNode } from 'react'

/**
 * Crea una instancia de QueryClient con configuración por defecto
 * Providers la guarda con useState, así que hay una instancia por montaje de la app
 */
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,              // 30s: datos considerados "frescos" sin refetch
        refetchOnWindowFocus: false,   // No refetch al cambiar de pestaña/ventana
        // No reintentar 404 (no van a cambiar) ni 400 (error del cliente)
        retry: (failureCount, error) => {
          if (error instanceof Error && (error.message.includes('404') || error.message.includes('400'))) {
            return false  // No reintentar errores de cliente
          }
          return failureCount < 1      // Máximo 1 reintento para otros errores
        },
      },
      mutations: {
        // No reintentar mutaciones automáticamente (evita duplicados)
        retry: 0,
      },
    },
  })
}

/**
 * Provider principal de la app
 * - QueryClientProvider: provee React Query a toda la app
 * - ReactQueryDevtools: panel de debugging (solo en desarrollo, montado)
 */
export function Providers({ children }: { children: ReactNode }) {
  // useState con función inicializadora: el QueryClient se crea una vez por
  // montaje del componente y se conserva entre renders (no en cada render).
  const [queryClient] = useState(makeQueryClient)
  
  // mounted: evita hidratación mismatch (devtools solo en cliente)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools solo en desarrollo y tras hidratación (mounted) */}
      {mounted && process.env.NODE_ENV === 'development' && (
        // buttonPosition="bottom-left": por defecto va abajo a la derecha,
        // justo encima del botón Enviar, y lo hace inaccesible en desarrollo.
        // bottom-left lo mueve a la esquina inferior izquierda.
        <ReactQueryDevtools 
          initialIsOpen={false} 
          buttonPosition="bottom-left" 
        />
      )}
    </QueryClientProvider>
  )
}