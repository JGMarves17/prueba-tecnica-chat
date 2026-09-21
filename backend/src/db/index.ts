/**
 * Conexión a Neon Postgres usando @neondatabase/serverless
 * Compatible con Cloudflare Workers (edge runtime)
 * Usa Drizzle ORM para queries type-safe
 * 
 * IMPORTANTE: En Workers, DATABASE_URL viene en c.env, no en process.env
 * Se crea el cliente por request para acceder a los bindings correctamente
 */
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import type { Env } from '../index'

// ============================================
// TIPO DE LA BASE DE DATOS DRIZZLE TIPADA
// ============================================
// NeonHttpDatabase<typeof schema> proporciona type-safety completo:
// - Autocompletado en queries
// - Type-checking en insert/update/delete
// - Inferencia automática de tipos de retorno
export type DrizzleDb = NeonHttpDatabase<typeof schema>

/**
 * Crea una instancia de Drizzle usando el DATABASE_URL del binding de Cloudflare
 * Se llama desde un middleware global (index.ts) para inyectar la BD en c.var
 * 
 * Por qué factory por request y no singleton:
 * - En Workers, cada request tiene su propio c.env con bindings frescos
 * - Neon HTTP driver es stateless (usa HTTP, no pool de conexiones)
 * - Evita problemas de conexiones stale en edge runtime
 */
export function getDb(env: Env): DrizzleDb {
  // neon() crea el cliente del driver HTTP de Neon: cada consulta es una
  // petición fetch, sin conexión persistente ni WebSockets (eso sería Pool/Client).
  const sql = neon(env.DATABASE_URL)
  // drizzle() envuelve el cliente SQL con el schema para type-safety
  return drizzle(sql, { schema })
}

// Reexporta el schema por comodidad. Hoy nadie lo importa desde aquí:
// el seed y drizzle-kit leen directamente ./schema.
export { schema }