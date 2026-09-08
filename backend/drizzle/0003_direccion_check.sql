-- Constraint CHECK para mensajes.direccion (defensa en profundidad).
--
-- Escrita a mano a proposito: drizzle-kit 0.24 ignora los check() declarados
-- en el schema (el soporte llego en 0.25), asi que `db:generate` no la produce.
-- El check() de schema.ts documenta la intencion; esta migracion la aplica.
DO $$ BEGIN
 ALTER TABLE "mensajes" ADD CONSTRAINT "direccion_check"
   CHECK (direccion IN ('saliente', 'entrante'));
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
