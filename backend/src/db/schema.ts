/**
 * Esquema de base de datos con Drizzle ORM
 * Define 3 tablas: empresas, chats, mensajes
 * Relaciones: empresa 1:N chats, chat 1:N mensajes
 * 
 * Cumple spec exacto:
 * - empresas: id, nombre
 * - chats: id, empresa_id, nombre, telefono, created_at (TIMESTAMPTZ)
 * - mensajes: id, chat_id, contenido, direccion, created_at (TIMESTAMPTZ)
 */
import { pgTable, serial, text, integer, timestamp, index, check } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Tabla: empresas
 * Representa cada tenant/cliente del SaaS
 * Spec: id SERIAL PK, nombre TEXT NOT NULL
 */
export const empresas = pgTable('empresas', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Tabla: chats
 * Cada chat pertenece a una empresa
 * Spec: id SERIAL PK, empresa_id INT REF empresas(id), nombre TEXT NOT NULL, telefono TEXT NOT NULL, created_at TIMESTAMPTZ
 */
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  empresaId: integer('empresa_id').references(() => empresas.id).notNull(),
  nombre: text('nombre').notNull(),
  telefono: text('telefono').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Tabla: mensajes
 * Cada mensaje pertenece a un chat
 * direccion: 'saliente' (negocio -> cliente) | 'entrante' (cliente -> negocio)
 * Spec: id SERIAL PK, chat_id INT REF chats(id), contenido TEXT NOT NULL, direccion TEXT NOT NULL, created_at TIMESTAMPTZ
 * 
 * Índices y constraints:
 * - Índice compuesto (chat_id, created_at, id) para paginación eficiente.
 *   Incluye id porque el ORDER BY desempata por id cuando created_at coincide.
 * - Constraint CHECK en BD para direccion (defensa en profundidad).
 *   OJO: drizzle-kit 0.24 ignora los check() al generar migraciones (soporte
 *   desde 0.25), asi que la constraint se aplica con drizzle/0003, escrita
 *   a mano. El check() de abajo documenta la intencion y quedara operativo
 *   para generate() al subir drizzle-kit.
 */
export const mensajes = pgTable('mensajes', {
  id: serial('id').primaryKey(),
  chatId: integer('chat_id').references(() => chats.id).notNull(),
  contenido: text('contenido').notNull(),
  direccion: text('direccion').notNull(), // 'saliente' | 'entrante' (validado en API + CHECK en BD)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Índice compuesto para paginación eficiente: WHERE chat_id = ? ORDER BY created_at ASC
  chatCreatedIdx: index('mensajes_chat_created_idx').on(table.chatId, table.createdAt, table.id),
  // Constraint CHECK (aplicada por drizzle/0003_direccion_check.sql, no por generate)
  direccionCheck: check('direccion_check', sql`direccion IN ('saliente', 'entrante')`),
}))

// Tipos TypeScript inferidos automáticamente por Drizzle
export type Empresa = typeof empresas.$inferSelect
export type NewEmpresa = typeof empresas.$inferInsert
export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
export type Mensaje = typeof mensajes.$inferSelect
export type NewMensaje = typeof mensajes.$inferInsert