import type { AuthContext } from "@/lib/auth/middleware";
import { dentistScope, requireAdmin, assertOwned } from "@/lib/auth/access";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import { dentistRepository } from "@/lib/repositories/dentist.repository";
import { createDentistSchema, updateDentistSchema, paginationSchema } from "@/lib/schemas";


export const dentistService = {
  async list(params: { search?: string; page?: number; limit?: number }, auth: AuthContext) {
    const dentistId = dentistScope(auth);
    const pagination = paginationSchema.safeParse(params);
    if (!pagination.success) throw new ValidationError(pagination.error.issues);
    const { page, limit } = pagination.data;
    const skip = (page - 1) * limit;

    const searchWhere = params.search
      ? {
        OR: [
          { firstName: { contains: params.search, mode: "insensitive" as const } },
          { lastName: { contains: params.search, mode: "insensitive" as const } },
          { phone: { contains: params.search } },
        ],
      }
      : undefined;

    const where = { ...searchWhere, ...(dentistId && { id: dentistId }) };
    const [data, total] = await Promise.all([
      dentistRepository.findMany({ where, skip, take: limit }),
      dentistRepository.count(where),
    ]);

    return { data, total, page, limit };
  },

  async getById(id: string, auth: AuthContext) {
    assertOwned(auth, id, "Dentista");
    const dentist = await dentistRepository.findById(id);
    if (!dentist) throw new NotFoundError("Dentista");
    return dentist;
  },

  async create(input: unknown, auth: AuthContext) {
    requireAdmin(auth);
    const parsed = createDentistSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const existing = await dentistRepository.findMany({
      where: { phone: parsed.data.phone },
    });
    if (existing.length > 0) throw new ConflictError("Ya existe un dentista con ese teléfono");

    return dentistRepository.create(parsed.data);
  },

  async update(id: string, input: unknown, auth: AuthContext) {
    requireAdmin(auth);
    const parsed = updateDentistSchema.safeParse(input);
    if (!parsed.success) throw new ValidationError(parsed.error.issues);

    const dentist = await dentistRepository.findById(id);
    if (!dentist) throw new NotFoundError("Dentista");

    return dentistRepository.update(id, parsed.data);
  },

  async delete(id: string, auth: AuthContext) {
    requireAdmin(auth);
    const dentist = await dentistRepository.findById(id);
    if (!dentist) throw new NotFoundError("Dentista");
    await dentistRepository.delete(id);
    return { message: "Dentista eliminado" };
  },
};
