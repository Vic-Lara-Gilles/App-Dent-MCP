import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { dentistRepository } from "@/lib/repositories/dentist.repository";
import { createDentistSchema, updateDentistSchema } from "@/lib/schemas";


export const dentistService = {
  async list(params: { search?: string; page?: number; limit?: number }) {
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

    const [data, total] = await Promise.all([
      dentistRepository.findMany({ where, skip, take: limit }),
      dentistRepository.count(where),
    ]);

    return { data, total, page, limit };
  },

  async getById(id: string) {
    const dentist = await dentistRepository.findById(id);
    if (!dentist) throw new NotFoundError("Dentista");
    return dentist;
  },

  async create(input: unknown) {
    const parsed = createDentistSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const existing = await dentistRepository.findMany({
      where: { phone: parsed.data.phone },
    });
    if (existing.length > 0) throw new ConflictError("Ya existe un dentista con ese teléfono");

    return dentistRepository.create(parsed.data);
  },

  async update(id: string, input: unknown) {
    const parsed = updateDentistSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const dentist = await dentistRepository.findById(id);
    if (!dentist) throw new NotFoundError("Dentista");

    return dentistRepository.update(id, parsed.data);
  },

  async delete(id: string) {
    const dentist = await dentistRepository.findById(id);
    if (!dentist) throw new NotFoundError("Dentista");
    await dentistRepository.delete(id);
    return { message: "Dentista eliminado" };
  },
};
