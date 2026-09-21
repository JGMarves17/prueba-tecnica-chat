/**
 * Configuración de Vitest para tests del backend
 * Documentación: https://vitest.dev/config/
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // ============================================
    // ENTORNO DE EJECUCIÓN
    // ============================================
    environment: 'node',        // Tests corren en Node.js (no jsdom/happy-dom)
    globals: true,              // Permite usar describe/it/expect sin importar
    
    // ============================================
    // ARCHIVOS DE TEST
    // ============================================
    include: ['tests/**/*.test.ts'],  // Patrones de archivos a ejecutar

    // ============================================
    // COBERTURA DE CÓDIGO
    // ============================================
    coverage: {
      provider: 'v8',                    // Usa V8 built-in coverage (rápido, nativo)
      reporter: ['text', 'json', 'html'], // Reportes: consola, JSON (CI), HTML (visual)
      // Opcional: thresholds para CI
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },
  },
})