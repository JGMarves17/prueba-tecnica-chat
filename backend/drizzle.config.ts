/**
 * Configuración de Drizzle Kit para migraciones
 * Genera y aplica migraciones a Neon Postgres
 * 
 * Documentación: https://orm.drizzle.team/docs/drizzle-kit
 */
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  // ============================================
  // CONFIGURACIÓN DE ESQUEMA Y SALIDA
  // ============================================
  schema: './src/db/schema.ts',  // Archivo con definiciones de tablas (pgTable)
  out: './drizzle',              // Carpeta donde se generan archivos .sql de migración
  dialect: 'postgresql',         // Dialecto SQL (Neon = PostgreSQL)

  // ============================================
  // CREDENCIALES DE BASE DE DATOS
  // ============================================
  // DATABASE_URL viene de backend/.env y la usan los comandos de drizzle-kit
  // que hablan con la BD (migrate, push, studio). El seed no pasa por aquí:
  // carga el .env con --env-file. El Worker tampoco: recibe c.env (.dev.vars
  // en local, Secret en producción).
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },

  // ============================================
  // OPCIONES DE db:push
  // ============================================
  verbose: true,   // push imprime cada sentencia SQL que va a ejecutar
  strict: true,    // push pide confirmación antes de aplicar los cambios
})
