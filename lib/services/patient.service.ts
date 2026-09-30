import type { AuthContext } from "@/lib/auth/middleware";
import { dentistScope, requireAdmin } from "@/lib/auth/access";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { calcDebt } from "@/lib/finance";
import { patientRepository } from "@/lib/repositories/patient.repository";
import { createPatientSchema, updatePatientSchema, patientDentistsSchema, paginationSchema } from "@/lib/schemas";
import type {
  CreatePatientData,
  PatientSearchParams,
  UpdatePatientData,
} from "@/lib/types/patient";

// ─── Patient Service ─────────────────────────────────
// SRP: Only responsible for business logic and orchestration
// OCP: New business rules can be added without touching repository or routes
// DIP: Depends on repository abstraction, not directly on Prisma

export const patientService = {
  async list(params: PatientSearchParams, auth: AuthContext) {
    const dentistId = dentistScope(auth);
    const pagination = paginationSchema.safeParse(params);
    if (!pagination.success) throw new ValidationError(pagination.error.issues);
    const page = pagination.data.page;
    const limit = pagination.data.limit;
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
      patientRepository.findMany({ where, skip, take: limit, dentistId: dentistId }),
      patientRepository.count(where, dentistId),
    ]);

    const data = patients.map((patient) => ({
      ...patient,
      totalDebt: Math.max(0, calcDebt(patient.treatments)),
    }));

    return { data, total, page, limit };
  },

  async getById(id: string, auth: AuthContext) {
    const patient = await patientRepository.findById(id, dentistScope(auth));
    if (!patient) throw new NotFoundError("Paciente");

    const totalDebt = Math.max(0, calcDebt(patient.treatments));
    return { ...patient, totalDebt };
  },

  async create(input: CreatePatientData, auth: AuthContext) {
    const dentistId = dentistScope(auth);
    const parsed = createPatientSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const existing = await patientRepository.findByPhone(parsed.data.phone);
    if (existing) throw new ConflictError("Ya existe un paciente con este teléfono");

    return patientRepository.create({
      ...(dentistId && { dentists: { create: { dentistId } } }),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      rut: parsed.data.rut || null,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    });
  },

  async update(id: string, input: UpdatePatientData, auth: AuthContext) {
    const parsed = updatePatientSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const existing = await patientRepository.findById(id, dentistScope(auth));
    if (!existing) throw new NotFoundError("Paciente");

    if (parsed.data.avatarUrl !== undefined && parsed.data.avatarUrl !== null) {
      const photos = await patientRepository.listPhotos(id);
      if (!photos.some(photo => photo.url === parsed.data.avatarUrl && !photo.url.endsWith(".pdf"))) {
        throw new ValidationError("El avatar debe ser una imagen del paciente");
      }
    }

    if (parsed.data.phone && parsed.data.phone !== existing.phone) {
      const phoneExists = await patientRepository.findByPhone(parsed.data.phone);
      if (phoneExists) throw new ConflictError("Ya existe un paciente con este teléfono");
    }

    return patientRepository.update(id, {
      ...(parsed.data.firstName !== undefined && { firstName: parsed.data.firstName }),
      ...(parsed.data.lastName !== undefined && { lastName: parsed.data.lastName }),
      ...(parsed.data.rut !== undefined && { rut: parsed.data.rut || null }),
      ...(parsed.data.phone !== undefined && { phone: parsed.data.phone }),
      ...(parsed.data.email !== undefined && { email: parsed.data.email || null }),
      ...(parsed.data.notes !== undefined && { notes: parsed.data.notes || null }),
      ...(parsed.data.avatarUrl !== undefined && { avatarUrl: parsed.data.avatarUrl }),
    }, dentistScope(auth));
  },

  async setDentists(id: string, input: unknown, auth: AuthContext) {
    requireAdmin(auth);
    await this.getById(id, auth);
    const parsed = patientDentistsSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);
    return patientRepository.setDentists(id, [...new Set(parsed.data.dentistIds)]);
  },

  async delete(id: string, auth: AuthContext) {
    requireAdmin(auth);
    const existing = await patientRepository.findById(id, dentistScope(auth));
    if (!existing) throw new NotFoundError("Paciente");

    await patientRepository.delete(id);
    return { message: "Paciente eliminado" };
  },
};
