# DentAI — implementación de estabilidad y datos

## Decisiones

- Priorizar instalación reproducible, acceso consistente, MCP y precisión financiera.
- Ficha compartida con vínculo explícito paciente–dentista; contacto, notas y fotos
  comunes, operaciones y saldos filtrados por profesional.
- MCP utiliza credenciales de una cuenta existente y cookie en memoria.
- Conservar la precisión de dos decimales y deuda de tratamientos activos en dashboard.
- Commits locales según el procedimiento adaptado de ClipBoardApp. No hacer push.

## Cambios implementados

| Área | Archivos y resultado |
|---|---|
| Instrucciones | AGENTS.md, CLAUDE.md y .codex/README.md: arquitectura, mapa, reglas y colaboración. |
| Entorno | package.json, pnpm-workspace.yaml y lockfile: Node 24, pnpm 12.8.1, builds explícitos y compilador React requerido. Dockerfile/Compose/CI alineados. |
| Modelo | prisma/schema.prisma y migración 20260929000000: PatientDentist con backfill desde operaciones, sin borrar registros. Seed actualizado. |
| Permisos | lib/auth/access.ts, servicios, repositorios, rutas y páginas: contexto obligatorio y filtro tanto de ficha como de relaciones incluidas. |
| Asignación | PUT /api/patients/[id]/dentists y PatientDentists.tsx: gestión administrativa; conservación de vínculos respaldados. |
| Archivos | photo.service.ts, lib/storage y rutas de fotos: almacenamiento privado, firmas de contenido, autorización y migración reejecutable. |
| Dinero | finance.ts y repositorio de tratamientos: decimales exactos, límites y transacciones con bloqueos para pagos y modificaciones. |
| Dashboard | Repositorio/servicio y GET /api/dashboard: deuda completa antes del top cinco; resumen común con MCP. |
| MCP | Cliente con login y renovación coordinada; inputs de secretos en VS Code y asignación administrativa opcional. |
| Interfaz | Permisos visibles, selección de dentista para ADMIN, formularios con recuperación de errores y fechas de cita ISO desde el navegador. |
| Commits | .claude/skills/commit-procedure y .claude/scripts/commit.sh: survey, gates, staged diff y reporte. |

## Validación

- Instalación con lockfile y generación Prisma completadas.
- Build de producción completado; convención Next 16 `proxy.ts` y compilador React configurados.
- Pruebas unitarias: finanzas, validación, contexto de acceso, archivos y protocolo MCP.
- Integración PostgreSQL 16: base vacía, backfill sobre datos previos, ficha compartida,
  operaciones ajenas, pagos fraccionarios y concurrentes, deuda de más de cinco
  pacientes y contenido privado. HTTP y páginas se verifican con TEST_API_BASE_URL.
- CI incorpora PostgreSQL, migraciones, lint sin warnings, tipos, pruebas y ambos builds.
- El procedimiento de commits verifica el árbol completo, no cada índice parcial.

Resultado local: lint sin warnings, tipos y ambos builds aprobados; 5 pruebas unitarias
y 10 de integración aprobadas, incluyendo login/MCP reales, HTTP y migración
reejecutable de archivos. El adaptador PostgreSQL emite una advertencia de
deprecación de pg durante las consultas; las pruebas pasan. Docker/Compose no se ejecutaron
localmente: el entorno no tiene Docker disponible. Las consultas reales a OpenAI y el
reconocimiento de voz del navegador requieren credenciales y micrófono; no se ejecutan
como parte de las pruebas automáticas. La migración de archivos se prueba con fixtures,
no sobre archivos clínicos existentes.

## Aplicación a instalaciones existentes

Respaldar base y archivos, detener escrituras, aplicar migraciones, ejecutar
`pnpm photos:migrate`, compilar y reiniciar. Consultar README.md para comandos.
Mantener coordinados backups de base y archivos privados.

## Etapa posterior

Mejoras visuales amplias, nuevas funciones clínicas y WhatsApp Business requieren
una etapa de producto posterior. Esta entrega mantiene WhatsApp prellenado y voz de lectura.
