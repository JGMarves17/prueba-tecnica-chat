/**
 * Seed script para poblar la base de datos con datos de prueba
 * Ejecutar con: npx tsx src/seed.ts (requiere DATABASE_URL en .env)
 * 
 * Idempotente: usa upsert (ON CONFLICT DO NOTHING) para no duplicar al re-ejecutar.
 * 
 * Crea:
 * - 1 Empresa: "AuthCode Demo"
 * - 1 Chat: nombre "Juan Pérez", teléfono "+34600123456" (chatId = 1)
 * - Mensajes mixtos: saliente (negocio) + entrante (cliente)
 */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { empresas, chats, mensajes } from './db/schema'
import { eq, and } from 'drizzle-orm'

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
    // 1. Crear empresa (idempotente: ON CONFLICT DO NOTHING)
    console.log('📦 Creando empresa...')
    const [empresa] = await db
      .insert(empresas)
      .values({ nombre: 'AuthCode Demo' })
      .onConflictDoNothing()
      .returning()
    
    let empresaId: number
    if (empresa) {
      empresaId = empresa.id
      console.log(`✅ Empresa creada: AuthCode Demo (id: ${empresaId})`)
    } else {
      // Ya existe, buscarla
      const [existing] = await db.select().from(empresas).where(eq(empresas.nombre, 'AuthCode Demo')).limit(1)
      empresaId = existing.id
      console.log(`ℹ️ Empresa ya existe: AuthCode Demo (id: ${empresaId})`)
    }

    // 2. Crear chat con nombre y teléfono (idempotente)
    console.log('💬 Creando chat...')
    const [chat] = await db
      .insert(chats)
      .values({ 
        empresaId, 
        nombre: 'Juan Pérez',
        telefono: '+34600123456' 
      })
      .onConflictDoNothing()
      .returning()
    
    let chatId: number
    if (chat) {
      chatId = chat.id
      console.log(`✅ Chat creado: #${chatId} (${chat.nombre}, tel: +34600123456)`)
    } else {
      const [existing] = await db.select().from(chats).where(eq(chats.telefono, '+34600123456')).limit(1)
      chatId = existing.id
      console.log(`ℹ️ Chat ya existe: #${chatId}`)
    }

    // 3. Crear mensajes mixtos (idempotente: solo si no existen)
    console.log('📨 Creando mensajes de prueba...')
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
    console.log(`✅ ${creados} mensajes nuevos creados (total esperados: 8)`)

    console.log('\n🎉 Seed completado con éxito!')
    console.log(`📋 Chat de prueba: /chats/${chatId}`)
    console.log(`🔗 API: GET /chats/${chatId}/mensajes`)

  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

seed()