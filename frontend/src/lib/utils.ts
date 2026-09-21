/**
 * Utilidades compartidas
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Combina clases de Tailwind inteligentemente
 * Evita conflictos y permite overrides
 * 
 * clsx: maneja condicionales, arrays, objetos
 * twMerge: resuelve conflictos de Tailwind (ej: p-2 p-4 → p-4)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formatea fecha para mostrar en UI (solo hora: "14:30")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formatea fecha completa (fecha + hora: "15/01/2024, 14:30")
 */
export function formatDateFull(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
