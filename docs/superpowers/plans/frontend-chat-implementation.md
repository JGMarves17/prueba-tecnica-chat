# Plan de Implementación: Proyecto Frontend Chat

## Introducción
Este documento detalla el plan para desarrollar un proyecto frontend de chat usando Next.js (App Router), React Query, y Tailwind CSS. El objetivo es crear una interfaz de chat funcional con mensajes ordenados cronológicamente, validación básica y soporte para dark mode.

## Estructura del Proyecto

### Directorio Principal
- `frontend/`:
  - `app/`:
    - `chats/[id]/page.tsx`: Página de chat con lista de mensajes.
  - `components/`:
    - `ChatMessage.tsx`: Componente para mostrar mensajes.
    - `ChatInput.tsx`: Componente para enviar mensajes.
  - `lib/`:
    - `api.ts`: Configuración de la API para manejo de mensajes.
    - `query.ts`: Hooks para React Query.
  - `styles/`:
    - Configuración de Tailwind CSS (CSS-first).

### Arquitectura

1. **Página de Chat:**
   - Lista de mensajes ordenados cronológicamente.
   - Componente `ChatMessage` para mostrar mensajes con dirección (entrante/saliente).
   - Componente `ChatInput` para enviar mensajes con validación básica.
   - Estilos con flexbox, grid y dark mode.

2. **Hooks y Utilidades:**
   - `useQuery` para cargar mensajes.
   - `useMutation` para enviar/eliminar mensajes.

3. **Validación y Estados:**
   - Mensajes cargados al iniciar sesión.
   - Validación básica de envío de mensajes.
   - Estados: `loading`, `error`, `empty`.

## Diseño de Componentes

### ChatMessage
- **Taxonomía:** Componente de mensaje.
- **Semántico:** `<div>` con `data-state` para direcciones.
- **Styling:** Usar `cn` para clases de Tailwind.
- **Accesibilidad:** Soporte para teclado y `asChild` para flexibilidad.

### ChatInput
- **Taxonomía:** Componente de entrada.
- **Semántico:** `<form>` con `data-slot` para validación.
- **Styling:** Flexbox para diseño responsive.

## Configuración de Tailwind CSS

- Usar configuración CSS-first para Tailwind v4.
- Estilos con flexbox, grid y soporte para dark mode.

## Pruebas TDD

- Cada componente y lógica será probado con TDD.
- Pruebas para cargar mensajes, enviar mensajes y manejo de errores.

## Implementación

### Paso 1: Crear Estructura del Proyecto
- Crear directorios y archivos según la estructura propuesta.

### Paso 2: Implementar Página de Chat
- Implementar `app/chats/[id]/page.tsx` con lista de mensajes y componentes.

### Paso 3: Implementar Componentes
- Implementar `ChatMessage.tsx` y `ChatInput.tsx` con estilos y lógica.

### Paso 4: Implementar Hooks y Utilidades
- Implementar `api.ts` y `query.ts` para manejo de datos.

### Paso 5: Implementar Pruebas TDD
- Escribir pruebas para cada componente y lógica.

### Paso 6: Configurar Tailwind CSS
- Configurar Tailwind CSS con CSS-first y dark mode.

### Paso 7: Validación y Manejo de Estados
- Validar envío de mensajes y manejar estados (`loading`, `error`, `empty`).

## Próximos Pasos

1. Crear la estructura del proyecto.
2. Implementar la página de chat y componentes.
3. Implementar pruebas TDD.
4. Configurar Tailwind CSS y validaciones.

Este plan asegura que el proyecto cumpla con las especificaciones y sea funcional, accesible y bien probado.