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
 * 
 * createdAt: TIMESTAMPTZ con defaultNow() = timestamp con zona horaria,
 *            se llena automáticamente al insertar
 */
export const empresas = pgTable('empresas', {
  id: serial('id').primaryKey(),                    // SERIAL = auto-increment INT
  nombre: text('nombre').notNull(),                 // TEXT NOT NULL
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Tabla: chats
 * Cada chat pertenece a una empresa (relación 1:N empresa -> chats)
 * Spec: id SERIAL PK, empresa_id INT REF empresas(id), nombre TEXT NOT NULL, telefono TEXT NOT NULL, created_at TIMESTAMPTZ
 * 
 * NOTA: el enunciado pide 'nombre' (del contacto) y 'telefono', ambos NOT NULL.
 * telefono es TEXT y no número: lleva '+' y prefijos, y nunca se opera con él.
 */
export const chats = pgTable('chats', {
  id: serial('id').primaryKey(),
  // FK a empresas. Sin onDelete, Postgres aplica NO ACTION: no hay cascada,
  // así que no se puede borrar una empresa que todavía tenga chats.
  empresaId: integer('empresa_id').references(() => empresas.id).notNull(),
  nombre: text('nombre').notNull(),       // Nombre del contacto (requerido por spec)
  telefono: text('telefono').notNull(),   // Teléfono del contacto (requerido por spec)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

/**
 * Tabla: mensajes
 * Cada mensaje pertenece a un chat (relación 1:N chat -> mensajes)
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
  // FK a chats. Igual que arriba: NO ACTION, sin cascada. Un chat con mensajes
  // no se puede borrar hasta borrar antes sus mensajes.
  chatId: integer('chat_id').references(() => chats.id).notNull(),
  contenido: text('contenido').notNull(),                    // Texto del mensaje
  direccion: text('direccion').notNull(),                    // 'saliente' | 'entrante'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // ============================================
  // ÍNDICE COMPUESTO PARA PAGINACIÓN EFICIENTE
  // ============================================
  // Query típica: WHERE chat_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?
  // Índice compuesto (chat_id, created_at, id) cubre:
  // 1. Filtro WHERE chat_id = ?
  // 2. Orden ORDER BY created_at ASC
  // 3. Desempate por id cuando createdAt coincide (mismo timestamp)
  // Así Postgres recorre el índice ya ordenado y no tiene que ordenar en memoria.
  // No es un "index-only scan": la consulta hace SELECT * y contenido no está
  // en el índice, así que igualmente lee cada fila de la tabla.
  chatCreatedIdx: index('mensajes_chat_created_idx').on(table.chatId, table.createdAt, table.id),
  
  // ============================================
  // CONSTRAINT CHECK EN BASE DE DATOS
  // ============================================
  // Defensa en profundidad: aunque la API valide, la BD rechaza valores inválidos
  // OJO: drizzle-kit 0.24 ignora check() en generate(). 
  // La constraint real está en drizzle/0003_direccion_check.sql (escrita a mano).
  // Este check() documenta la intención y funcionará al actualizar drizzle-kit.
  direccionCheck: check('direccion_check', sql`direccion IN ('saliente', 'entrante')`),
}))

// ============================================
// TIPOS TYPESCRIPT INFERIDOS AUTOMÁTICAMENTE
// ============================================
// Drizzle infiere tipos desde el schema, evitando duplicación
// $inferSelect = tipo al leer (SELECT)
// $inferInsert = tipo al escribir (INSERT)
export type Empresa = typeof empresas.$inferSelect
export type NewEmpresa = typeof empresas.$inferInsert
export type Chat = typeof chats.$inferSelect
export type NewChat = typeof chats.$inferInsert
export type Mensaje = typeof mensajes.$inferSelect
export type NewMensaje = typeof mensajes.$inferInsert