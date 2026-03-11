import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://dentai:dentai_dev@localhost:5432/dent_ai",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Sembrando datos de prueba...");

  // ─── Limpiar datos existentes ─────────────────────────
  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.dentist.deleteMany();
  console.log("🗑️  Datos anteriores eliminados");

  // ─── Dentistas ────────────────────────────────────────
  const [drRamirez, draLopez, drMendez] = await Promise.all([
    prisma.dentist.create({
      data: {
        firstName: "Carlos",
        lastName: "Ramírez",
        phone: "5511001001",
        email: "c.ramirez@dentai.com",
        specialty: "Ortodoncia",
      },
    }),
    prisma.dentist.create({
      data: {
        firstName: "Sofía",
        lastName: "López",
        phone: "5511001002",
        email: "s.lopez@dentai.com",
        specialty: "Endodoncia",
      },
    }),
    prisma.dentist.create({
      data: {
        firstName: "Andrés",
        lastName: "Méndez",
        phone: "5511001003",
        email: "a.mendez@dentai.com",
        specialty: "Implantología",
      },
    }),
  ]);
  console.log("🦷 3 dentistas creados");

  // ─── Usuarios ─────────────────────────────────────────
  const defaultPassword = await hash("password123", 12);

  await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@dentai.com",
        passwordHash: defaultPassword,
        name: "Administrador",
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        email: "c.ramirez@dentai.com",
        passwordHash: defaultPassword,
        name: "Dr. Carlos Ramirez",
        role: "DENTIST",
        dentistId: drRamirez.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "s.lopez@dentai.com",
        passwordHash: defaultPassword,
        name: "Dra. Sofia Lopez",
        role: "DENTIST",
        dentistId: draLopez.id,
      },
    }),
    prisma.user.create({
      data: {
        email: "a.mendez@dentai.com",
        passwordHash: defaultPassword,
        name: "Dr. Andres Mendez",
        role: "DENTIST",
        dentistId: drMendez.id,
      },
    }),
  ]);
  console.log("👤 4 usuarios creados (admin + 3 dentistas) — password: password123");

  // ─── Pacientes ────────────────────────────────────────
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        firstName: "María",
        lastName: "García",
        phone: "5522001001",
        email: "maria.garcia@gmail.com",
        notes: "Alérgica a la penicilina",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "José",
        lastName: "Hernández",
        phone: "5522001002",
        email: "jose.hdz@hotmail.com",
        notes: "Hipertenso, tomar presión antes del procedimiento",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "Ana",
        lastName: "Martínez",
        phone: "5522001003",
        email: "ana.mtz@gmail.com",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "Luis",
        lastName: "Torres",
        phone: "5522001004",
        email: "luis.torres@outlook.com",
        notes: "Paciente ansioso, requiere sedación leve",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "Carmen",
        lastName: "Sánchez",
        phone: "5522001005",
        email: "carmen.sanchez@gmail.com",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "Roberto",
        lastName: "Díaz",
        phone: "5522001006",
        email: "roberto.diaz@yahoo.com",
        notes: "Diabético tipo 2",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "Valentina",
        lastName: "Ruiz",
        phone: "5522001007",
        email: "val.ruiz@gmail.com",
      },
    }),
    prisma.patient.create({
      data: {
        firstName: "Miguel",
        lastName: "Flores",
        phone: "5522001008",
        notes: "Embarazada. Evitar rayos X",
      },
    }),
  ]);
  console.log("👥 8 pacientes creados");

  const [maria, jose, ana, luis, carmen, roberto, valentina, miguel] = patients;

  // ─── Tratamientos ─────────────────────────────────────
  const now = new Date();

  await Promise.all([
    // María – Ortodoncia (en progreso, pagos parciales)
    prisma.treatment.create({
      data: {
        description: "Ortodoncia metálica completa",
        totalAmount: 15000,
        status: "IN_PROGRESS",
        patientId: maria.id,
        dentistId: drRamirez.id,
        payments: {
          create: [
            { amount: 3000, method: "CASH", note: "Enganche" },
            { amount: 2000, method: "TRANSFER", note: "Mensualidad 1" },
            { amount: 2000, method: "TRANSFER", note: "Mensualidad 2" },
          ],
        },
      },
    }),

    // José – Canal radicular (completado, pagado)
    prisma.treatment.create({
      data: {
        description: "Tratamiento de conductos molar inferior derecho",
        totalAmount: 4500,
        status: "COMPLETED",
        patientId: jose.id,
        dentistId: draLopez.id,
        payments: {
          create: [
            { amount: 2000, method: "CARD", note: "Pago 1" },
            { amount: 2500, method: "CASH", note: "Liquidación" },
          ],
        },
      },
    }),

    // Ana – Implante (en progreso, sin pagos aún)
    prisma.treatment.create({
      data: {
        description: "Implante dental pieza 36",
        totalAmount: 22000,
        status: "IN_PROGRESS",
        patientId: ana.id,
        dentistId: drMendez.id,
        payments: {
          create: [{ amount: 5000, method: "TRANSFER", note: "Primer abono" }],
        },
      },
    }),

    // Luis – Limpieza + Blanqueamiento (completado)
    prisma.treatment.create({
      data: {
        description: "Limpieza dental profunda y blanqueamiento",
        totalAmount: 3500,
        status: "COMPLETED",
        patientId: luis.id,
        dentistId: drRamirez.id,
        payments: {
          create: [{ amount: 3500, method: "CARD" }],
        },
      },
    }),

    // Carmen – Carillas (en progreso)
    prisma.treatment.create({
      data: {
        description: "Carillas de porcelana (6 piezas frontales)",
        totalAmount: 18000,
        status: "IN_PROGRESS",
        patientId: carmen.id,
        dentistId: drRamirez.id,
        payments: {
          create: [
            { amount: 6000, method: "TRANSFER", note: "Enganche" },
            { amount: 4000, method: "TRANSFER", note: "Mensualidad 1" },
          ],
        },
      },
    }),

    // Roberto – Extracción + Prótesis (en progreso)
    prisma.treatment.create({
      data: {
        description: "Extracción de 4 piezas y prótesis parcial",
        totalAmount: 9500,
        status: "IN_PROGRESS",
        patientId: roberto.id,
        dentistId: draLopez.id,
        payments: {
          create: [{ amount: 3000, method: "CASH", note: "Enganche" }],
        },
      },
    }),

    // Valentina – Ortodoncia Invisible (en progreso)
    prisma.treatment.create({
      data: {
        description: "Alineadores transparentes Invisalign",
        totalAmount: 35000,
        status: "IN_PROGRESS",
        patientId: valentina.id,
        dentistId: drRamirez.id,
        payments: {
          create: [
            { amount: 10000, method: "CARD", note: "Enganche" },
            { amount: 5000, method: "TRANSFER", note: "Mensualidad 1" },
          ],
        },
      },
    }),

    // Miguel – Sin tratamientos activos, cancelado
    prisma.treatment.create({
      data: {
        description: "Corona dental pieza 16",
        totalAmount: 6000,
        status: "CANCELLED",
        patientId: miguel.id,
        dentistId: drMendez.id,
      },
    }),
  ]);
  console.log("💊 8 tratamientos creados (con pagos)");

  // ─── Citas ────────────────────────────────────────────
  // Función auxiliar: fecha relativa a hoy
  const d = (offsetDays: number, hour: number, minute = 0) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(hour, minute, 0, 0);
    return dt;
  };

  await Promise.all([
    // HOY
    prisma.appointment.create({
      data: {
        title: "Revisión ortodoncia",
        description: "Ajuste de brackets, arco superior",
        date: d(0, 9, 0),
        duration: 30,
        status: "CONFIRMED",
        patientId: maria.id,
        dentistId: drRamirez.id,
        whatsappSent: true,
      },
    }),
    prisma.appointment.create({
      data: {
        title: "Control endodoncia",
        description: "Verificar cicatrización post-tratamiento",
        date: d(0, 11, 0),
        duration: 45,
        status: "SCHEDULED",
        patientId: jose.id,
        dentistId: draLopez.id,
        whatsappSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        title: "Colocación implante fase 2",
        description: "Colocación de corona sobre implante",
        date: d(0, 14, 30),
        duration: 90,
        status: "CONFIRMED",
        patientId: ana.id,
        dentistId: drMendez.id,
        whatsappSent: true,
      },
    }),

    // MAÑANA
    prisma.appointment.create({
      data: {
        title: "Limpieza dental",
        description: "Profilaxis y revisión general",
        date: d(1, 10, 0),
        duration: 60,
        status: "SCHEDULED",
        patientId: carmen.id,
        dentistId: drRamirez.id,
        whatsappSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        title: "Extracción pieza 28",
        date: d(1, 16, 0),
        duration: 60,
        status: "SCHEDULED",
        patientId: roberto.id,
        dentistId: draLopez.id,
        whatsappSent: false,
      },
    }),

    // EN 3 DÍAS
    prisma.appointment.create({
      data: {
        title: "Ajuste alineadores",
        description: "Cambio a fase 3 de alineadores",
        date: d(3, 9, 30),
        duration: 30,
        status: "SCHEDULED",
        patientId: valentina.id,
        dentistId: drRamirez.id,
        whatsappSent: false,
      },
    }),
    prisma.appointment.create({
      data: {
        title: "Primera consulta",
        description: "Evaluación inicial y plan de tratamiento",
        date: d(3, 12, 0),
        duration: 60,
        status: "SCHEDULED",
        patientId: luis.id,
        dentistId: drMendez.id,
        whatsappSent: false,
      },
    }),

    // EN 7 DÍAS
    prisma.appointment.create({
      data: {
        title: "Revisión mensual ortodoncia",
        date: d(7, 10, 0),
        duration: 30,
        status: "SCHEDULED",
        patientId: maria.id,
        dentistId: drRamirez.id,
        whatsappSent: false,
      },
    }),

    // AYER (completada)
    prisma.appointment.create({
      data: {
        title: "Diagnóstico y radiografías",
        description: "Panorámica y periapical",
        date: d(-1, 14, 0),
        duration: 45,
        status: "COMPLETED",
        patientId: miguel.id,
        dentistId: drMendez.id,
        whatsappSent: true,
      },
    }),

    // HACE 3 DÍAS (no asistió)
    prisma.appointment.create({
      data: {
        title: "Control post extracción",
        date: d(-3, 11, 0),
        duration: 30,
        status: "NO_SHOW",
        patientId: roberto.id,
        dentistId: draLopez.id,
        whatsappSent: true,
      },
    }),
  ]);
  console.log("📅 10 citas creadas (hoy, mañana, próximos días, pasadas)");

  // ─── Resumen ──────────────────────────────────────────
  const totals = await Promise.all([
    prisma.patient.count(),
    prisma.dentist.count(),
    prisma.treatment.count(),
    prisma.payment.count(),
    prisma.appointment.count(),
  ]);

  console.log("\n✅ Seed completado:");
  console.log(`   👥 Pacientes:    ${totals[0]}`);
  console.log(`   🦷 Dentistas:    ${totals[1]}`);
  console.log(`   💊 Tratamientos: ${totals[2]}`);
  console.log(`   💰 Pagos:        ${totals[3]}`);
  console.log(`   📅 Citas:        ${totals[4]}`);
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
