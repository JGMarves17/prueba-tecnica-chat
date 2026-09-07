/**
 * Pruebas TDD para endpoints de chat
 * Ejecutar con: npm test
 * 
 * Cubre:
 * - GET /chats/:chatId/mensajes
 * - POST /chats/:chatId/mensajes
 * - DELETE /mensajes/:id
 * - Validaciones Zod
 * 
 * Tests actualizados para nuevo contrato API:
 * - Respuestas: { status: "success", ... } | { status: "error", message: "..." }
 * - POST: sin direccion en body (server fija 'saliente')
 * - Rutas sin prefijo /api
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { Hono } from 'hono'
import type { DrizzleDb } from '../src/db'

// Mocks globales definidos ANTES de vi.mock (hoisted)
const { mockSelect, mockFrom, mockWhere, mockLimit, mockOffset, mockOrderBy, mockInsert, mockValues, mockReturning, mockDelete, mockCount } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
  mockWhere: vi.fn(),
  mockLimit: vi.fn(),
  mockOffset: vi.fn(),
  mockOrderBy: vi.fn(),
  mockInsert: vi.fn(),
  mockValues: vi.fn(),
  mockReturning: vi.fn(),
  mockDelete: vi.fn(),
  mockCount: vi.fn(),
}))

// Mock de la base de datos - simula DrizzleDb
vi.mock('../src/db', () => ({
  getDb: vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
  })),
  schema: {
    mensajes: {},
    chats: {},
  },
}))

import chatRoutes from '../src/routes/chat'

// App de prueba montando solo las rutas de chat (sin /api prefix)
// Necesita el middleware que inyecta db en el contexto
const testApp = new Hono<{ Bindings: { DATABASE_URL: string }; Variables: { db: DrizzleDb } }>()
testApp.use('*', async (c, next) => {
  // Mock getDb para tests
  const { getDb } = await import('../src/db')
  c.set('db', getDb({ DATABASE_URL: 'postgresql://mock' }))
  await next()
})
testApp.route('/', chatRoutes)

// Mocks accesibles directamente
const mocks = {
  mockSelect,
  mockFrom,
  mockWhere,
  mockLimit,
  mockOffset,
  mockOrderBy,
  mockInsert,
  mockValues,
  mockReturning,
  mockDelete,
  mockCount,
}

// Crear un builder encadenable que soporta cualquier orden de métodos
const createChain = (finalResult: any) => {
  const chain = {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((resolve) => Promise.resolve(finalResult).then(resolve)),
  }
  return chain
}

describe('Chat Routes', () => {
  beforeAll(() => {
    vi.clearAllMocks()
  })

  afterAll(() => {
    vi.resetAllMocks()
  })

  describe('GET /chats/:chatId', () => {
    it('debe retornar la info del chat con formato success', async () => {
      const mockChat = { id: 1, empresaId: 1, nombre: 'Juan Pérez', telefono: '+34600123456', createdAt: new Date() }
      mocks.mockSelect.mockReturnValueOnce(createChain([mockChat]))

      const res = await testApp.request('/chats/1')
      expect(res.status).toBe(200)
      const json = await res.json() as { status: string; chat: { nombre: string; telefono: string } }
      expect(json.status).toBe('success')
      expect(json.chat.nombre).toBe('Juan Pérez')
      expect(json.chat.telefono).toBe('+34600123456')
    })

    it('debe retornar 404 si el chat no existe', async () => {
      mocks.mockSelect.mockReturnValueOnce(createChain([]))

      const res = await testApp.request('/chats/999')
      expect(res.status).toBe(404)
      const json = await res.json() as { status: string; message: string }
      expect(json.status).toBe('error')
      expect(json.message).toBe('Chat no encontrado')
    })

    it('debe validar chatId como número', async () => {
      const res = await testApp.request('/chats/abc')
      expect(res.status).toBe(400)
      const json = await res.json() as { status: string }
      expect(json.status).toBe('error')
    })
  })

  describe('GET /chats/:chatId/mensajes', () => {
    it('debe retornar 404 si el chat no existe', async () => {
      // Mock: chat no encontrado (select -> from -> where -> limit)
      mocks.mockSelect.mockReturnValueOnce(createChain([]))

      const res = await testApp.request('/chats/999/mensajes')
      expect(res.status).toBe(404)
      const json = await res.json() as { status: string; message: string }
      expect(json.status).toBe('error')
      expect(json.message).toBe('Chat no encontrado')
    })

    it('debe retornar mensajes paginados con formato success', async () => {
      const mockMensajes = [
        { id: 1, chatId: 1, contenido: 'Hola', direccion: 'saliente', createdAt: new Date() },
        { id: 2, chatId: 1, contenido: '¿Cómo estás?', direccion: 'entrante', createdAt: new Date() },
      ]

      // Mock 1: chat existe (select -> from -> where -> limit)
      mocks.mockSelect.mockReturnValueOnce(createChain([{ id: 1 }]))

      // Mock 2: mensajes encontrados (select -> from -> where -> orderBy -> limit -> offset)
      mocks.mockSelect.mockReturnValueOnce(createChain(mockMensajes))

      // Mock 3: count total (select -> from -> where -> count)
      mocks.mockSelect.mockReturnValueOnce(createChain([{ total: 2 }]))

      const res = await testApp.request('/chats/1/mensajes?limit=50&offset=0')
      expect(res.status).toBe(200)
      const json = await res.json() as { status: string; mensajes: any[]; total: number }
      expect(json.status).toBe('success')
      expect(json.mensajes).toHaveLength(2)
      expect(json.total).toBe(2)
    })

    it('debe validar chatId como número', async () => {
      const res = await testApp.request('/chats/abc/mensajes')
      expect(res.status).toBe(400)
      const json = await res.json() as { status: string; message: string }
      expect(json.status).toBe('error')
    })
  })

  describe('POST /chats/:chatId/mensajes', () => {
    it('debe crear mensaje válido con direccion saliente', async () => {
      const nuevoMensaje = { id: 3, chatId: 1, contenido: 'Nuevo mensaje', direccion: 'saliente', createdAt: new Date() }

      // Mock: chat existe
      mocks.mockSelect.mockReturnValueOnce(createChain([{ id: 1 }]))

      // Mock: insert retorna mensaje creado
      mocks.mockInsert.mockReturnValueOnce({
        values: mocks.mockValues.mockReturnValue({
          returning: mocks.mockReturning.mockReturnValue(Promise.resolve([nuevoMensaje])),
        }),
      })

      const res = await testApp.request('/chats/1/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: 'Nuevo mensaje' }), // SIN direccion
      })

      expect(res.status).toBe(201)
      const json = await res.json() as { status: string; mensaje: { contenido: string; direccion: string } }
      expect(json.status).toBe('success')
      expect(json.mensaje.contenido).toBe('Nuevo mensaje')
      expect(json.mensaje.direccion).toBe('saliente') // Server fija 'saliente'
    })

    it('debe ignorar la direccion enviada por el cliente y forzar saliente', async () => {
      const nuevoMensaje = { id: 4, chatId: 1, contenido: 'Intento colar entrante', direccion: 'saliente', createdAt: new Date() }

      mocks.mockSelect.mockReturnValueOnce(createChain([{ id: 1 }]))
      mocks.mockInsert.mockReturnValueOnce({
        values: mocks.mockValues.mockReturnValue({
          returning: mocks.mockReturning.mockReturnValue(Promise.resolve([nuevoMensaje])),
        }),
      })

      const res = await testApp.request('/chats/1/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: 'Intento colar entrante', direccion: 'entrante' }),
      })

      expect(res.status).toBe(201)
      // El servidor nunca pasa la direccion del cliente al insert
      expect(mocks.mockValues).toHaveBeenCalledWith(
        expect.objectContaining({ direccion: 'saliente' })
      )
      const json = await res.json() as { mensaje: { direccion: string } }
      expect(json.mensaje.direccion).toBe('saliente')
    })

    it('debe rechazar contenido vacío', async () => {
      const res = await testApp.request('/chats/1/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: '' }),
      })
      expect(res.status).toBe(400)
      const json = await res.json() as { status: string; message: string }
      expect(json.status).toBe('error')
    })

    it('debe rechazar contenido solo espacios', async () => {
      const res = await testApp.request('/chats/1/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: '   ' }),
      })
      expect(res.status).toBe(400)
    })

    it('debe devolver 400 (no 500) si el body no es JSON válido', async () => {
      const res = await testApp.request('/chats/1/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"contenido": roto',
      })
      expect(res.status).toBe(400)
      const json = await res.json() as { status: string; message: string }
      expect(json.status).toBe('error')
      expect(json.message).toBe('El body debe ser JSON válido')
    })

    it('debe rechazar contenido > 5000 chars', async () => {
      const res = await testApp.request('/chats/1/mensajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: 'a'.repeat(5001) }),
      })
      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /mensajes/:id', () => {
    it('debe eliminar mensaje existente', async () => {
      const mensajeEliminado = { id: 1, chatId: 1, contenido: 'Hola', direccion: 'saliente', createdAt: new Date() }

      mocks.mockDelete.mockReturnValueOnce({
        where: mocks.mockWhere.mockReturnValue({
          returning: mocks.mockReturning.mockReturnValue(Promise.resolve([mensajeEliminado])),
        }),
      })

      const res = await testApp.request('/mensajes/1', { method: 'DELETE' })
      expect(res.status).toBe(200)
      const json = await res.json() as { status: string; mensaje: { id: number } }
      expect(json.status).toBe('success')
      expect(json.mensaje.id).toBe(1)
    })

    it('debe retornar 404 si mensaje no existe', async () => {
      mocks.mockDelete.mockReturnValueOnce({
        where: mocks.mockWhere.mockReturnValue({
          returning: mocks.mockReturning.mockReturnValue(Promise.resolve([])),
        }),
      })

      const res = await testApp.request('/mensajes/999', { method: 'DELETE' })
      expect(res.status).toBe(404)
      const json = await res.json() as { status: string; message: string }
      expect(json.status).toBe('error')
      expect(json.message).toBe('Mensaje no encontrado')
    })

    it('debe validar id como número', async () => {
      const res = await testApp.request('/mensajes/abc', { method: 'DELETE' })
      expect(res.status).toBe(400)
      const json = await res.json() as { status: string; message: string }
      expect(json.status).toBe('error')
    })
  })
})