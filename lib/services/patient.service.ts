import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { patientRepository } from "@/lib/repositories";
import { createPatientSchema, updatePatientSchema } from "@/lib/schemas";
import type {
  CreatePatientData,
  PatientSearchParams,
  UpdatePatientData,
} from "@/lib/types";

// ─── Debt Calculator ─────────────────────────────────
// SRP: Single, reusable function for debt calculation (eliminates duplication)

function calcDebt(treatments: { totalAmount: unknown; payments: { amount: unknown }[] }[]): number {
  return treatments.reduce((sum, t) => {
    const paid = t.payments.reduce((s, p) => s + Number(p.amount), 0);
    return sum + (Number(t.totalAmount) - paid);
  }, 0);
}

// ─── Patient Service ─────────────────────────────────
// SRP: Only responsible for business logic and orchestration
// OCP: New business rules can be added without touching repository or routes
// DIP: Depends on repository abstraction, not directly on Prisma

export const patientService = {
  async list(params: PatientSearchParams & { dentistId?: string }) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(50, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where = params.search
      ? {
        OR: [
          { firstName: { contains: params.search, mode: "insensitive" as const } },
          { lastName: { contains: params.search, mode: "insensitive" as const } },
          { phone: { contains: params.search } },
        ],
      }
      : undefined;

    const [patients, total] = await Promise.all([
      patientRepository.findMany({ where, skip, take: limit, dentistId: params.dentistId }),
      patientRepository.count(where, params.dentistId),
    ]);

    const data = patients.map((patient) => ({
      ...patient,
      totalDebt: Math.max(0, calcDebt(patient.treatments)),
    }));

    return { data, total, page, limit };
  },

  async getById(id: string) {
    const patient = await patientRepository.findById(id);
    if (!patient) throw new NotFoundError("Paciente");

    const totalDebt = Math.max(0, calcDebt(patient.treatments));
    return { ...patient, totalDebt };
  },

  async create(input: CreatePatientData) {
    const parsed = createPatientSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const existing = await patientRepository.findByPhone(parsed.data.phone);
    if (existing) throw new ConflictError("Ya existe un paciente con este teléfono");

    return patientRepository.create({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    });
  },

  async update(id: string, input: UpdatePatientData) {
    const parsed = updatePatientSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const existing = await patientRepository.findById(id);
    if (!existing) throw new NotFoundError("Paciente");

    if (parsed.data.phone && parsed.data.phone !== existing.phone) {
      const phoneExists = await patientRepository.findByPhone(parsed.data.phone);
      if (phoneExists) throw new ConflictError("Ya existe un paciente con este teléfono");
    }

    return patientRepository.update(id, {
      ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
      ...(parsed.data.lastName !== undefined && { lastName: parsed.data.lastName }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
      ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
    });
  },

  async delete(id: string) {
    const existing = await patientRepository.findById(id);
    if (!existing) throw new NotFoundError("Paciente");

    await patientRepository.delete(id);
    return { message: "Paciente eliminado" };
  },
};
