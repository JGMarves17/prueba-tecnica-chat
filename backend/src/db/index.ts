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

// Tipo de la base de datos Drizzle tipada
export type DrizzleDb = NeonHttpDatabase<typeof schema>

/**
 * Crea una instancia de Drizzle usando el DATABASE_URL del binding de Cloudflare
 * Se llama dentro de cada handler para tener acceso a c.env
 */
export function getDb(env: Env): DrizzleDb {
  const sql = neon(env.DATABASE_URL)
  return drizzle(sql, { schema })
}

export { schema }