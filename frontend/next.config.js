/**
 * Configuración de Next.js 14
 * Documentación: https://nextjs.org/docs/app/api-reference/next-config-js
 */
const nextConfig = {
  // ============================================
  // MODO ESTRICTO DE REACT
  // ============================================
  reactStrictMode: true,  // Doble renderizado en dev para detectar side effects

  // ============================================
  // EXPERIMENTAL FEATURES
  // ============================================
  experimental: {
    // Aumenta límite de body para Server Actions (por defecto 1MB)
    serverActions: { bodySizeLimit: '2mb' },
  },
}

module.exports = nextConfig