/**
 * Seed script para poblar la base de datos con datos de prueba
 * Ejecutar con: npx tsx src/seed.ts (requiere DATABASE_URL en .env)
 * 
 * Crea:
 * - 1 Empresa: "AuthCode Demo"
 * - 1 Chat: teléfono "+34600123456" (chatId = 1)
 * - Mensajes mixtos: saliente (negocio) + entrante (cliente)
 */
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { empresas, chats, mensajes } from './db/schema'
import { eq } from 'drizzle-orm'

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
    // 1. Crear empresa
    console.log('📦 Creando empresa...')
    const [empresa] = await db
      .insert(empresas)
      .values({ nombre: 'AuthCode Demo' })
      .returning()
    console.log(`✅ Empresa creada: ${empresa.nombre} (id: ${empresa.id})`)

    // 2. Crear chat con teléfono (spec: chats.telefono TEXT NOT NULL)
    console.log('💬 Creando chat...')
    const [chat] = await db
      .insert(chats)
      .values({ 
        empresaId: empresa.id, 
        telefono: '+34600123456' 
      })
      .returning()
    console.log(`✅ Chat creado: #${chat.id} (tel: ${chat.telefono})`)

    // 3. Crear mensajes mixtos (saliente + entrante)
    console.log('📨 Creando mensajes de prueba...')
    const mensajesData = [
      { chatId: chat.id, contenido: '¡Hola! Bienvenido a nuestro soporte. ¿En qué podemos ayudarte?', direccion: 'saliente' as const },
      { chatId: chat.id, contenido: 'Hola, tengo una duda sobre mi factura del mes pasado.', direccion: 'entrante' as const },
      { chatId: chat.id, contenido: 'Claro, ¿me podrías dar tu número de cliente o email para localizarla?', direccion: 'saliente' as const },
      { chatId: chat.id, contenido: 'Mi email es juan.perez@email.com, cliente #12345.', direccion: 'entrante' as const },
      { chatId: chat.id, contenido: 'Perfecto, ya la tengo. Veo que hay un cargo de 15€ por "Servicio Premium" que no reconoces. ¿Quieres que lo revise?', direccion: 'saliente' as const },
      { chatId: chat.id, contenido: 'Sí, por favor. No contraté ese servicio.', direccion: 'entrante' as const },
      { chatId: chat.id, contenido: 'Entendido. He abierto una incidencia (#INC-789) y te devolveremos el cargo en 48h. ¿Algo más en lo que pueda ayudarte?', direccion: 'saliente' as const },
      { chatId: chat.id, contenido: 'No, muchas gracias. Muy amable.', direccion: 'entrante' as const },
    ]

    for (const msg of mensajesData) {
      await db.insert(mensajes).values(msg)
    }
    console.log(`✅ ${mensajesData.length} mensajes creados (mezcla saliente/entrante)`)

    console.log('\n🎉 Seed completado con éxito!')
    console.log(`📋 Chat de prueba: /chats/${chat.id}`)
    console.log(`🔗 API: GET /chats/${chat.id}/mensajes`)

  } catch (error) {
    console.error('❌ Error en seed:', error)
    process.exit(1)
  }
}

seed()