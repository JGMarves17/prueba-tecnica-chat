'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Página raíz - Redirige al chat de prueba
 */
export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/chats/1')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Redirigiendo al chat de prueba...</p>
      </div>
    </div>
  )
}