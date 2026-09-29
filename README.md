# DentAI — Sistema de gestión dental

Aplicación web para clínicas dentales que reemplaza los registros en papel: pacientes, tratamientos, pagos, agenda de citas y comunicación por WhatsApp. Incluye un **servidor MCP** para que un agente de IA opere el sistema con lenguaje natural y un **asistente de voz** en el navegador.

[![CI](https://github.com/Vic-Lara-Gilles/App-Dent-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/Vic-Lara-Gilles/App-Dent-MCP/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![MCP](https://img.shields.io/badge/MCP-server-6E56CF)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Problema que resuelve

Un profesional dental suele llevar en papel los cobros pendientes, los abonos parciales, las citas y los datos de contacto de cada paciente. Eso provoca pérdida de información, poca visibilidad de las finanzas y mucho trabajo manual para comunicarse con los pacientes.

## Funcionalidades

- **Pacientes:** ficha con datos de contacto, RUT, notas, fotos clínicas e historial de tratamientos y pagos.
- **Tratamientos y pagos:** cada tratamiento tiene un costo total (bono) y recibe pagos parciales (abonos) en efectivo, transferencia o tarjeta. El saldo pendiente se calcula en tiempo real.
- **Agenda:** calendario de citas con estados (agendada, confirmada, completada, cancelada, no asistió).
- **WhatsApp:** mensajes prellenados al paciente con un clic, por ejemplo para confirmar una cita.
- **Dashboard:** pacientes, tratamientos y citas, ingresos del día, pagos recientes y pacientes con deuda.
- **Varios dentistas:** usuarios con rol `ADMIN` o `DENTIST`; cada dentista ve su propia información.
- **Servidor MCP:** 19 herramientas para que un agente de IA (Claude, Copilot, etc.) gestione pacientes, tratamientos, pagos, citas y el dashboard.
- **Asistente de voz:** el usuario dicta una consulta en el navegador (Web Speech API), un modelo de OpenAI la responde usando los datos reales de la clínica y la respuesta se lee en voz alta.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Recharts |
| Backend | Route Handlers de Next.js, Zod 4 |
| Base de datos | PostgreSQL 16, Prisma 7 (`@prisma/adapter-pg`) |
| Autenticación | JWT con `jose` en cookie httpOnly, contraseñas con `bcryptjs` |
| IA | Vercel AI SDK + OpenAI (voz), Model Context Protocol SDK (servidor MCP) |
| Infraestructura | Docker, Docker Compose, pnpm workspaces |

## Arquitectura

```
Navegador / Agente MCP
        │
        ▼
app/api/**/route.ts        Route Handlers: validan la sesión y dan formato a la respuesta
        │
        ▼
lib/services/*.service.ts  Reglas de negocio y validación con Zod
        │
        ▼
lib/repositories/*.ts      Acceso a datos con Prisma
        │
        ▼
PostgreSQL
```

- `middleware.ts` protege todas las rutas salvo `/login` y `/api/auth/*`.
- Los errores de dominio (`NotFoundError`, `ValidationError`, `ConflictError`) se traducen a códigos HTTP en un solo lugar (`lib/api-response.ts`).
- El servidor MCP (`mcp-server/`) es un paquete aparte del workspace que se comunica por stdio y llama a la API REST de la aplicación.

## Modelo de datos

| Modelo | Descripción |
|---|---|
| `User` | Cuenta de acceso con rol `ADMIN` o `DENTIST` |
| `Dentist` | Profesional de la clínica, vinculado a un usuario |
| `Patient` | Paciente con contacto, RUT y notas |
| `PatientPhoto` | Fotos clínicas del paciente |
| `Treatment` | Tratamiento con costo total y estado |
| `Payment` | Abono a un tratamiento, con método de pago |
| `Appointment` | Cita con fecha, dentista y estado |

## Instalación

Requisitos: Node.js 20 o superior, pnpm 10 y Docker.

```bash
git clone https://github.com/Vic-Lara-Gilles/App-Dent-MCP.git
cd App-Dent-MCP
pnpm install
```

Crea un archivo `.env` en la raíz:

```env
POSTGRES_DB=dentai
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dentai
JWT_SECRET=un-secreto-largo-y-aleatorio
# Opcional, para el asistente de voz
OPENAI_API_KEY=
```

Levanta la base de datos, aplica las migraciones y carga los datos de prueba:

```bash
docker compose up -d db
pnpm prisma migrate dev
pnpm seed
pnpm dev
```

La aplicación queda en http://localhost:3000. Con `docker compose up -d` también puedes levantar la app completa en contenedores.

**Usuario de prueba:** `admin@dentai.com` / `password123` (solo para desarrollo local).

## Servidor MCP

El servidor expone estas herramientas:

| Área | Herramientas |
|---|---|
| Pacientes | `list_patients`, `get_patient`, `create_patient`, `update_patient` |
| Dentistas | `list_dentists`, `get_dentist`, `create_dentist`, `update_dentist` |
| Tratamientos y pagos | `list_treatments`, `create_treatment`, `update_treatment`, `add_payment`, `get_balance` |
| Citas | `list_appointments`, `get_appointment`, `create_appointment`, `update_appointment`, `get_calendar` |
| Dashboard | `get_dashboard` |

Para usarlo desde VS Code, el repositorio ya incluye `.vscode/mcp.json`. Para otro cliente MCP:

```json
{
  "mcpServers": {
    "dent-ai": {
      "command": "pnpm",
      "args": ["-C", "/ruta/a/App-Dent-MCP/mcp-server", "run", "dev"],
      "env": { "API_BASE_URL": "http://localhost:3000" }
    }
  }
}
```

Ejemplos de lo que se le puede pedir al agente:

- "¿Qué pacientes tienen deuda pendiente?"
- "Agenda una limpieza para María García el jueves a las 10:00"
- "Registra un abono de 20.000 pesos por transferencia en la ortodoncia de María García"

## Scripts

| Comando | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build de producción |
| `pnpm lint` | ESLint |
| `pnpm seed` | Carga datos de prueba |
| `pnpm -C mcp-server build` | Compila el servidor MCP |

## Licencia

[MIT](LICENSE)
