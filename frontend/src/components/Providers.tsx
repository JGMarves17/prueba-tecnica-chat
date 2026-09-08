'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { ReactNode } from 'react'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        // No reintentar 404 (no van a cambiar) ni 400 (error del cliente)
        retry: (failureCount, error) => {
          if (error instanceof Error && (error.message.includes('404') || error.message.includes('400'))) {
            return false
          }
          return failureCount < 1
        },
      },
      mutations: {
        // No reintentar mutaciones automáticamente
        retry: 0,
      },
    },
  })
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(makeQueryClient)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {mounted && process.env.NODE_ENV === 'development' && (
        // buttonPosition bottom-left: por defecto va abajo a la derecha,
        // justo encima del boton Enviar, y lo hace inclicable en desarrollo.
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
    </QueryClientProvider>
  )
}