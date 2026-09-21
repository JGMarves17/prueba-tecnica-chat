/**
 * Configuración de Tailwind CSS v3
 * Documentación: https://tailwindcss.com/docs/configuration
 */
import type { Config } from 'tailwindcss'

const config: Config = {
  // ============================================
  // CONTENT - ARCHIVOS A ESCANEAR PARA CLASES
  // ============================================
  // Tailwind escanea estos archivos y genera solo el CSS que se usa (tree-shaking)
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // ============================================
  // THEME - PERSONALIZACIÓN DEL SISTEMA DE DISEÑO
  // ============================================
  theme: {
    extend: {
      // ============================================
      // COLORES - PALETA PRIMARIA (AZUL)
      // ============================================
      // Escala completa 50-950 (misma que el azul de Tailwind) para poder
      // escribir clases como bg-primary-500 en lugar de bg-blue-500.
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',  // Fondo de los avatares y de la cabecera
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // Color principal: burbujas salientes, botón Enviar, anillo de foco
          600: '#2563eb',  // Hover del botón Enviar
          700: '#1d4ed8',  // Texto sobre fondo primary-100 (avatares, cabecera)
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },

      // ============================================
      // FUENTES
      // ============================================
      fontFamily: {
        // Inter como fuente principal (cargada en layout.tsx via Google Fonts)
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },

  // ============================================
  // PLUGINS
  // ============================================
  plugins: [],  // Sin plugins adicionales (forms, typography, etc.)

  // ============================================
  // DARK MODE
  // ============================================
  // 'media' = usa prefers-color-scheme del sistema (auto)
  // 'class' = control manual via clase .dark en <html>
  // 
  // IMPORTANTE: Con 'class' hay que añadir .dark al <html> manualmente.
  // Aquí usamos 'media' para simplicidad (respeta preferencia del OS).
  darkMode: 'media', // sigue prefers-color-scheme; con 'class' nadie ponía .dark y las 27 clases dark: eran CSS muerto

}

export default config
