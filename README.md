# DentAI — Sistema de gestión dental

Aplicación para clínicas dentales: pacientes, fichas compartidas, tratamientos,
abonos, agenda, archivos clínicos privados y mensajes prellenados de WhatsApp.
Incluye 19 herramientas MCP y un asistente de voz para consultar datos reales.

[![CI](https://github.com/Vic-Lara-Gilles/App-Dent-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/Vic-Lara-Gilles/App-Dent-MCP/actions/workflows/ci.yml)

## Stack y mapa

Next.js 16 (App Router), React 19, TypeScript estricto, Tailwind CSS 4,
shadcn/ui, Prisma 7 con adaptador PostgreSQL, PostgreSQL 16, Zod,
JWT con `jose`, `bcryptjs`, Vercel AI SDK y MCP SDK.

```text
app/(dashboard)/          Páginas e interfaz de gestión
app/api/                  API REST autenticada
proxy.ts                  Protección de rutas
lib/auth/                 Sesiones y contexto de acceso
lib/services/             Validación y reglas de negocio
lib/repositories/         Consultas y transacciones Prisma
lib/finance.ts            Cálculos monetarios exactos
lib/storage/              Archivos privados
components/ y hooks/      Interfaz y acceso desde navegador
prisma/                   Esquema, migraciones y seed
mcp-server/               Paquete MCP independiente por stdio
scripts/migrate-photos.ts Migración de archivos públicos antiguos
tests/                    Pruebas unitarias y de integración
```

Flujo: páginas/API → servicios → repositorios → PostgreSQL. Los errores de dominio
se convierten a respuestas HTTP en `lib/api-response.ts`.

## Funcionalidades y permisos

- **Pacientes:** contacto, RUT, notas, avatar y documentos clínicos.
- **Ficha compartida:** el creador queda vinculado al paciente; el administrador
  puede vincular otros dentistas. Citas y tratamientos agregan vínculos automáticamente.
- **DENTIST:** necesita perfil asociado; accede a las fichas vinculadas y ve
  únicamente sus tratamientos, abonos, citas y saldos. Contacto, notas y fotos
  son comunes a los profesionales vinculados.
- **ADMIN:** ve toda la clínica, gestiona dentistas y vínculos, y puede eliminar
  pacientes sin pagos. No se eliminan pacientes ni tratamientos con pagos registrados.
- **Finanzas:** montos positivos con hasta dos decimales; pagos y modificaciones
  financieras se validan dentro de una transacción con bloqueo. Un tratamiento
  se completa al saldar la deuda. No se puede reducir el total por debajo de lo pagado.
- **Dashboard:** ingresos del día, pagos recientes, conteos y deuda de todos los
  tratamientos activos; muestra los cinco mayores deudores.
- **Archivos:** JPEG, PNG, WebP, GIF y PDF, hasta 10 MB por archivo y 20 por envío.
  Se almacenan fuera de `public/` y se entregan por una ruta autenticada sin caché
  compartida. PDF se descarga; el avatar debe ser una imagen del paciente.
- **WhatsApp:** abre un mensaje prellenado; el usuario decide enviarlo. No hay
  integración automática con WhatsApp Business ni comprobación de entrega.
- **Voz:** transcripción y lectura con APIs del navegador; consultas con OpenAI
  sujetas al mismo acceso por dentista. Actualmente sus herramientas son de lectura.

## Instalación local

Requisitos: Node.js **24**, pnpm **12.8.1** y PostgreSQL 16. Docker es opcional
si ya tienes PostgreSQL. `packageManager` y `.node-version` fijan el entorno.

```bash
pnpm install --frozen-lockfile
cp .env.example .env
```

Edita `.env`: configura tu conexión y reemplaza `JWT_SECRET` por un secreto aleatorio.
Para levantar únicamente PostgreSQL con Docker:

```bash
docker compose up -d db
pnpm prisma generate
pnpm prisma migrate deploy
# Opcional: reemplaza los datos de la base por datos de demostración.
pnpm seed
pnpm dev
```

Aplicación: http://localhost:3000. Si cambias el esquema durante desarrollo, usa
`pnpm prisma migrate dev --name nombre_del_cambio` y conserva la migración generada.

El seed borra los datos existentes. Úsalo solo en una base desechable. Crea estas
cuentas locales, todas con contraseña `password123`:

| Cuenta | Rol |
|---|---|
| `admin@dentai.com` | ADMIN |
| `c.ramirez@dentai.com` | DENTIST |
| `s.lopez@dentai.com` | DENTIST |
| `a.mendez@dentai.com` | DENTIST |

## Variables de entorno

| Variable | Uso |
|---|---|
| `DATABASE_URL` | Conexión PostgreSQL; obligatoria para operaciones con datos |
| `JWT_SECRET` | Firma de sesiones; obligatoria |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Base de Docker Compose |
| `OPENAI_API_KEY` | Opcional; activa las consultas de voz |
| `UPLOADS_DIR` | Archivos privados; por defecto `./storage/patients` |
| `API_BASE_URL` | MCP; por defecto `http://localhost:3000` |
| `MCP_EMAIL`, `MCP_PASSWORD` | Credenciales de la cuenta usada por MCP |
| `TEST_DATABASE_URL` | Base exclusiva de pruebas; su nombre debe contener `test` |
| `TEST_API_BASE_URL` | Opcional; agrega pruebas HTTP contra una app usando la misma base y JWT de pruebas |

Los procesos MCP reciben sus variables desde el cliente que los inicia; no cargan
la `.env` de Next.js automáticamente. No guardar credenciales reales en archivos versionados.

## Docker

```bash
docker compose up -d --build
# Preparación de la base dentro del contenedor de desarrollo:
docker compose exec app pnpm prisma migrate deploy
# Opcional, solo para demostración:
docker compose exec app pnpm seed
```

Compose inicia app en desarrollo y PostgreSQL, con volúmenes persistentes para
base y archivos privados. La instalación incluye ambos paquetes del workspace.
Para una imagen de producción: `docker build --target prod -t dentai .`.
Aplicar migraciones desde un entorno con Prisma instalado antes de iniciar esa
imagen, configurar `DATABASE_URL` y `JWT_SECRET`, y montar almacenamiento persistente.

## Actualizar una instalación existente

1. Respaldar PostgreSQL y `public/uploads/patients`, y detener las escrituras.
2. Instalar dependencias, generar Prisma y ejecutar `pnpm prisma migrate deploy`.
   La nueva migración conserva los datos y recupera los vínculos desde citas y tratamientos.
3. Ejecutar `pnpm photos:migrate` con la misma base y `UPLOADS_DIR` de la app.
   El script copia y compara cada archivo, actualiza URLs/avatar y retira la copia pública.
   Es reejecutable e intenta completar limpiezas interrumpidas.
4. Reiniciar la app y revisar fichas con cuentas de ambos roles.

Las antiguas URLs `/uploads/` devuelven 404. Los pacientes sin operaciones ni
vínculos quedan disponibles al administrador para su asignación. Respaldar la base
y el directorio privado juntos; revertir código sin revertir datos no es un rollback completo.

## MCP

La API debe estar disponible. El cliente hace login, mantiene la cookie en memoria
sin registrarla en logs y renueva la sesión una sola vez ante 401. Todas las herramientas
respetan los permisos de la cuenta; no se reintentan automáticamente errores de permisos.
VS Code usa `.vscode/mcp.json` y solicita email y contraseña mediante inputs.

Para otros clientes, configurar estas variables por su mecanismo de secretos:

```json
{
  "mcpServers": {
    "dent-ai": {
      "command": "pnpm",
      "args": ["-C", "/ruta/App-Dent-MCP/mcp-server", "run", "dev"],
      "env": {
        "API_BASE_URL": "http://localhost:3000",
        "MCP_EMAIL": "cuenta-de-la-clinica",
        "MCP_PASSWORD": "configurar-en-el-cliente"
      }
    }
  }
}
```

| Área | Herramientas |
|---|---|
| Pacientes | `list_patients`, `get_patient`, `create_patient`, `update_patient` |
| Dentistas | `list_dentists`, `get_dentist`, `create_dentist`, `update_dentist` |
| Tratamientos/pagos | `list_treatments`, `create_treatment`, `update_treatment`, `add_payment`, `get_balance` |
| Citas | `list_appointments`, `get_appointment`, `create_appointment`, `update_appointment`, `get_calendar` |
| Dashboard | `get_dashboard` |

`get_dashboard` consulta `GET /api/dashboard`, el mismo resumen de la web.
El administrador puede enviar `dentistId` al crear citas o tratamientos. Los
vínculos se administran desde la ficha o con `PUT /api/patients/[id]/dentists`
y cuerpo `{ "dentistIds": ["id-profesional"] }`; no se pueden retirar vínculos
que tengan citas o tratamientos registrados.

## Validación y colaboración

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm -C mcp-server build
# Base exclusiva de pruebas con las migraciones aplicadas:
TEST_DATABASE_URL=postgresql://usuario:clave@localhost:5432/dentai_test pnpm test:integration
```

Las pruebas de integración usan esquemas y registros propios para verificar migraciones,
permisos, concurrencia, dashboard y archivos. Para agregar HTTP y páginas de servidor,
iniciar la app con esa base y el mismo `JWT_SECRET`, y proporcionar `TEST_API_BASE_URL`.

[AGENTS.md](AGENTS.md) contiene las instrucciones compartidas para agentes;
[CLAUDE.md](CLAUDE.md) las referencia. [.codex/](.codex/README.md) documenta Codex.
[PLAN.md](PLAN.md) registra cambios y verificación.

Los commits locales autorizados siguen `.claude/skills/commit-procedure/SKILL.md`
y `.claude/scripts/commit.sh`. **No hacer push en este proyecto.**

## Licencia

[MIT](LICENSE)
