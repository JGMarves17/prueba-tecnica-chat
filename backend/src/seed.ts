/**
 * Seed script para poblar la base de datos con datos de prueba
 * Ejecutar con: npm run db:seed (requiere DATABASE_URL en .env)
 *
 * Idempotente de verdad: busca antes de insertar (select-then-insert).
 * No usa onConflictDoNothing porque el schema del enunciado no define
 * ninguna constraint UNIQUE sobre la que pudiera dispararse.
 *
 * Crea:
 * - 1 Empresa: "AuthCode Demo"
 * - 1 Chat: nombre "Juan Perez", telefono "+34600123456"
 * - 8 mensajes mixtos: saliente (negocio) + entrante (cliente)
 */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { empresas, chats, mensajes } from './db/schema'
import { eq, and } from 'drizzle-orm'

const EMPRESA_NOMBRE = 'AuthCode Demo'
const CHAT_TELEFONO = '+34600123456'
const CHAT_NOMBRE = 'Juan Pérez'

async function seed() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL no configurada en .env')
    console.log('💡 Copia .env.example a .env y añade tu DATABASE_URL de Neon')
    process.exit(1)
  }

  console.log('🌱 Conectando a Neon...')
  const sql = neon(databaseUrl)
  const db = drizzle(sql, { schema: { empresas, chats, mensajes } })

  try {
    // 1. Empresa (idempotente: buscar antes de insertar)
    console.log('📦 Empresa...')
    let [empresa] = await db
      .select()
      .from(empresas)
      .where(eq(empresas.nombre, EMPRESA_NOMBRE))
      .limit(1)

    if (empresa) {
      console.log(`ℹ️  Empresa ya existe: ${EMPRESA_NOMBRE} (id: ${empresa.id})`)
    } else {
      ;[empresa] = await db.insert(empresas).values({ nombre: EMPRESA_NOMBRE }).returning()
      console.log(`✅ Empresa creada: ${EMPRESA_NOMBRE} (id: ${empresa.id})`)
    }

    // 2. Chat con nombre de contacto y telefono (idempotente)
    console.log('💬 Chat...')
    let [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.empresaId, empresa.id), eq(chats.telefono, CHAT_TELEFONO)))
      .limit(1)

    if (chat) {
      console.log(`ℹ️  Chat ya existe: #${chat.id} (${chat.nombre}, ${chat.telefono})`)
    } else {
      ;[chat] = await db
        .insert(chats)
        .values({ empresaId: empresa.id, nombre: CHAT_NOMBRE, telefono: CHAT_TELEFONO })
        .returning()
      console.log(`✅ Chat creado: #${chat.id} (${chat.nombre}, ${chat.telefono})`)
    }

    const chatId = chat.id

    // 3. Mensajes mixtos (idempotente: solo inserta los que falten)
    console.log('📨 Mensajes...')
    const mensajesData = [
      { chatId, contenido: '¡Hola! Bienvenido a nuestro soporte. ¿En qué podemos ayudarte?', direccion: 'saliente' as const },
      { chatId, contenido: 'Hola, tengo una duda sobre mi factura del mes pasado.', direccion: 'entrante' as const },
      { chatId, contenido: 'Claro, ¿me podrías dar tu número de cliente o email para localizarla?', direccion: 'saliente' as const },
      { chatId, contenido: 'Mi email es juan.perez@email.com, cliente #12345.', direccion: 'entrante' as const },
      { chatId, contenido: 'Perfecto, ya la tengo. Veo que hay un cargo de 15€ por "Servicio Premium" que no reconoces. ¿Quieres que lo revise?', direccion: 'saliente' as const },
      { chatId, contenido: 'Sí, por favor. No contraté ese servicio.', direccion: 'entrante' as const },
      { chatId, contenido: 'Entendido. He abierto una incidencia (#INC-789) y te devolveremos el cargo en 48h. ¿Algo más en lo que pueda ayudarte?', direccion: 'saliente' as const },
      { chatId, contenido: 'No, muchas gracias. Muy amable.', direccion: 'entrante' as const },
    ]

    let creados = 0
    for (const msg of mensajesData) {
      const [existing] = await db
        .select()
        .from(mensajes)
        .where(and(eq(mensajes.chatId, msg.chatId), eq(mensajes.contenido, msg.contenido)))
        .limit(1)

      if (!existing) {
        await db.insert(mensajes).values(msg)
        creados++
      }
    }
    console.log(`✅ ${creados} mensajes nuevos (${mensajesData.length} esperados en total)`)

    console.log('\n🎉 Seed completado. Re-ejecutarlo no duplica nada.')
    console.log(`📋 Chat de prueba: /chats/${chatId}`)
    console.log(`🔗 API: GET /chats/${chatId}/mensajes`)
  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

seed()
