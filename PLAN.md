# DentAI: Sistema de Gestión Dental — Pagos, Citas y WhatsApp

## Problemática

Un profesional dental lleva todos sus registros en papel: pagos de pacientes, abonos parciales, citas programadas y datos de contacto. Esto genera:
- **Pérdida de información** y dificultad para rastrear deudas
- **No hay historial digital** de pagos ni tratamientos
- **Comunicación manual** con pacientes (llamadas, recordatorios a mano)
- **Sin visibilidad** del estado financiero (quién debe, cuánto, desde cuándo)

## Solución

Sistema web con:
1. **Gestión de pacientes** — Registro completo con datos de contacto
2. **Control de pagos** — Bonos (deuda total por tratamiento) y abonos (pagos parciales)
3. **Agenda de citas** — Programar, confirmar, cancelar citas
4. **WhatsApp** — Enviar recordatorios y mensajes directos a pacientes
5. **MCP Server** — Un agente IA gestiona todo vía comandos naturales
6. **Interfaz de voz** — Dictar operaciones sin tocar el teclado

---

## Stack Tecnológico

| Capa              | Tecnología                                                | Justificación                                  |
| ----------------- | --------------------------------------------------------- | ---------------------------------------------- |
| **Frontend**      | Next.js 15 (App Router)                                   | SSR, API Routes, excelente DX                  |
| **UI**            | Tailwind CSS + shadcn/ui                                  | Componentes accesibles, diseño rápido          |
| **Base de datos** | PostgreSQL 16                                             | Robusta, transacciones ACID para dinero        |
| **ORM**           | Prisma                                                    | Type-safe, migraciones, integración Next.js    |
| **MCP Server**    | TypeScript + `@modelcontextprotocol/sdk`                  | Protocolo estándar para herramientas de IA     |
| **WhatsApp**      | API de WhatsApp Business (via `whatsapp-web.js` o Twilio) | Mensajes directos a pacientes                  |
| **Voz (STT)**     | Web Speech API (navegador)                                | Sin costo, funciona en Chrome/Edge             |
| **Voz (TTS)**     | SpeechSynthesis API (navegador)                           | Respuesta hablada al usuario                   |
| **Calendario**    | `@fullcalendar/react`                                     | Componente maduro, vistas día/semana/mes       |
| **Validación**    | Zod                                                       | Esquemas compartidos entre frontend, API y MCP |
| **Moneda**        | `Decimal.js` / Prisma Decimal                             | Precisión en cálculos monetarios               |
| **Contenedores**  | Docker + Docker Compose                                   | Entorno reproducible, PostgreSQL incluido      |

---

## Docker

Todo el proyecto corre dentro de contenedores:

| Servicio | Imagen                               | Puerto | Descripción                                   |
| -------- | ------------------------------------ | ------ | --------------------------------------------- |
| **app**  | `node:20-alpine` (build multi-stage) | `3000` | Next.js (dev con hot-reload, prod optimizado) |
| **db**   | `postgres:16-alpine`                 | `5432` | PostgreSQL con volumen persistente            |

```yaml
# docker-compose.yml (resumen)
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: dent_ai
      POSTGRES_USER: dentai
      POSTGRES_PASSWORD: dentai_dev
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]

  app:
    build: .
    ports: ["3000:3000"]
    depends_on: [db]
    environment:
      DATABASE_URL: postgresql://dentai:dentai_dev@db:5432/dent_ai
    volumes:
      - .:/app          # hot-reload en dev
      - /app/node_modules
```

---

## Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                      FRONTEND                         │
│  Next.js 15 (App Router)                             │
│  ┌───────────┐ ┌──────────┐ ┌────────┐ ┌──────────┐│
│  │ Dashboard  │ │Pacientes │ │ Pagos  │ │  Agenda  ││
│  │ Resumen   │ │  CRUD    │ │Bonos/  │ │  Citas   ││
│  │ financiero│ │          │ │Abonos  │ │Calendario││
│  └─────┬─────┘ └────┬─────┘ └───┬────┘ └────┬─────┘│
│        └─────────────┼───────────┼───────────┘      │
│                      │           │                   │
│  ┌──────────┐  Next.js API Routes                    │
│  │Voice Chat│  /api/patients/*                       │
│  │ STT/TTS  │  /api/treatments/*                     │
│  └──────────┘  /api/payments/*                       │
│                /api/appointments/*                    │
│                /api/whatsapp/*                        │
└──────────────────────┬───────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
┌──────────────┐ ┌───────────┐ ┌──────────────────────┐
│  PostgreSQL  │ │ WhatsApp  │ │  MCP Server (stdio)  │
│              │ │   API     │ │                      │
│ - patients   │ │           │ │ Tools:               │
│ - treatments │ │ Enviar:   │ │  - create_patient    │
│ - payments   │ │ - Recorda-│ │  - list_patients     │
│ - appointm.  │ │   torios  │ │  - create_treatment  │
│              │ │ - Cobros  │ │  - add_payment       │
│              │ │ - Confirm.│ │  - get_balance       │
│              │ │           │ │  - create_appointment│
│              │ │           │ │  - send_whatsapp     │
│              │ │           │ │  - get_dashboard     │
│              │ │           │ │  - search_patients   │
└──────────────┘ └───────────┘ └──────────────────────┘
```

---

## Modelo de Datos

```prisma
model Patient {
  id          String        @id @default(cuid())
  firstName   String
  lastName    String
  phone       String        @unique    // Número WhatsApp
  email       String?
  notes       String?                  // Observaciones clínicas generales
  treatments  Treatment[]
  appointments Appointment[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Treatment {
  id          String        @id @default(cuid())
  description String                   // "Ortodoncia", "Corona dental", etc.
  totalAmount Decimal       @db.Decimal(10, 2)  // Monto total (el "bono")
  status      TreatmentStatus @default(IN_PROGRESS)
  patient     Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  patientId   String
  payments    Payment[]                // Abonos parciales
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  // Campo virtual: saldo pendiente = totalAmount - sum(payments.amount)
}

model Payment {
  id          String        @id @default(cuid())
  amount      Decimal       @db.Decimal(10, 2)  // Monto del abono
  method      PaymentMethod @default(CASH)
  note        String?                  // "Abono de marzo", etc.
  treatment   Treatment     @relation(fields: [treatmentId], references: [id], onDelete: Cascade)
  treatmentId String
  createdAt   DateTime      @default(now())
}

model Appointment {
  id          String            @id @default(cuid())
  title       String                   // "Limpieza", "Control ortodoncia"
  description String?
  date        DateTime
  duration    Int                      // minutos
  status      AppointmentStatus @default(SCHEDULED)
  patient     Patient           @relation(fields: [patientId], references: [id], onDelete: Cascade)
  patientId   String
  whatsappSent Boolean          @default(false)  // ¿Se envió recordatorio?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
}

enum TreatmentStatus {
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum PaymentMethod {
  CASH
  TRANSFER
  CARD
  OTHER
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}
```

### Relaciones clave

```
Patient 1──N Treatment 1──N Payment
Patient 1──N Appointment
```

- Un **paciente** tiene muchos **tratamientos** (cada uno es un "bono" = deuda)
- Cada **tratamiento** tiene muchos **pagos/abonos** parciales
- Un **paciente** tiene muchas **citas**
- El **saldo pendiente** = `treatment.totalAmount - SUM(payments.amount)`

---

## Historias de Usuario

### Epic 1: Gestión de Pacientes

| ID        | Historia                                                                                                             | Criterios de Aceptación                                                                                                     | Prioridad |
| --------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- |
| **HU-01** | Como dentista, quiero **registrar un paciente** con nombre, teléfono y email para tener su información digitalizada. | - Formulario con nombre, apellido, teléfono (obligatorio), email opcional - Teléfono único - Se guarda en BD                | Alta      |
| **HU-02** | Como dentista, quiero **ver el listado de pacientes** con búsqueda para encontrar rápidamente a alguien.             | - Lista con nombre, teléfono, saldo pendiente total - Búsqueda por nombre o teléfono - Ordenar por nombre o deuda           | Alta      |
| **HU-03** | Como dentista, quiero **ver el perfil completo de un paciente** con sus tratamientos, pagos y citas.                 | - Datos personales editables - Lista de tratamientos con saldo - Historial de pagos - Próximas citas                        | Alta      |
| **HU-04** | Como dentista, quiero **editar o eliminar un paciente** cuando sea necesario.                                        | - Edición de todos los campos - Eliminación con confirmación (cascada) - No eliminar si tiene saldo pendiente (advertencia) | Media     |

### Epic 2: Tratamientos y Pagos (Bonos/Abonos)

| ID        | Historia                                                                                                          | Criterios de Aceptación                                                                                                       | Prioridad |
| --------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------- |
| **HU-05** | Como dentista, quiero **crear un tratamiento (bono)** para un paciente con el monto total a pagar.                | - Seleccionar paciente - Descripción del tratamiento - Monto total (Decimal) - Estado inicial: IN_PROGRESS                    | Alta      |
| **HU-06** | Como dentista, quiero **registrar un abono (pago parcial)** a un tratamiento existente.                           | - Seleccionar tratamiento activo - Ingresar monto y método de pago - Validar que no exceda el saldo pendiente - Nota opcional | Alta      |
| **HU-07** | Como dentista, quiero **ver el saldo pendiente** de cada tratamiento y el total por paciente.                     | - Saldo = Total - Sum(abonos) - Indicador visual (rojo si debe, verde si saldado) - Total de deuda por paciente               | Alta      |
| **HU-08** | Como dentista, quiero **ver el historial de pagos** de un tratamiento para saber cuándo y cuánto pagó.            | - Lista cronológica de abonos - Monto, fecha, método de pago - Barra de progreso del pago total                               | Alta      |
| **HU-09** | Como dentista, quiero **marcar un tratamiento como completado** cuando el paciente termine y pague todo.          | - Cambiar estado a COMPLETED solo si saldo = 0 - O forzar cierre con nota explicativa                                         | Media     |
| **HU-10** | Como dentista, quiero **ver un resumen financiero** (dashboard) con ingresos del día/semana/mes y deudas totales. | - Ingresos por período - Total de cuentas por cobrar - Pacientes con mayor deuda - Gráfico simple de ingresos                 | Media     |

### Epic 3: Agenda de Citas

| ID        | Historia                                                                                           | Criterios de Aceptación                                                                                   | Prioridad |
| --------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------- |
| **HU-11** | Como dentista, quiero **agendar una cita** para un paciente con fecha, hora y descripción.         | - Seleccionar paciente - Fecha/hora, duración, título - Validar conflictos de horario - Estado: SCHEDULED | Alta      |
| **HU-12** | Como dentista, quiero **ver mis citas del día/semana** en un calendario visual.                    | - Vista día/semana/mes con FullCalendar - Colores por estado - Click para ver detalle                     | Alta      |
| **HU-13** | Como dentista, quiero **cambiar el estado de una cita** (confirmar, cancelar, completar, no-show). | - Transiciones válidas - Registro de cambios - Actualización inmediata en calendario                      | Media     |
| **HU-14** | Como dentista, quiero **ver las citas próximas** de un paciente desde su perfil.                   | - Lista de citas futuras y pasadas - Filtro por estado                                                    | Media     |

### Epic 4: Comunicación WhatsApp

| ID        | Historia                                                                                         | Criterios de Aceptación                                                                                         | Prioridad |
| --------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | --------- |
| **HU-15** | Como dentista, quiero **enviar un recordatorio de cita** por WhatsApp al paciente.               | - Botón "Enviar recordatorio" en la cita - Mensaje pre-formateado con fecha/hora - Marcar `whatsappSent = true` | Alta      |
| **HU-16** | Como dentista, quiero **enviar un mensaje de cobro** por WhatsApp recordando el saldo pendiente. | - Desde el perfil del paciente o tratamiento - Mensaje con monto pendiente - Tono profesional y amable          | Media     |
| **HU-17** | Como dentista, quiero **enviar un mensaje libre** por WhatsApp a un paciente.                    | - Campo de texto libre - Envío desde perfil del paciente - Historial de mensajes enviados (opcional)            | Baja      |

### Epic 5: Servidor MCP

| ID        | Historia                                                                 | Criterios de Aceptación                                                                                     | Prioridad |
| --------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------- |
| **HU-18** | Como agente de IA, quiero **gestionar pacientes** vía MCP tools.         | - Tools: `create_patient`, `list_patients`, `search_patients`, `get_patient` - Parámetros validados con Zod | Alta      |
| **HU-19** | Como agente de IA, quiero **registrar tratamientos y pagos** vía MCP.    | - Tools: `create_treatment`, `add_payment`, `get_balance`, `list_treatments`                                | Alta      |
| **HU-20** | Como agente de IA, quiero **gestionar citas** vía MCP.                   | - Tools: `create_appointment`, `list_appointments`, `update_appointment`                                    | Alta      |
| **HU-21** | Como agente de IA, quiero **enviar mensajes WhatsApp** vía MCP.          | - Tools: `send_whatsapp_reminder`, `send_whatsapp_payment`, `send_whatsapp_message`                         | Media     |
| **HU-22** | Como agente de IA, quiero **consultar el dashboard financiero** vía MCP. | - Tool: `get_dashboard` con resumen de ingresos y deudas - `get_calendar` con citas del rango               | Media     |

### Epic 6: Interfaz de Voz

| ID        | Historia                                                                                          | Criterios de Aceptación                                                          | Prioridad |
| --------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------- |
| **HU-23** | Como dentista, quiero **dictar comandos por voz** (ej: "registra un abono de 500 a María López"). | - Botón de micrófono activa STT - Transcripción visible - Envío al procesamiento | Media     |
| **HU-24** | Como dentista, quiero **recibir respuestas habladas** del sistema.                                | - TTS lee confirmaciones - Opción de activar/desactivar - Velocidad configurable | Baja      |
| **HU-25** | Como dentista, quiero **consultar información por voz** (ej: "¿cuánto debe Juan Pérez?").         | - Consulta procesada → respuesta hablada y visual                                | Baja      |

---

## Plan de Desarrollo (Sprints)

### Sprint 1 — Fundación + Pacientes (Semana 1-2)
- [x] Definir plan y arquitectura
- [ ] Configurar Docker Compose (app + PostgreSQL)
- [ ] Inicializar proyecto Next.js 15 + Tailwind + shadcn/ui
- [ ] Configurar Prisma (schema, migraciones) dentro del contenedor
- [ ] API Routes CRUD para pacientes (`/api/patients`)
- [ ] UI: Listado, registro, perfil y edición de pacientes
- **Entregable:** CRUD de pacientes funcional en Docker

### Sprint 2 — Tratamientos y Pagos (Semana 3-4)
- [ ] API Routes: tratamientos y pagos (`/api/treatments`, `/api/payments`)
- [ ] UI: Crear tratamiento (bono) desde perfil de paciente
- [ ] UI: Registrar abono con validación de saldo
- [ ] UI: Historial de pagos con barra de progreso
- [ ] UI: Dashboard financiero (ingresos, deudas)
- **Entregable:** Sistema de bonos/abonos funcional

### Sprint 3 — Agenda + WhatsApp (Semana 5-6)
- [ ] API Routes: citas (`/api/appointments`)
- [ ] UI: Calendario con FullCalendar
- [ ] UI: Gestión de citas (crear, cambiar estado)
- [ ] Integrar API de WhatsApp (recordatorios, cobros, mensajes)
- [ ] UI: Botones de envío WhatsApp en citas y tratamientos
- **Entregable:** Agenda + comunicación WhatsApp

### Sprint 4 — Servidor MCP (Semana 7-8)
- [ ] Crear paquete `mcp-server/` con `@modelcontextprotocol/sdk`
- [ ] Implementar tools: pacientes, tratamientos, pagos
- [ ] Implementar tools: citas, WhatsApp, dashboard
- [ ] Configurar en `.vscode/mcp.json`
- **Entregable:** MCP server completo, usable desde Copilot

### Sprint 5 — Voz + Pulido (Semana 9-10)
- [ ] Componente VoiceInput (STT) y VoiceOutput (TTS)
- [ ] Procesamiento de comandos de voz → acciones
- [ ] UI/UX polish: loading states, toasts, responsive, mobile-first
- [ ] Testing E2E
- **Entregable:** Sistema completo con voz y MCP

### Sprint 6 — Autenticación y Multi-Dentista (Actual)

#### Objetivo
Cada dentista accede con login propio y ve solo sus datos. Un administrador ve todo.

#### Cambios en Modelo de Datos
- Nuevo modelo `User` con `email`, `passwordHash`, `role` (ADMIN | DENTIST)
- `User` se vincula opcionalmente a `Dentist` (FK `dentistId`)
- El admin no necesita perfil de dentista

#### Lógica de Acceso
| Rol     | Ve pacientes              | Ve tratamientos | Ve citas   | Ve dentistas   | Dashboard                |
| ------- | ------------------------- | --------------- | ---------- | -------------- | ------------------------ |
| DENTIST | Solo donde es `dentistId` | Solo suyos      | Solo suyas | Solo su perfil | Solo sus ingresos/deudas |
| ADMIN   | Todos                     | Todos           | Todas      | Todos          | Toda la clínica          |

#### Tareas
- [x] Instalar dependencias auth (bcrypt, jose)
- [x] Modelo `User` + enum `UserRole` + migración
- [x] Librería auth: hash passwords, JWT sign/verify, cookie session
- [x] API: POST /api/auth/login, POST /api/auth/logout, GET /api/auth/me
- [x] Middleware `withAuth` para proteger API routes
- [x] Login page (/login)
- [x] Middleware Next.js para proteger páginas (redirect a /login)
- [x] Filtrar datos por `dentistId` en services (scope)
- [x] Sidebar: mostrar usuario, botón logout
- [x] Seed: crear usuarios (admin + dentistas)
- **Entregable:** Login funcional con datos aislados por dentista

---


```
Mcp-Notes/
├── app/                          # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx                  # Dashboard financiero
│   ├── patients/
│   │   ├── page.tsx              # Listado de pacientes
│   │   └── [id]/page.tsx         # Perfil completo
│   ├── treatments/
│   │   └── [id]/page.tsx         # Detalle tratamiento + pagos
│   ├── appointments/
│   │   └── page.tsx              # Calendario de citas
│   └── api/
│       ├── patients/route.ts
│       ├── patients/[id]/route.ts
│       ├── treatments/route.ts
│       ├── treatments/[id]/route.ts
│       ├── payments/route.ts
│       ├── appointments/route.ts
│       ├── appointments/[id]/route.ts
│       ├── whatsapp/send/route.ts
│       └── dashboard/route.ts
├── components/
│   ├── ui/                       # shadcn/ui
│   ├── patients/
│   │   ├── PatientForm.tsx
│   │   ├── PatientList.tsx
│   │   └── PatientProfile.tsx
│   ├── treatments/
│   │   ├── TreatmentForm.tsx
│   │   ├── PaymentForm.tsx
│   │   └── PaymentHistory.tsx
│   ├── appointments/
│   │   └── CalendarView.tsx
│   ├── whatsapp/
│   │   └── WhatsAppButton.tsx
│   ├── voice/
│   │   ├── VoiceInput.tsx
│   │   └── VoiceOutput.tsx
│   ├── dashboard/
│   │   └── FinancialSummary.tsx
│   └── layout/
│       ├── Sidebar.tsx
│       └── Header.tsx
├── lib/
│   ├── db.ts                     # Prisma client
│   ├── schemas.ts                # Zod schemas
│   └── whatsapp.ts               # WhatsApp client
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── mcp-server/                   # Paquete MCP independiente
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts
│       ├── tools/
│       │   ├── patients.ts
│       │   ├── treatments.ts
│       │   ├── payments.ts
│       │   ├── appointments.ts
│       │   └── whatsapp.ts
│       └── db.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── Dockerfile                    # Multi-stage build
├── docker-compose.yml            # app + PostgreSQL
├── .dockerignore
├── .env
├── .env.example
└── PLAN.md                       # ← Este archivo
```

---

## Configuración MCP (ejemplo para VS Code)

```jsonc
// .vscode/mcp.json
{
  "servers": {
    "dent-ai": {
      "type": "stdio",
      "command": "node",
      "args": ["./mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/dent_ai"
      }
    }
  }
}
```

### Ejemplos de interacción MCP

```
Dentista (vía Copilot): "Registra un abono de $500 a María López en su tratamiento de ortodoncia"

→ MCP Tool: search_patients({ query: "María López" })
→ MCP Tool: add_payment({
    treatmentId: "clx...",
    amount: 500,
    method: "CASH",
    note: "Abono de marzo"
  })

→ Respuesta: "✓ Abono de $500.00 registrado para María López.
   Tratamiento: Ortodoncia | Saldo pendiente: $2,500.00"
```

```
Dentista: "¿Cuánto me debe Juan Pérez?"

→ MCP Tool: get_balance({ patientName: "Juan Pérez" })

→ Respuesta: "Juan Pérez tiene 2 tratamientos activos:
   1. Corona dental — Saldo: $1,200.00
   2. Limpieza profunda — Saldado ✓
   Total pendiente: $1,200.00"
```

```
Dentista: "Envíale un recordatorio a Ana García de su cita de mañana"

→ MCP Tool: send_whatsapp_reminder({ patientName: "Ana García" })

→ Respuesta: "✓ Recordatorio enviado a Ana García (+52 555-1234567)
   Cita: Mañana 12 Mar 10:00 AM — Control ortodoncia"
```

---

## Variables de Entorno

```env
# Docker Compose configura estas automáticamente
DATABASE_URL="postgresql://dentai:dentai_dev@db:5432/dent_ai"
POSTGRES_DB=dent_ai
POSTGRES_USER=dentai
POSTGRES_PASSWORD=dentai_dev

WHATSAPP_API_URL="https://api.whatsapp.com/..."   # o Twilio
WHATSAPP_API_TOKEN="..."
# NODE_ENV="development"
```

---

## Próximos Pasos

1. **Aprobar este plan** y ajustar prioridades
2. **Inicializar el proyecto** (Sprint 1)
3. Iterar con feedback en cada sprint

---

*Generado: 2026-03-11 — Actualizado con enfoque dental*
