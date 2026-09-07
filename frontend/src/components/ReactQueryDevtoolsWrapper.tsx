'use client'

import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useEffect, useState } from 'react'

export function ReactQueryDevtoolsWrapper() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  // Solo renderizar en desarrollo
  if (process.env.NODE_ENV !== 'development') return null

  return <ReactQueryDevtools initialIsOpen={false} />
}