---
description: 'Formulario interactivo para estructurar peticiones de desarrollo'
name: task
agent: agent
argument-hint: 'Describe brevemente la tarea o presiona Enter para el formulario completo'
---

## Contexto del proyecto

Este es un proyecto MERN veterinario con Backend y Frontend separados en repos git independientes.

- **Stack**: Bun, TypeScript, Express 5, MongoDB/Mongoose, React 19, Vite 7, Zod, Biome
- **Patrones**: Repository → Service → Controller, Factory con DI, Soft Delete Plugin
- **Convenciones**: Ver `commit.instructions.md` y `fase1.instructions.md` en `.github/instructions/`

## Instrucciones

Antes de ejecutar cualquier acción, DEBES presentar al usuario el siguiente cuadro interactivo con la herramienta `ask_questions`. Las 4 preguntas son obligatorias y deben enviarse en una sola llamada:

1. **Qué** — free text, sin opciones predefinidas.
   Pregunta: "¿Qué necesitas? Describe la acción concreta."

2. **Dónde** — opciones: `Backend`, `Frontend`, `Ambos`. Permitir free text adicional.
   Pregunta: "¿Dónde aplica el cambio?"

3. **Restricción** — multi-select con free text. Opciones: `Seguir patrones existentes`, `Sin modificar tests`, `Sin nuevas dependencias`, `Ninguna`.
   Pregunta: "¿Hay restricciones o patrones a seguir?"

4. **Resultado** — free text, sin opciones predefinidas.
   Pregunta: "¿Qué debería pasar cuando termine? (opcional)"

Si el usuario ya proporcionó información en el chat input (por ejemplo `/task agregar endpoint de pacientes en Backend`), pre-completa lo que puedas inferir y solo pregunta lo que falte.

## Después de recibir respuestas

1. Resume las respuestas en este formato:

   > **Qué**: [respuesta]
   > **Dónde**: [respuesta]
   > **Restricciones**: [respuesta]
   > **Resultado**: [respuesta]

2. Crea un plan de tareas con `manage_todo_list` si la tarea tiene más de 2 pasos.

3. Procede a ejecutar **sin pedir confirmación adicional**.

4. Al finalizar, muestra un resumen breve de lo realizado.
