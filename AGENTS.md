# DentAI — instrucciones para agentes

Aplicación de gestión dental con Next.js 16, React 19, TypeScript estricto,
Prisma 7, PostgreSQL 16, Tailwind CSS 4 y shadcn/ui. El paquete `mcp-server/`
expone herramientas por stdio y consume la API REST con una cuenta de DentAI.

## Mapa y arquitectura

- `app/(dashboard)/`: páginas; `app/api/`: adaptadores HTTP.
- `lib/services/`: reglas de negocio y validación Zod en `lib/schemas.ts`.
- `lib/repositories/`: acceso a Prisma; `lib/db.ts` crea el cliente.
- `proxy.ts`: protección de rutas; `lib/auth/`: JWT, cookie httpOnly, contexto y reglas de acceso.
- `lib/finance.ts`: aritmética decimal; `lib/storage/`: archivos privados.
- `hooks/`, `components/`: acceso desde cliente e interfaz en español.
- `prisma/`: esquema, migraciones y seed de demostración.
- `mcp-server/src/`: cliente autenticado y 19 herramientas MCP.
- `tests/`: pruebas unitarias; `tests/integration/`: PostgreSQL real.

Flujo: rutas → servicios → repositorios → Prisma. Las rutas usan `withAuth`,
`successResponse` y `handleApiError`. Los servicios reciben `AuthContext`
obligatorio; las páginas de servidor usan `requireSession`. Las herramientas de
voz aplican el mismo contexto. No acceder a Prisma desde nuevos servicios o
componentes. Lanzar errores de dominio de `lib/errors.ts`.

## Reglas de datos

- ADMIN accede a toda la clínica; DENTIST necesita un perfil asociado.
- La ficha se comparte mediante `PatientDentist`. Contacto, notas y fotos son
  comunes; tratamientos, pagos, citas y saldos se filtran por profesional.
- Vincular al creador del paciente y al profesional de nuevas citas/tratamientos.
- Solo ADMIN gestiona dentistas, vínculos y elimina pacientes. Nunca retirar
  vínculos respaldados por citas o tratamientos ni borrar pagos por cascada.
- No confiar en `dentistId` enviado por un DENTIST. Los recursos ajenos son 404.
- Usar decimales exactos para dinero; máximo dos decimales y rango Decimal(10,2).
- Pagos y modificaciones financieras bloquean paciente y tratamiento, en ese
  orden, dentro de una transacción. No separar comprobación y escritura.
- Los archivos clínicos viven fuera de `public/`; servirlos con autorización,
  sin caché compartida. No utilizar optimización pública de imágenes privadas.

## Entorno y comandos

Node 24 y pnpm 12.8.1. Consultar README.md para instalación y variables.

```bash
pnpm install --frozen-lockfile
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
pnpm -C mcp-server build
```

Las pruebas de integración requieren TEST_DATABASE_URL apuntando a una base
exclusiva de pruebas con todas las migraciones aplicadas. `pnpm seed` reemplaza
los datos de demostración: ejecutarlo únicamente en una base desechable.

## Convenciones y trabajo

- Código, identificadores y commits en inglés; UI y documentación en español.
- Importaciones directas, sin nuevos barrels; no `any`: usar `unknown` y acotar.
- Validar entradas con Zod; conservar contratos REST y estados de dominio.
- No editar manualmente `components/ui/` ni `app/generated/prisma/`.
- No publicar secretos, archivos clínicos, `.env` ni clientes generados.
- Conservar cambios previos del usuario y evitar operaciones Git destructivas.
- Actualizar README.md y PLAN.md con cambios reales y resultados de validación.
- Verificar lint, tipos, pruebas y ambos builds antes de commits de esta entrega.
- Commits solo con autorización explícita, en Conventional Commits, por asunto.
  Leer `.claude/agents/committer.md` y cargar su procedimiento antes de preparar
  el índice. No inventar un procedimiento si falta.
- Mantener al usuario como autor; no añadir coautores ni trailers de atribución de IA.
- Los asuntos y cuerpos de los commits describen únicamente los cambios del
  proyecto; no mencionar asistentes ni herramientas de generación.
- **No hacer push en este proyecto.** No crear ramas ni worktrees para commits.
- La publicación de commits la realiza el usuario. No actualizar referencias
  remotas mediante comandos alternativos, scripts, APIs ni conectores.
- No retirar ni eludir las restricciones de publicación o autoría del proyecto.
