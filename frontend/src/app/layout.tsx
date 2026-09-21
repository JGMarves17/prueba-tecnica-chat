/**
 * Layout raíz de la aplicación
 * - Providers de React Query (client component)
 * - Fuentes y estilos globales
 * - Metadata por defecto
 */
import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/Providers'
import './globals.css'

// ============================================
// METADATA Y VIEWPORT
// ============================================
// metadata: <title> y <meta description> de todas las páginas.
// viewport.themeColor: color de la barra del navegador en móvil,
// distinto según el modo claro u oscuro del sistema.
export const metadata: Metadata = {
  title: 'Chat SaaS',
  description: 'Interfaz de chat para CRM multi-tenant',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#030712' },
  ],
}

/**
 * Layout raíz (Server Component por defecto en Next.js 14 App Router)
 * - No tiene 'use client' porque solo renderiza HTML estático + providers
 * - suppressHydrationWarning: silencia el aviso de hidratación si algo externo
 *   (por ejemplo, una extensión del navegador) modifica atributos de <html>.
 *   No hace falta por el modo oscuro: aquí va por media query, sin clase .dark.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preconnect para cargar fuente Inter más rápido */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      {/*
        antialiased: suavizado de fuentes
        bg-gray-50 dark:bg-gray-950: fondo claro u oscuro según prefers-color-scheme
      */}
      <body className="antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        {/* Providers: QueryClientProvider + ReactQueryDevTools (solo dev) */}
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}