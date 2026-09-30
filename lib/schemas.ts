import { z } from "zod/v4";
import { decimal } from "./finance";

export const moneySchema = z.coerce.number().positive("El monto debe ser mayor a 0")
  .max(99999999.99, "Monto fuera de rango")
  .refine(value => decimal(value).decimalPlaces() <= 2, "Usa como máximo dos decimales");
export const patientDentistsSchema = z.object({ dentistIds: z.array(z.string().min(1)).max(100) });
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ─── Patient ─────────────────────────────────────────

export const createPatientSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  rut: z.string().optional().or(z.literal("")),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.email().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export const updatePatientSchema = createPatientSchema.partial().extend({
  avatarUrl: z.string().nullable().optional(),
});

// ─── Treatment ───────────────────────────────────────

export const createTreatmentSchema = z.object({
  description: z.string().min(1, "Descripción requerida"),
  totalAmount: moneySchema,
  patientId: z.string().min(1),
  dentistId: z.string().optional(),
});

export const updateTreatmentSchema = z.object({
  description: z.string().min(1).optional(),
  totalAmount: moneySchema.optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});

// ─── Payment ─────────────────────────────────────────

export const createPaymentSchema = z.object({
  amount: moneySchema,
  method: z.enum(["CASH", "TRANSFER", "CARD", "OTHER"]).default("CASH"),
  note: z.string().optional(),
  treatmentId: z.string().min(1),
});

// ─── Appointment ─────────────────────────────────────

export const createAppointmentSchema = z.object({
  title: z.string().min(1, "Título requerido"),
  description: z.string().optional(),
  date: z.coerce.date(),
  duration: z.coerce.number().int().positive().default(30),
  patientId: z.string().min(1),
  dentistId: z.string().optional(),
});

export const updateAppointmentSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  date: z.coerce.date().optional(),
  duration: z.coerce.number().int().positive().optional(),
  status: z
    .enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"])
    .optional(),
  dentistId: z.string().nullable().optional(),
});

// ─── Dentist ─────────────────────────────────────────

export const createDentistSchema = z.object({
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  phone: z.string().min(7, "Teléfono inválido"),
  email: z.email().optional().or(z.literal("")),
  specialty: z.string().optional(),
});

export const updateDentistSchema = createDentistSchema.partial();

export const treatmentSearchSchema = paginationSchema.extend({
  patientId: z.string().min(1).optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
});
export const appointmentSearchSchema = paginationSchema.extend({
  patientId: z.string().min(1).optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"]).optional(),
  dateFrom: z.date().optional(), dateTo: z.date().optional(),
}).refine(params => !params.dateFrom || !params.dateTo || params.dateFrom <= params.dateTo, "Rango de fechas inválido");
