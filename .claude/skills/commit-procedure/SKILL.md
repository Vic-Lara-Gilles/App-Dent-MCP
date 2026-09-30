---
name: commit-procedure
description: Split authorized DentAI changes into Conventional Commits after surveying and verifying the complete working tree. Use when the user requests local commits; this procedure does not authorize a commit or push.
---

# DentAI commit procedure

Adaptado del procedimiento de ClipBoardApp para este workspace Next.js/Prisma/MCP.
Leer antes de preparar el índice. La autorización debe venir del usuario para esta
sesión; un pedido explícito de commit es suficiente.

## Restricciones

- No crear ni modificar ramas o worktrees. **No hacer push.**
- No editar `.git/`, usar bypass de hooks ni modificar commits anteriores.
- Conservar cambios previos del usuario; no incluir secretos ni datos clínicos.
- Si faltan archivos de este procedimiento o falla una verificación, detener los
  commits y explicar el problema. Corregir y repetir solo las verificaciones que
  el cambio o el fallo justifique; completar los gates antes de commitear.

## Fases

1. Ejecutar `.claude/scripts/commit.sh survey` una vez: rama, estado completo,
   diff contra HEAD, archivos nuevos y renombres. Leer los archivos nuevos.
   No repetir status/diff por separado durante el procedimiento.
2. Agrupar por asunto y ordenar dependencias: `config` (runtime, dependencias,
   Docker/CI), `data` (acceso, relaciones, transacciones y archivos), `mcp`,
   `ui`, `test`, `docs`, `agent-config`. Cada commit debe poder compilar;
   mantener juntos cambios inseparables y explicar su amplitud en el cuerpo.
   Dividir archivos mixtos por hunks cuando sea seguro, sin perder el estado final.
3. Ejecutar `.claude/scripts/commit.sh verify`: lint sin warnings, tipos,
   pruebas unitarias, build de app y MCP. Para cambios de datos, permisos,
   transacciones, rutas o migraciones ejecutar también `verify-full`, que exige
   TEST_DATABASE_URL y pruebas de integración PostgreSQL. El gate aplica al árbol
   completo, no a cada índice parcial. No usar una base clínica para pruebas.
4. Para cada grupo: `git add` con archivos explícitos; añadir una entrada a
   CHANGELOG.md bajo `[Unreleased]` en el mismo commit si cambia comportamiento
   o arquitectura; ejecutar `commit.sh staged`; leer diffstat y diff; redactar
   el mensaje desde ese diff. Verificar que el asunto describe lo realmente
   incluido. Usar `git commit -F <archivo-temporal>` con texto exacto.
5. Ejecutar `commit.sh report <cantidad>`. Informar hashes y asuntos, resultado
   de gates, limitaciones y que se verificó el árbol completo. Comprobar que el
   estado final conserva los archivos y cambios originales.

## Mensajes

Conventional Commits: `type(scope): imperative description`, siempre en inglés.
Tipos: feat, fix, perf, docs, chore, refactor, test, revert, style. Cuerpo en prosa
con qué cambió y por qué, líneas de aproximadamente 72 columnas. Para cambios
incompatibles usar `!` y `BREAKING CHANGE:`. No inventar trailers ni versiones.
Mantener al usuario como autor; no añadir coautores ni trailers de atribución de IA.
El contenido del mensaje se deriva del índice, nunca del plan o la memoria.

CHANGELOG.md resume cambios visibles y arquitectónicos; no registra churn,
pruebas o documentación rutinaria. No añadir una versión o fecha de release.
